import { Router, type IRouter } from "express";
import { db, chatHistoryTable } from "@workspace/db";
import { eq, asc, desc } from "drizzle-orm";
import { type AuthedRequest, requireAuth } from "../lib/auth";
import { PostChatBody, PostChatResponse, GetChatHistoryResponse } from "@workspace/api-zod";
import { geminiChat, type GeminiChatHistoryItem } from "../lib/geminiChat";

const router: IRouter = Router();

router.post("/chat", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.sub;
  const parse = PostChatBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { message, imageBase64, imageMimeType } = parse.data;

  // Load last 10 messages for context
  const recent = await db
    .select()
    .from(chatHistoryTable)
    .where(eq(chatHistoryTable.userId, userId))
    .orderBy(desc(chatHistoryTable.createdAt))
    .limit(10);
  const history: GeminiChatHistoryItem[] = recent
    .reverse()
    .map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.content }));

  const reply = await geminiChat({ message, imageBase64, imageMimeType, history });

  // Persist both sides
  await db.insert(chatHistoryTable).values([
    { userId, role: "user", content: message, hasImage: !!imageBase64 },
    { userId, role: "assistant", content: reply, hasImage: false },
  ]);

  res.json(PostChatResponse.parse({ reply }));
});

router.get("/chat/history", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.sub;
  const rows = await db
    .select()
    .from(chatHistoryTable)
    .where(eq(chatHistoryTable.userId, userId))
    .orderBy(asc(chatHistoryTable.createdAt))
    .limit(100);
  res.json(
    GetChatHistoryResponse.parse({
      messages: rows.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        hasImage: m.hasImage,
        createdAt: m.createdAt.toISOString(),
      })),
    }),
  );
});

export default router;

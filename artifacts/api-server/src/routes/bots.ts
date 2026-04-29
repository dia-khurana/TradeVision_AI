import { Router, type IRouter } from "express";
import { db, botsTable, botTradesTable } from "@workspace/db";
import { and, eq, desc } from "drizzle-orm";
import { type AuthedRequest, requireAuth } from "../lib/auth";
import { getBotPerformance } from "../lib/botEngine";
import {
  GetBotsResponse,
  CreateBotResponse,
  CreateBotBody,
  GetBotTradesResponse,
  GetBotPerformanceResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toApiBot(b: typeof botsTable.$inferSelect): unknown {
  return {
    id: b.id,
    name: b.name,
    type: b.type,
    status: b.status,
    capital: b.capital,
    pnl: b.pnl,
    tradesCount: b.tradesCount,
    winRate: b.winRate,
    config: b.config,
    createdAt: b.createdAt.toISOString(),
  };
}

router.get("/bots", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.sub;
  const rows = await db
    .select()
    .from(botsTable)
    .where(eq(botsTable.userId, userId))
    .orderBy(desc(botsTable.createdAt));
  res.json(GetBotsResponse.parse({ bots: rows.map(toApiBot) }));
});

router.post("/bots", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.sub;
  const parse = CreateBotBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid bot config" });
    return;
  }
  const { name, type, capital, config } = parse.data;
  const inserted = await db
    .insert(botsTable)
    .values({
      userId,
      name,
      type,
      capital,
      config,
      status: "stopped",
    })
    .returning();
  res.json(CreateBotResponse.parse(toApiBot(inserted[0])));
});

router.put("/bots/:id/toggle", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.sub;
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const rows = await db
    .select()
    .from(botsTable)
    .where(and(eq(botsTable.id, id), eq(botsTable.userId, userId)))
    .limit(1);
  if (rows.length === 0) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }
  const next = rows[0].status === "running" ? "stopped" : "running";
  const updated = await db
    .update(botsTable)
    .set({ status: next })
    .where(eq(botsTable.id, id))
    .returning();
  res.json(CreateBotResponse.parse(toApiBot(updated[0])));
});

router.get("/bots/:id/trades", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.sub;
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  // Ensure bot belongs to user
  const owned = await db
    .select({ id: botsTable.id })
    .from(botsTable)
    .where(and(eq(botsTable.id, id), eq(botsTable.userId, userId)))
    .limit(1);
  if (owned.length === 0) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }
  const trades = await db
    .select()
    .from(botTradesTable)
    .where(eq(botTradesTable.botId, id))
    .orderBy(desc(botTradesTable.executedAt))
    .limit(100);
  res.json(
    GetBotTradesResponse.parse({
      trades: trades.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        action: t.action,
        price: t.price,
        qty: t.qty,
        pnl: t.pnl,
        executedAt: t.executedAt.toISOString(),
      })),
    }),
  );
});

router.get("/bots/:id/performance", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.sub;
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const owned = await db
    .select({ id: botsTable.id })
    .from(botsTable)
    .where(and(eq(botsTable.id, id), eq(botsTable.userId, userId)))
    .limit(1);
  if (owned.length === 0) {
    res.status(404).json({ error: "Bot not found" });
    return;
  }
  const points = await getBotPerformance(id);
  res.json(GetBotPerformanceResponse.parse({ points }));
});

export default router;

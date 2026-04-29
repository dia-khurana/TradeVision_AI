import { Router, type IRouter } from "express";
import { db, alertsTable } from "@workspace/db";
import { desc, eq, and, or, isNull } from "drizzle-orm";
import { GetAlertsResponse, MarkAlertReadResponse } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/alerts", requireAuth, async (req, res) => {
  const userId = (req as AuthedRequest).user!.sub;
  const rows = await db
    .select()
    .from(alertsTable)
    .where(or(eq(alertsTable.userId, userId), isNull(alertsTable.userId)))
    .orderBy(desc(alertsTable.createdAt))
    .limit(20);

  const alerts = rows.map((a) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    severity: a.severity,
    isRead: a.isRead,
    createdAt: a.createdAt.toISOString(),
  }));

  res.json(GetAlertsResponse.parse({ alerts }));
});

router.post("/alerts/read/:id", requireAuth, async (req, res) => {
  const id = Number(req.params["id"]);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const userId = (req as AuthedRequest).user!.sub;
  // Only mark alerts the user owns (or shared/global with userId NULL)
  await db
    .update(alertsTable)
    .set({ isRead: true })
    .where(
      and(
        eq(alertsTable.id, id),
        or(eq(alertsTable.userId, userId), isNull(alertsTable.userId)),
      ),
    );
  res.json(MarkAlertReadResponse.parse({ ok: true }));
});

export default router;

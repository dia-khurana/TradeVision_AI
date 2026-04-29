import { Router, type IRouter } from "express";
import { db, alertsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { GetAlertsResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/alerts", requireAuth, async (_req, res) => {
  const rows = await db
    .select()
    .from(alertsTable)
    .orderBy(desc(alertsTable.createdAt))
    .limit(20);

  const alerts = rows.map((a) => ({
    id: a.id,
    type: a.type,
    message: a.message,
    severity: a.severity,
    createdAt: a.createdAt.toISOString(),
  }));

  res.json(GetAlertsResponse.parse({ alerts }));
});

export default router;

import { Router, type IRouter } from "express";
import { db, signalsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { GetSignalsResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/signals", requireAuth, async (_req, res) => {
  // Return the latest signal per symbol
  const subquery = db
    .select({
      symbol: signalsTable.symbol,
      maxId: sql<number>`max(${signalsTable.id})`.as("max_id"),
    })
    .from(signalsTable)
    .groupBy(signalsTable.symbol)
    .as("latest");

  const rows = await db
    .select()
    .from(signalsTable)
    .innerJoin(subquery, sql`${signalsTable.id} = ${subquery.maxId}`)
    .orderBy(desc(signalsTable.createdAt))
    .limit(50);

  const signals = rows.map((r) => ({
    id: r.signals.id,
    symbol: r.signals.symbol,
    action: r.signals.action,
    type: r.signals.type,
    entry: r.signals.entry,
    target: r.signals.target,
    sl: r.signals.sl,
    confidence: r.signals.confidence,
    rationale: r.signals.rationale,
    createdAt: r.signals.createdAt.toISOString(),
  }));

  res.json(
    GetSignalsResponse.parse({ signals, updatedAt: new Date().toISOString() }),
  );
});

export default router;

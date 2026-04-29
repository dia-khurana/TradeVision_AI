import { Router, type IRouter } from "express";
import { db, signalsTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { GetSignalsResponse, GetFoSignalsResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function latestSignals(typeFilter?: string[]) {
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

  let signals = rows.map((r) => ({
    id: r.signals.id,
    symbol: r.signals.symbol,
    action: r.signals.action,
    type: r.signals.type,
    strategy: r.signals.strategy || "",
    entry: r.signals.entry,
    target: r.signals.target,
    sl: r.signals.sl,
    confidence: r.signals.confidence,
    rationale: r.signals.rationale,
    createdAt: r.signals.createdAt.toISOString(),
  }));
  if (typeFilter) signals = signals.filter((s) => typeFilter.includes(s.type));
  return signals;
}

router.get("/signals", requireAuth, async (_req, res) => {
  const signals = await latestSignals(["EQUITY"]);
  res.json(GetSignalsResponse.parse({ signals, updatedAt: new Date().toISOString() }));
});

router.get("/signals/fo", requireAuth, async (_req, res) => {
  const signals = await latestSignals(["FNO", "VIX"]);
  res.json(GetFoSignalsResponse.parse({ signals, updatedAt: new Date().toISOString() }));
});

// Helpful for non-typescript clients: keep eq import used
void eq;

export default router;

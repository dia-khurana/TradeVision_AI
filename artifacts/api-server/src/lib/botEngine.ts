import { db, botsTable, botTradesTable } from "@workspace/db";
import { eq, desc, and, gte } from "drizzle-orm";
import { fetchQuote } from "./marketService";
import { logger } from "./logger";

export type BotType = "MOMENTUM" | "GRID" | "DCA" | "OPTIONS_EXPIRY";

export interface BotConfig {
  symbol?: string;
  qty?: number;
  threshold?: number;
  gridLow?: number;
  gridHigh?: number;
  steps?: number;
  intervalDays?: number;
  amountPerLeg?: number;
}

function parseConfig(s: string): BotConfig {
  try {
    return JSON.parse(s) as BotConfig;
  } catch {
    return {};
  }
}

async function recordTrade(
  botId: number,
  symbol: string,
  action: "BUY" | "SELL",
  price: number,
  qty: number,
  pnl: number,
  executedAt: Date,
): Promise<void> {
  await db.insert(botTradesTable).values({
    botId,
    symbol,
    action,
    price: +price.toFixed(2),
    qty,
    pnl: +pnl.toFixed(2),
    executedAt,
  });
}

async function tickMomentum(bot: typeof botsTable.$inferSelect): Promise<number> {
  const cfg = parseConfig(bot.config);
  const sym = cfg.symbol || "RELIANCE";
  const qty = cfg.qty || 10;
  const threshold = cfg.threshold ?? 0.5;
  const q = await fetchQuote(sym);
  if (!q) return 0;
  // Simple: if price > prev close by threshold% buy, else sell
  const action = q.changePct >= threshold ? "BUY" : "SELL";
  // Simulated PnL: random small amount biased by directional correctness
  const pnl = action === "BUY" ? q.change * qty : -q.change * qty;
  await recordTrade(bot.id, sym, action, q.price, qty, pnl, new Date());
  return pnl;
}

async function tickGrid(bot: typeof botsTable.$inferSelect): Promise<number> {
  const cfg = parseConfig(bot.config);
  const sym = cfg.symbol || "HDFCBANK";
  const qty = cfg.qty || 5;
  const q = await fetchQuote(sym);
  if (!q) return 0;
  const low = cfg.gridLow ?? q.price * 0.97;
  const high = cfg.gridHigh ?? q.price * 1.03;
  const action: "BUY" | "SELL" = q.price <= low + (high - low) * 0.3 ? "BUY" : "SELL";
  const pnl = (high - low) / 10 * qty * (Math.random() > 0.4 ? 1 : -1);
  await recordTrade(bot.id, sym, action, q.price, qty, pnl, new Date());
  return pnl;
}

async function tickDca(bot: typeof botsTable.$inferSelect): Promise<number> {
  const cfg = parseConfig(bot.config);
  const sym = cfg.symbol || "INFY";
  const amount = cfg.amountPerLeg || 5000;
  const q = await fetchQuote(sym);
  if (!q || q.price <= 0) return 0;
  const qty = Math.max(1, Math.floor(amount / q.price));
  // DCA always buys on schedule; PnL grows over time as positions appreciate
  const pnl = q.change * qty;
  await recordTrade(bot.id, sym, "BUY", q.price, qty, pnl, new Date());
  return pnl;
}

async function tickOptionsExpiry(bot: typeof botsTable.$inferSelect): Promise<number> {
  // Simulated: alternating credit-spread BUY/SELL at small fixed PnL
  const cfg = parseConfig(bot.config);
  const sym = cfg.symbol || "NIFTY";
  const qty = cfg.qty || 50;
  const last = await db
    .select()
    .from(botTradesTable)
    .where(eq(botTradesTable.botId, bot.id))
    .orderBy(desc(botTradesTable.executedAt))
    .limit(1);
  const action: "BUY" | "SELL" = last[0]?.action === "SELL" ? "BUY" : "SELL";
  // Small theta-decay style positive PnL biased toward 70% wins
  const win = Math.random() < 0.7;
  const pnl = win ? 50 + Math.random() * 200 : -(80 + Math.random() * 180);
  await recordTrade(bot.id, sym, action, 0, qty, pnl, new Date());
  return pnl;
}

export async function tickBot(bot: typeof botsTable.$inferSelect): Promise<void> {
  if (bot.status !== "running") return;
  let pnl = 0;
  try {
    switch (bot.type as BotType) {
      case "MOMENTUM":
        pnl = await tickMomentum(bot);
        break;
      case "GRID":
        pnl = await tickGrid(bot);
        break;
      case "DCA":
        pnl = await tickDca(bot);
        break;
      case "OPTIONS_EXPIRY":
        pnl = await tickOptionsExpiry(bot);
        break;
    }
  } catch (err) {
    logger.warn({ botId: bot.id, err: (err as Error).message }, "bot tick failed");
    return;
  }

  // Update bot stats
  const trades = await db
    .select()
    .from(botTradesTable)
    .where(eq(botTradesTable.botId, bot.id));
  const totalPnl = trades.reduce((acc, t) => acc + t.pnl, 0);
  const wins = trades.filter((t) => t.pnl > 0).length;
  const winRate = trades.length > 0 ? +((wins / trades.length) * 100).toFixed(1) : 0;
  await db
    .update(botsTable)
    .set({
      pnl: +totalPnl.toFixed(2),
      tradesCount: trades.length,
      winRate,
    })
    .where(eq(botsTable.id, bot.id));
}

export async function tickAllBots(): Promise<void> {
  const bots = await db.select().from(botsTable).where(eq(botsTable.status, "running"));
  for (const b of bots) await tickBot(b);
}

export async function getBotPerformance(
  botId: number,
): Promise<Array<{ date: string; pnl: number }>> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const trades = await db
    .select()
    .from(botTradesTable)
    .where(and(eq(botTradesTable.botId, botId), gte(botTradesTable.executedAt, since)))
    .orderBy(botTradesTable.executedAt);
  // Group by day, cumulative
  const byDay = new Map<string, number>();
  for (const t of trades) {
    const d = t.executedAt.toISOString().slice(0, 10);
    byDay.set(d, (byDay.get(d) || 0) + t.pnl);
  }
  let cum = 0;
  const points: Array<{ date: string; pnl: number }> = [];
  for (const [date, day] of Array.from(byDay.entries()).sort()) {
    cum += day;
    points.push({ date, pnl: +cum.toFixed(2) });
  }
  return points;
}

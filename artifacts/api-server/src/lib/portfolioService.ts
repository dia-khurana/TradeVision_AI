import { db, portfolioTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { fetchQuotesBatch } from "./marketService";
import { symbolMeta } from "./symbols";

export interface PortfolioRowItem {
  id: number;
  symbol: string;
  assetType: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
  dayPnl: number;
  sector: string;
}

export interface PortfolioPayload {
  rows: PortfolioRowItem[];
  invested: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPct: number;
  dayPnl: number;
  sectorAllocation: Array<{ sector: string; value: number }>;
  updatedAt: string;
}

export async function getPortfolioForUser(userId: number): Promise<PortfolioPayload> {
  const positions = await db
    .select()
    .from(portfolioTable)
    .where(eq(portfolioTable.userId, userId));

  // Single batched quote round-trip (cache-aware) instead of N sequential NSE/Yahoo calls.
  const quotes = await fetchQuotesBatch(positions.map((p) => p.symbol));

  const rows: PortfolioRowItem[] = [];
  let invested = 0;
  let currentValue = 0;
  let dayPnl = 0;

  for (const p of positions) {
    const q = quotes.get(p.symbol.toUpperCase());
    const currentPrice = q?.price ?? p.avgPrice;
    const sector = p.sector || symbolMeta(p.symbol).sector;
    const inv = p.qty * p.avgPrice;
    const cv = p.qty * currentPrice;
    const dayChange = q?.change ?? 0;
    const dPnl = p.qty * dayChange;

    rows.push({
      id: p.id,
      symbol: p.symbol,
      assetType: p.assetType,
      qty: p.qty,
      avgPrice: p.avgPrice,
      currentPrice,
      invested: +inv.toFixed(2),
      currentValue: +cv.toFixed(2),
      pnl: +(cv - inv).toFixed(2),
      pnlPct: inv > 0 ? +(((cv - inv) / inv) * 100).toFixed(2) : 0,
      dayPnl: +dPnl.toFixed(2),
      sector,
    });
    invested += inv;
    currentValue += cv;
    dayPnl += dPnl;
  }

  const sectorMap = new Map<string, number>();
  for (const r of rows) sectorMap.set(r.sector, (sectorMap.get(r.sector) || 0) + r.currentValue);
  const sectorAllocation = Array.from(sectorMap.entries()).map(([sector, value]) => ({
    sector,
    value: +value.toFixed(2),
  }));

  return {
    rows,
    invested: +invested.toFixed(2),
    currentValue: +currentValue.toFixed(2),
    totalPnl: +(currentValue - invested).toFixed(2),
    totalPnlPct: invested > 0 ? +(((currentValue - invested) / invested) * 100).toFixed(2) : 0,
    dayPnl: +dayPnl.toFixed(2),
    sectorAllocation,
    updatedAt: new Date().toISOString(),
  };
}

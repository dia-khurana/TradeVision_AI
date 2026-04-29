import { fetchQuote, fetchHistory } from "./marketService";
import { TRACKED_SYMBOLS, symbolMeta } from "./symbols";

export interface ScreenerRow {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  rsi: number;
  sector: string;
  signal: string;
}

function rsi14(closes: number[]): number {
  if (closes.length < 15) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - 14; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  if (gains + losses === 0) return 50;
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return +(100 - 100 / (1 + rs)).toFixed(1);
}

export async function runScreener(filters: {
  sector?: string;
  minPrice?: number;
  maxPrice?: number;
  minRsi?: number;
  maxRsi?: number;
}): Promise<ScreenerRow[]> {
  const out: ScreenerRow[] = [];
  for (const meta of TRACKED_SYMBOLS) {
    if (filters.sector && filters.sector !== meta.sector) continue;
    const q = await fetchQuote(meta.symbol);
    if (!q) continue;
    if (filters.minPrice !== undefined && q.price < filters.minPrice) continue;
    if (filters.maxPrice !== undefined && q.price > filters.maxPrice) continue;

    const hist = await fetchHistory(meta.symbol);
    const closes = hist.candles.map((c) => c.close);
    const r = rsi14(closes);
    if (filters.minRsi !== undefined && r < filters.minRsi) continue;
    if (filters.maxRsi !== undefined && r > filters.maxRsi) continue;

    let signal = "Neutral";
    if (r >= 70) signal = "Overbought";
    else if (r <= 30) signal = "Oversold";
    else if (q.changePct > 2) signal = "Bullish";
    else if (q.changePct < -2) signal = "Bearish";

    out.push({
      symbol: meta.symbol,
      name: meta.name,
      price: q.price,
      changePct: q.changePct,
      rsi: r,
      sector: meta.sector,
      signal,
    });
  }
  return out.sort((a, b) => b.changePct - a.changePct);
}

export const SECTORS = Array.from(new Set(TRACKED_SYMBOLS.map((s) => s.sector)));
export { symbolMeta };

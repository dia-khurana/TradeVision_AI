import axios from "axios";
import { logger } from "./logger";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
};

const yahoo = axios.create({
  timeout: 10_000,
  headers: HEADERS,
  validateStatus: (s) => s >= 200 && s < 500,
});

export interface YahooChartPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface YahooQuoteSummary {
  price: number;
  change: number;
  changePct: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  prevClose: number;
  volume: number;
  marketCap: number;
  pe: number;
  weekHigh52: number;
  weekLow52: number;
  name: string;
}

export async function yahooChart(
  symbol: string,
  range = "6mo",
  interval = "1d",
): Promise<YahooChartPoint[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    const res = await yahoo.get(url);
    if (res.status >= 400 || !res.data?.chart?.result?.[0]) {
      logger.warn({ symbol, status: res.status }, "yahoo chart failed");
      return [];
    }
    const r = res.data.chart.result[0];
    const ts: number[] = r.timestamp ?? [];
    const q = r.indicators?.quote?.[0] ?? {};
    const opens: number[] = q.open ?? [];
    const highs: number[] = q.high ?? [];
    const lows: number[] = q.low ?? [];
    const closes: number[] = q.close ?? [];
    const volumes: number[] = q.volume ?? [];

    const out: YahooChartPoint[] = [];
    for (let i = 0; i < ts.length; i++) {
      const c = closes[i];
      if (c === null || c === undefined || !Number.isFinite(c)) continue;
      out.push({
        time: new Date(ts[i] * 1000).toISOString().slice(0, 10),
        open: Number(opens[i] ?? c),
        high: Number(highs[i] ?? c),
        low: Number(lows[i] ?? c),
        close: Number(c),
        volume: Number(volumes[i] ?? 0),
      });
    }
    return out;
  } catch (err) {
    logger.warn({ symbol, err: (err as Error).message }, "yahoo chart error");
    return [];
  }
}

export async function yahooQuoteSummary(
  symbol: string,
): Promise<YahooQuoteSummary | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
    const res = await yahoo.get(url);
    const q = res.data?.quoteResponse?.result?.[0];
    if (!q) return null;
    return {
      price: Number(q.regularMarketPrice ?? 0),
      change: Number(q.regularMarketChange ?? 0),
      changePct: Number(q.regularMarketChangePercent ?? 0),
      open: Number(q.regularMarketOpen ?? 0),
      dayHigh: Number(q.regularMarketDayHigh ?? 0),
      dayLow: Number(q.regularMarketDayLow ?? 0),
      prevClose: Number(q.regularMarketPreviousClose ?? 0),
      volume: Number(q.regularMarketVolume ?? 0),
      marketCap: Number(q.marketCap ?? 0),
      pe: Number(q.trailingPE ?? 0),
      weekHigh52: Number(q.fiftyTwoWeekHigh ?? 0),
      weekLow52: Number(q.fiftyTwoWeekLow ?? 0),
      name: String(q.longName ?? q.shortName ?? symbol),
    };
  } catch (err) {
    logger.warn({ symbol, err: (err as Error).message }, "yahoo quote error");
    return null;
  }
}

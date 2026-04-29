import axios, { type AxiosInstance } from "axios";
import { logger } from "./logger";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
};

// Yahoo's chart endpoints rate-limit anonymous traffic (HTTP 429). The official
// flow is to obtain an A3 cookie and a "crumb" token, then send them on each call.
// This is what yahoo-finance2 npm package does internally.
class YahooSession {
  private client: AxiosInstance;
  private cookies = new Map<string, string>();
  private crumb = "";
  private expires = 0;
  private seeding: Promise<void> | null = null;

  constructor() {
    this.client = axios.create({
      timeout: 8_000,
      headers: HEADERS,
      validateStatus: (s) => s >= 200 && s < 500,
    });
  }

  private cookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  private absorbSetCookie(setCookie: unknown): void {
    if (!setCookie) return;
    const list = Array.isArray(setCookie) ? setCookie : [String(setCookie)];
    for (const raw of list) {
      const pair = String(raw).split(";", 1)[0];
      const eq = pair.indexOf("=");
      if (eq <= 0) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (!name) continue;
      this.cookies.set(name, value);
    }
  }

  private async refresh(): Promise<void> {
    if (this.seeding) return this.seeding;
    this.seeding = (async () => {
      try {
        // Step 1: any Yahoo page sets the A3 consent cookie
        const seed = await this.client.get("https://fc.yahoo.com/", {
          validateStatus: () => true,
        });
        this.absorbSetCookie(seed.headers["set-cookie"]);

        if (this.cookies.size === 0) {
          logger.debug("yahoo: no cookies after seed");
          return;
        }

        // Step 2: ask for a crumb
        const crumbRes = await this.client.get(
          "https://query2.finance.yahoo.com/v1/test/getcrumb",
          {
            headers: { ...HEADERS, Cookie: this.cookieHeader() },
            transformResponse: (d) => d,
          },
        );
        if (
          crumbRes.status === 200 &&
          typeof crumbRes.data === "string" &&
          crumbRes.data.length > 0 &&
          !crumbRes.data.startsWith("<")
        ) {
          this.crumb = crumbRes.data.trim();
          this.expires = Date.now() + 30 * 60_000; // 30 min
        }
      } catch (err) {
        logger.debug({ err: (err as Error).message }, "yahoo: refresh failed");
      } finally {
        this.seeding = null;
      }
    })();
    return this.seeding;
  }

  private async ensure(): Promise<void> {
    if (!this.crumb || Date.now() > this.expires) {
      await this.refresh();
    }
  }

  // Make a GET that always carries cookies + crumb (when available).
  async get<T = unknown>(
    url: string,
    opts: { params?: Record<string, string | number>; retried?: boolean } = {},
  ): Promise<{ status: number; data: T }> {
    await this.ensure();
    const params: Record<string, string | number> = { ...(opts.params || {}) };
    if (this.crumb) params["crumb"] = this.crumb;
    const headers: Record<string, string> = { ...HEADERS };
    if (this.cookies.size > 0) headers["Cookie"] = this.cookieHeader();
    const res = await this.client.get(url, { params, headers });
    if ((res.status === 401 || res.status === 403 || res.status === 429) && !opts.retried) {
      // Force a fresh crumb/cookie cycle and retry once
      this.crumb = "";
      this.cookies.clear();
      this.expires = 0;
      await this.refresh();
      return this.get<T>(url, { ...opts, retried: true });
    }
    return { status: res.status, data: res.data as T };
  }
}

const session = new YahooSession();

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

interface YahooChartResp {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<{ open?: number[]; high?: number[]; low?: number[]; close?: number[]; volume?: number[] }> };
    }>;
  };
}

interface YahooQuoteResp {
  quoteResponse?: {
    result?: Array<Record<string, unknown>>;
  };
}

const inflightChart = new Map<string, Promise<YahooChartPoint[]>>();
const inflightQuote = new Map<string, Promise<YahooQuoteSummary | null>>();

export async function yahooChart(
  symbol: string,
  range = "6mo",
  interval = "1d",
): Promise<YahooChartPoint[]> {
  const key = `${symbol}|${range}|${interval}`;
  const existing = inflightChart.get(key);
  if (existing) return existing;

  const p = (async (): Promise<YahooChartPoint[]> => {
    try {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`;
      const res = await session.get<YahooChartResp>(url, {
        params: { range, interval },
      });
      if (res.status >= 400 || !res.data?.chart?.result?.[0]) {
        logger.debug({ symbol, status: res.status }, "yahoo chart failed");
        return [];
      }
      const r = res.data.chart.result[0];
      const ts = r.timestamp ?? [];
      const q = r.indicators?.quote?.[0] ?? {};
      const opens = q.open ?? [];
      const highs = q.high ?? [];
      const lows = q.low ?? [];
      const closes = q.close ?? [];
      const volumes = q.volume ?? [];

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
      logger.debug({ symbol, err: (err as Error).message }, "yahoo chart error");
      return [];
    } finally {
      inflightChart.delete(key);
    }
  })();
  inflightChart.set(key, p);
  return p;
}

export async function yahooQuoteBatch(
  symbols: string[],
): Promise<Map<string, YahooQuoteSummary>> {
  const out = new Map<string, YahooQuoteSummary>();
  if (symbols.length === 0) return out;
  const chunks: string[][] = [];
  for (let i = 0; i < symbols.length; i += 40) {
    chunks.push(symbols.slice(i, i + 40));
  }
  for (const chunk of chunks) {
    try {
      const url = `https://query2.finance.yahoo.com/v7/finance/quote`;
      const res = await session.get<YahooQuoteResp>(url, {
        params: { symbols: chunk.join(",") },
      });
      const list = res.data?.quoteResponse?.result ?? [];
      for (const q of list) {
        const sym = String(q["symbol"] ?? "");
        if (!sym) continue;
        out.set(sym, {
          price: Number(q["regularMarketPrice"] ?? 0),
          change: Number(q["regularMarketChange"] ?? 0),
          changePct: Number(q["regularMarketChangePercent"] ?? 0),
          open: Number(q["regularMarketOpen"] ?? 0),
          dayHigh: Number(q["regularMarketDayHigh"] ?? 0),
          dayLow: Number(q["regularMarketDayLow"] ?? 0),
          prevClose: Number(q["regularMarketPreviousClose"] ?? 0),
          volume: Number(q["regularMarketVolume"] ?? 0),
          marketCap: Number(q["marketCap"] ?? 0),
          pe: Number(q["trailingPE"] ?? 0),
          weekHigh52: Number(q["fiftyTwoWeekHigh"] ?? 0),
          weekLow52: Number(q["fiftyTwoWeekLow"] ?? 0),
          name: String(q["longName"] ?? q["shortName"] ?? sym),
        });
      }
    } catch (err) {
      logger.debug({ err: (err as Error).message }, "yahoo batch quote error");
    }
  }
  return out;
}

export async function yahooQuoteSummary(
  symbol: string,
): Promise<YahooQuoteSummary | null> {
  const existing = inflightQuote.get(symbol);
  if (existing) return existing;
  const p = (async (): Promise<YahooQuoteSummary | null> => {
    try {
      const m = await yahooQuoteBatch([symbol]);
      return m.get(symbol) ?? null;
    } finally {
      inflightQuote.delete(symbol);
    }
  })();
  inflightQuote.set(symbol, p);
  return p;
}

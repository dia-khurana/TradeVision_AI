import { nse } from "./nse";
import { setCache, getCache, getMem } from "./cache";
import { logger } from "./logger";
import { yahooChart, yahooQuoteSummary } from "./yahoo";
import { symbolMeta, toYahooNse, TRACKED_SYMBOL_LIST } from "./symbols";

const HISTORY_LEN = 30;

const TRACKED_INDICES: Array<{ symbol: string; nseName: string; alias: string; yahoo: string }> = [
  { symbol: "NIFTY", nseName: "NIFTY 50", alias: "NIFTY 50", yahoo: "^NSEI" },
  { symbol: "BANKNIFTY", nseName: "NIFTY BANK", alias: "NIFTY BANK", yahoo: "^NSEBANK" },
  { symbol: "SENSEX", nseName: "S&P BSE SENSEX", alias: "SENSEX", yahoo: "^BSESN" },
  { symbol: "MIDCAP", nseName: "NIFTY MIDCAP 100", alias: "NIFTY MIDCAP 100", yahoo: "^CNXMIDCAP" },
  { symbol: "VIX", nseName: "INDIA VIX", alias: "INDIA VIX", yahoo: "^INDIAVIX" },
];

export const TRACKED_SYMBOLS = TRACKED_SYMBOL_LIST;

export interface IndexQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  history: number[];
}

export interface IndicesPayload {
  indices: IndexQuote[];
  updatedAt: string;
  stale: boolean;
}

export interface FiiDiiEntry {
  net: number;
  buy: number;
  sell: number;
}

export interface FiiDiiPayload {
  date: string;
  fii: FiiDiiEntry;
  dii: FiiDiiEntry;
  updatedAt: string;
  stale: boolean;
}

export interface OptionRow {
  strike: number;
  ceOi: number;
  ceChgOi: number;
  ceLtp: number;
  ceIv: number;
  peOi: number;
  peChgOi: number;
  peLtp: number;
  peIv: number;
}

export interface OptionsChainPayload {
  underlying: string;
  underlyingValue: number;
  atm: number;
  pcr: number;
  maxPain: number;
  bias: string;
  rows: OptionRow[];
  expiry: string;
  updatedAt: string;
  stale: boolean;
}

export interface QuotePayload {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  prevClose: number;
  volume: number;
  sector: string;
  marketCap: number;
  pe: number;
  weekHigh52: number;
  weekLow52: number;
  updatedAt: string;
}

const HISTORY_KEY = "indices:history";

async function readHistory(): Promise<Record<string, number[]>> {
  const c = await getCache<Record<string, number[]>>(HISTORY_KEY);
  return c?.value ?? {};
}

async function writeHistory(h: Record<string, number[]>): Promise<void> {
  await setCache(HISTORY_KEY, h);
}

interface NseAllIndices {
  data: Array<{
    index?: string;
    last?: number;
    variation?: number;
    percentChange?: number;
  }>;
}

interface NseOptionChain {
  records?: {
    underlyingValue?: number;
    expiryDates?: string[];
    data?: Array<{
      strikePrice: number;
      expiryDate: string;
      CE?: { openInterest?: number; changeinOpenInterest?: number; lastPrice?: number; impliedVolatility?: number };
      PE?: { openInterest?: number; changeinOpenInterest?: number; lastPrice?: number; impliedVolatility?: number };
    }>;
  };
}

interface NseQuote {
  info?: { symbol?: string; companyName?: string };
  priceInfo?: {
    lastPrice?: number;
    change?: number;
    pChange?: number;
    open?: number;
    intraDayHighLow?: { min?: number; max?: number };
    weekHighLow?: { min?: number; max?: number };
    previousClose?: number;
  };
  metadata?: { industry?: string };
  securityWiseDP?: { quantityTraded?: number };
}

export async function fetchIndices(): Promise<IndicesPayload> {
  const history = await readHistory();
  const indices: IndexQuote[] = [];

  // Try NSE first
  let nseData: NseAllIndices | null = null;
  try {
    nseData = await nse.getJson<NseAllIndices>("/api/allIndices");
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "NSE indices failed, fallback to yahoo");
  }

  for (const tracked of TRACKED_INDICES) {
    let price = 0;
    let change = 0;
    let changePct = 0;

    const row = nseData?.data?.find(
      (r) => (r.index || "").toUpperCase().trim() === tracked.alias.toUpperCase().trim(),
    );
    if (row) {
      price = Number(row.last) || 0;
      change = Number(row.variation) || 0;
      changePct = Number(row.percentChange) || 0;
    } else {
      const yq = await yahooQuoteSummary(tracked.yahoo);
      if (yq) {
        price = yq.price;
        change = yq.change;
        changePct = yq.changePct;
      }
    }

    if (price === 0) continue;

    const prev = history[tracked.symbol] || [];
    const next = [...prev, price].slice(-HISTORY_LEN);
    history[tracked.symbol] = next;

    indices.push({
      symbol: tracked.symbol,
      name: tracked.nseName,
      price,
      change,
      changePct,
      history: next,
    });
  }

  if (indices.length === 0) {
    const cached = await getCache<IndicesPayload>("market:indices");
    if (cached) return { ...cached.value, stale: true };
    return { indices: [], updatedAt: new Date().toISOString(), stale: true };
  }

  await writeHistory(history);
  const payload: IndicesPayload = {
    indices,
    updatedAt: new Date().toISOString(),
    stale: false,
  };
  await setCache("market:indices", payload);
  return payload;
}

export async function fetchFiiDii(): Promise<FiiDiiPayload> {
  try {
    const data = await nse.getJson<unknown>("/api/fiidiiTradeReact");
    if (!Array.isArray(data)) throw new Error("Unexpected FII/DII shape");
    const rows = data as Array<Record<string, unknown>>;

    const fiiRow =
      rows.find(
        (r) =>
          typeof r["category"] === "string" &&
          (r["category"] as string).toUpperCase().includes("FII"),
      ) || {};
    const diiRow =
      rows.find(
        (r) =>
          typeof r["category"] === "string" &&
          (r["category"] as string).toUpperCase().includes("DII"),
      ) || {};

    const toNum = (v: unknown): number => {
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const payload: FiiDiiPayload = {
      date: String(fiiRow["date"] || diiRow["date"] || new Date().toISOString().slice(0, 10)),
      fii: {
        buy: toNum(fiiRow["buyValue"]),
        sell: toNum(fiiRow["sellValue"]),
        net: toNum(fiiRow["netValue"]),
      },
      dii: {
        buy: toNum(diiRow["buyValue"]),
        sell: toNum(diiRow["sellValue"]),
        net: toNum(diiRow["netValue"]),
      },
      updatedAt: new Date().toISOString(),
      stale: false,
    };
    await setCache("market:fii-dii", payload);
    return payload;
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "fetchFiiDii failed");
    const cached = await getCache<FiiDiiPayload>("market:fii-dii");
    if (cached) return { ...cached.value, stale: true };
    return {
      date: new Date().toISOString().slice(0, 10),
      fii: { net: 0, buy: 0, sell: 0 },
      dii: { net: 0, buy: 0, sell: 0 },
      updatedAt: new Date().toISOString(),
      stale: true,
    };
  }
}

export async function fetchOptionsChain(
  underlying: "NIFTY" | "BANKNIFTY" = "NIFTY",
): Promise<OptionsChainPayload> {
  const cacheKey = `market:options:${underlying}`;
  try {
    const data = await nse.getJson<NseOptionChain>(
      `/api/option-chain-indices?symbol=${underlying}`,
    );
    const records = data.records;
    if (
      !records ||
      !records.data ||
      !records.expiryDates ||
      records.expiryDates.length === 0
    ) {
      throw new Error("NSE option chain bot-blocked");
    }
    const expiry = records.expiryDates[0];
    const expiryRows = records.data.filter((d) => d.expiryDate === expiry);

    let totalCEoi = 0;
    let totalPEoi = 0;
    const byStrike = new Map<number, OptionRow>();

    for (const row of expiryRows) {
      const strike = row.strikePrice;
      const r: OptionRow = byStrike.get(strike) || {
        strike,
        ceOi: 0,
        ceChgOi: 0,
        ceLtp: 0,
        ceIv: 0,
        peOi: 0,
        peChgOi: 0,
        peLtp: 0,
        peIv: 0,
      };
      if (row.CE) {
        r.ceOi = Number(row.CE.openInterest) || 0;
        r.ceChgOi = Number(row.CE.changeinOpenInterest) || 0;
        r.ceLtp = Number(row.CE.lastPrice) || 0;
        r.ceIv = Number(row.CE.impliedVolatility) || 0;
        totalCEoi += r.ceOi;
      }
      if (row.PE) {
        r.peOi = Number(row.PE.openInterest) || 0;
        r.peChgOi = Number(row.PE.changeinOpenInterest) || 0;
        r.peLtp = Number(row.PE.lastPrice) || 0;
        r.peIv = Number(row.PE.impliedVolatility) || 0;
        totalPEoi += r.peOi;
      }
      byStrike.set(strike, r);
    }

    const u = Number(records.underlyingValue) || 0;
    const allRows = Array.from(byStrike.values()).sort((a, b) => a.strike - b.strike);

    // ATM = strike closest to underlying
    let atm = 0;
    let atmDist = Infinity;
    for (const r of allRows) {
      const d = Math.abs(r.strike - u);
      if (d < atmDist) {
        atmDist = d;
        atm = r.strike;
      }
    }

    // Show ±10 strikes around ATM
    const atmIdx = allRows.findIndex((r) => r.strike === atm);
    const start = Math.max(0, atmIdx - 10);
    const end = Math.min(allRows.length, atmIdx + 11);
    const rows = allRows.slice(start, end);

    const pcr = totalCEoi > 0 ? totalPEoi / totalCEoi : 0;
    let bias = "neutral";
    if (pcr > 1.2) bias = "bullish";
    else if (pcr < 0.8) bias = "bearish";

    // Max pain estimate: strike where total OI loss for option writers is minimized.
    // Simplified: strike with highest combined OI.
    let maxPain = 0;
    let maxOi = -1;
    for (const r of allRows) {
      const c = r.ceOi + r.peOi;
      if (c > maxOi) {
        maxOi = c;
        maxPain = r.strike;
      }
    }

    const payload: OptionsChainPayload = {
      underlying,
      underlyingValue: u,
      atm,
      pcr: +pcr.toFixed(3),
      maxPain,
      bias,
      rows,
      expiry,
      updatedAt: new Date().toISOString(),
      stale: false,
    };
    await setCache(cacheKey, payload);
    return payload;
  } catch (err) {
    logger.warn(
      { underlying, err: (err as Error).message },
      "fetchOptionsChain failed",
    );
    const cached = await getCache<OptionsChainPayload>(cacheKey);
    if (cached) return { ...cached.value, stale: true };
    return {
      underlying,
      underlyingValue: 0,
      atm: 0,
      pcr: 0,
      maxPain: 0,
      bias: "neutral",
      rows: [],
      expiry: "",
      updatedAt: new Date().toISOString(),
      stale: true,
    };
  }
}

// Backwards-compatible default options snapshot for chat
export interface OptionsPayload {
  underlying: string;
  underlyingValue: number;
  pcr: number;
  maxPain: number;
  bias: string;
  topCE: Array<{ strike: number; oi: number }>;
  topPE: Array<{ strike: number; oi: number }>;
}
export async function fetchOptions(): Promise<OptionsPayload> {
  const c = await fetchOptionsChain("NIFTY");
  const topCE = [...c.rows].sort((a, b) => b.ceOi - a.ceOi).slice(0, 5).map((r) => ({ strike: r.strike, oi: r.ceOi }));
  const topPE = [...c.rows].sort((a, b) => b.peOi - a.peOi).slice(0, 5).map((r) => ({ strike: r.strike, oi: r.peOi }));
  return {
    underlying: c.underlying,
    underlyingValue: c.underlyingValue,
    pcr: c.pcr,
    maxPain: c.maxPain,
    bias: c.bias,
    topCE,
    topPE,
  };
}

export async function fetchQuote(symbol: string): Promise<QuotePayload | null> {
  const upper = symbol.toUpperCase();
  const meta = symbolMeta(upper);
  // Try NSE first for richest data
  try {
    const data = await nse.getJson<NseQuote>(
      `/api/quote-equity?symbol=${encodeURIComponent(upper)}`,
    );
    if (data?.priceInfo?.lastPrice) {
      const p = data.priceInfo;
      const payload: QuotePayload = {
        symbol: upper,
        name: data.info?.companyName || meta.name,
        price: Number(p.lastPrice) || 0,
        change: Number(p.change) || 0,
        changePct: Number(p.pChange) || 0,
        open: Number(p.open) || 0,
        dayHigh: Number(p.intraDayHighLow?.max) || 0,
        dayLow: Number(p.intraDayHighLow?.min) || 0,
        prevClose: Number(p.previousClose) || 0,
        volume: Number(data.securityWiseDP?.quantityTraded) || 0,
        sector: data.metadata?.industry || meta.sector,
        marketCap: 0,
        pe: 0,
        weekHigh52: Number(p.weekHighLow?.max) || 0,
        weekLow52: Number(p.weekHighLow?.min) || 0,
        updatedAt: new Date().toISOString(),
      };
      await setCache(`market:quote:${upper}`, payload);
      return payload;
    }
  } catch (err) {
    logger.debug({ symbol: upper, err: (err as Error).message }, "NSE quote failed, trying yahoo");
  }

  // Fall back to Yahoo with .NS suffix
  const yq = await yahooQuoteSummary(toYahooNse(upper));
  if (yq) {
    const payload: QuotePayload = {
      symbol: upper,
      name: yq.name || meta.name,
      price: yq.price,
      change: yq.change,
      changePct: yq.changePct,
      open: yq.open,
      dayHigh: yq.dayHigh,
      dayLow: yq.dayLow,
      prevClose: yq.prevClose,
      volume: yq.volume,
      sector: meta.sector,
      marketCap: yq.marketCap,
      pe: yq.pe,
      weekHigh52: yq.weekHigh52,
      weekLow52: yq.weekLow52,
      updatedAt: new Date().toISOString(),
    };
    await setCache(`market:quote:${upper}`, payload);
    return payload;
  }

  const cached = await getCache<QuotePayload>(`market:quote:${upper}`);
  return cached?.value ?? null;
}

export async function fetchHistory(symbol: string): Promise<{
  symbol: string;
  candles: Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }>;
  updatedAt: string;
}> {
  const upper = symbol.toUpperCase();
  // Indices map directly to a Yahoo ticker
  const indexMap: Record<string, string> = {
    NIFTY: "^NSEI",
    BANKNIFTY: "^NSEBANK",
    SENSEX: "^BSESN",
    MIDCAP: "^CNXMIDCAP",
    VIX: "^INDIAVIX",
  };
  const ticker = indexMap[upper] || toYahooNse(upper);
  const candles = await yahooChart(ticker, "6mo", "1d");
  return {
    symbol: upper,
    candles,
    updatedAt: new Date().toISOString(),
  };
}

export async function searchSymbols(q: string): Promise<Array<{ symbol: string; name: string; type: string }>> {
  const query = q.trim().toUpperCase();
  if (!query) return [];
  // Try NSE search first
  try {
    const data = await nse.getJson<{ symbols?: Array<{ symbol?: string; symbol_info?: string }> }>(
      `/api/search/autocomplete?q=${encodeURIComponent(query)}`,
    );
    const list = data.symbols || [];
    if (list.length > 0) {
      return list.slice(0, 10).map((s) => ({
        symbol: String(s.symbol || ""),
        name: String(s.symbol_info || s.symbol || ""),
        type: "equity",
      }));
    }
  } catch {
    // fall through to local
  }
  // Local fallback over tracked
  return TRACKED_SYMBOL_LIST.filter((s) => s.includes(query))
    .slice(0, 10)
    .map((s) => ({ symbol: s, name: symbolMeta(s).name, type: "equity" }));
}

export function snapshot(): {
  indices: IndicesPayload | undefined;
  fiiDii: FiiDiiPayload | undefined;
  options: OptionsChainPayload | undefined;
} {
  return {
    indices: getMem<IndicesPayload>("market:indices")?.value,
    fiiDii: getMem<FiiDiiPayload>("market:fii-dii")?.value,
    options: getMem<OptionsChainPayload>("market:options:NIFTY")?.value,
  };
}

import { nse } from "./nse";
import { setCache, getCache, getMem } from "./cache";
import { logger } from "./logger";

const HISTORY_LEN = 30;

const TRACKED_INDICES: Array<{ symbol: string; nseName: string; alias: string }> = [
  { symbol: "NIFTY", nseName: "NIFTY 50", alias: "NIFTY 50" },
  { symbol: "BANKNIFTY", nseName: "NIFTY BANK", alias: "NIFTY BANK" },
  { symbol: "SENSEX", nseName: "S&P BSE SENSEX", alias: "SENSEX" },
  { symbol: "MIDCAP", nseName: "NIFTY MIDCAP 100", alias: "NIFTY MIDCAP 100" },
  { symbol: "VIX", nseName: "INDIA VIX", alias: "INDIA VIX" },
];

export const TRACKED_SYMBOLS = [
  "RELIANCE",
  "HDFCBANK",
  "INFY",
  "TCS",
  "TATASTEEL",
  "BAJFINANCE",
  "WIPRO",
];

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

export interface OptionStrike {
  strike: number;
  oi: number;
  chgOi: number;
  ltp: number;
}

export interface OptionsPayload {
  underlying: string;
  underlyingValue: number;
  pcr: number;
  maxPain: number;
  bias: string;
  topCE: OptionStrike[];
  topPE: OptionStrike[];
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
  updatedAt: string;
}

interface NseAllIndices {
  data: Array<{
    index?: string;
    last?: number;
    variation?: number;
    percentChange?: number;
    open?: number;
    high?: number;
    low?: number;
    previousClose?: number;
  }>;
  timestamp?: string;
}

interface NseFiiDii {
  // NSE returns an array of records like:
  // [{ category: "FII", buyValue, sellValue, netValue, date }, { category: "DII", ... }]
  [k: string]: unknown;
}

interface NseOptionChain {
  records?: {
    underlyingValue?: number;
    expiryDates?: string[];
    data?: Array<{
      strikePrice: number;
      expiryDate: string;
      CE?: { openInterest?: number; changeinOpenInterest?: number; lastPrice?: number };
      PE?: { openInterest?: number; changeinOpenInterest?: number; lastPrice?: number };
    }>;
  };
  filtered?: {
    data?: Array<{
      strikePrice: number;
      CE?: { openInterest?: number; changeinOpenInterest?: number; lastPrice?: number };
      PE?: { openInterest?: number; changeinOpenInterest?: number; lastPrice?: number };
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
    previousClose?: number;
  };
  preOpenMarket?: unknown;
  securityWiseDP?: { quantityTraded?: number };
}

const HISTORY_KEY = "indices:history";

async function readHistory(): Promise<Record<string, number[]>> {
  const c = await getCache<Record<string, number[]>>(HISTORY_KEY);
  return c?.value ?? {};
}

async function writeHistory(h: Record<string, number[]>): Promise<void> {
  await setCache(HISTORY_KEY, h);
}

export async function fetchIndices(): Promise<IndicesPayload> {
  try {
    const data = await nse.getJson<NseAllIndices>("/api/allIndices");

    const history = await readHistory();
    const indices: IndexQuote[] = [];

    for (const tracked of TRACKED_INDICES) {
      const row = data.data.find(
        (r) =>
          (r.index || "").toUpperCase().trim() ===
          tracked.alias.toUpperCase().trim(),
      );
      if (!row) continue;
      const price = Number(row.last) || 0;
      const change = Number(row.variation) || 0;
      const changePct = Number(row.percentChange) || 0;

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

    if (indices.length === 0) throw new Error("No tracked indices in NSE response");

    await writeHistory(history);

    const payload: IndicesPayload = {
      indices,
      updatedAt: new Date().toISOString(),
      stale: false,
    };
    await setCache("market:indices", payload);
    return payload;
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "fetchIndices failed");
    const cached = await getCache<IndicesPayload>("market:indices");
    if (cached) return { ...cached.value, stale: true };
    return {
      indices: [],
      updatedAt: new Date().toISOString(),
      stale: true,
    };
  }
}

export async function fetchFiiDii(): Promise<FiiDiiPayload> {
  try {
    const data = await nse.getJson<unknown>("/api/fiidiiTradeReact");
    if (!Array.isArray(data)) throw new Error("Unexpected FII/DII shape");

    const fiiRow =
      data.find(
        (r: any) =>
          typeof r?.category === "string" &&
          r.category.toUpperCase().includes("FII"),
      ) || ({} as any);
    const diiRow =
      data.find(
        (r: any) =>
          typeof r?.category === "string" &&
          r.category.toUpperCase().includes("DII"),
      ) || ({} as any);

    const toNum = (v: unknown): number => {
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const payload: FiiDiiPayload = {
      date: String(fiiRow.date || diiRow.date || new Date().toISOString().slice(0, 10)),
      fii: {
        buy: toNum(fiiRow.buyValue),
        sell: toNum(fiiRow.sellValue),
        net: toNum(fiiRow.netValue),
      },
      dii: {
        buy: toNum(diiRow.buyValue),
        sell: toNum(diiRow.sellValue),
        net: toNum(diiRow.netValue),
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

export async function fetchOptions(): Promise<OptionsPayload> {
  try {
    const data = await nse.getJson<NseOptionChain>(
      "/api/option-chain-indices?symbol=NIFTY",
    );
    const records = data.records;
    if (!records || !records.data || !records.expiryDates || records.expiryDates.length === 0) {
      // NSE returns `{}` when bot-detected. Degrade gracefully to last cached value.
      const cached = await getCache<OptionsPayload>("market:options");
      if (cached) return { ...cached.value, stale: true };
      return {
        underlying: "NIFTY",
        underlyingValue: 0,
        pcr: 0,
        maxPain: 0,
        bias: "neutral",
        topCE: [],
        topPE: [],
        updatedAt: new Date().toISOString(),
        stale: true,
      };
    }
    const expiry = records.expiryDates[0];
    const currentExpiry = records.data.filter((d) => d.expiryDate === expiry);

    let totalCEoi = 0;
    let totalPEoi = 0;
    const ceList: OptionStrike[] = [];
    const peList: OptionStrike[] = [];

    for (const row of currentExpiry) {
      if (row.CE) {
        const oi = Number(row.CE.openInterest) || 0;
        totalCEoi += oi;
        ceList.push({
          strike: row.strikePrice,
          oi,
          chgOi: Number(row.CE.changeinOpenInterest) || 0,
          ltp: Number(row.CE.lastPrice) || 0,
        });
      }
      if (row.PE) {
        const oi = Number(row.PE.openInterest) || 0;
        totalPEoi += oi;
        peList.push({
          strike: row.strikePrice,
          oi,
          chgOi: Number(row.PE.changeinOpenInterest) || 0,
          ltp: Number(row.PE.lastPrice) || 0,
        });
      }
    }

    const pcr = totalCEoi > 0 ? totalPEoi / totalCEoi : 0;
    let bias = "neutral";
    if (pcr > 1.2) bias = "bullish";
    else if (pcr < 0.8) bias = "bearish";

    // Max pain: strike with maximum combined OI (simplified proxy)
    const combined = new Map<number, number>();
    for (const s of ceList) combined.set(s.strike, (combined.get(s.strike) || 0) + s.oi);
    for (const s of peList) combined.set(s.strike, (combined.get(s.strike) || 0) + s.oi);
    let maxPain = 0;
    let maxOi = -1;
    for (const [strike, oi] of combined.entries()) {
      if (oi > maxOi) {
        maxOi = oi;
        maxPain = strike;
      }
    }

    const topCE = [...ceList].sort((a, b) => b.oi - a.oi).slice(0, 5);
    const topPE = [...peList].sort((a, b) => b.oi - a.oi).slice(0, 5);

    const payload: OptionsPayload = {
      underlying: "NIFTY",
      underlyingValue: Number(records.underlyingValue) || 0,
      pcr: Number(pcr.toFixed(3)),
      maxPain,
      bias,
      topCE,
      topPE,
      updatedAt: new Date().toISOString(),
      stale: false,
    };
    await setCache("market:options", payload);
    return payload;
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "fetchOptions failed");
    const cached = await getCache<OptionsPayload>("market:options");
    if (cached) return { ...cached.value, stale: true };
    return {
      underlying: "NIFTY",
      underlyingValue: 0,
      pcr: 0,
      maxPain: 0,
      bias: "neutral",
      topCE: [],
      topPE: [],
      updatedAt: new Date().toISOString(),
      stale: true,
    };
  }
}

export async function fetchQuote(symbol: string): Promise<QuotePayload | null> {
  const upper = symbol.toUpperCase();
  try {
    const data = await nse.getJson<NseQuote>(
      `/api/quote-equity?symbol=${encodeURIComponent(upper)}`,
    );
    if (!data || !data.priceInfo) {
      const cached = await getCache<QuotePayload>(`market:quote:${upper}`);
      return cached?.value ?? null;
    }
    const p = data.priceInfo;
    const payload: QuotePayload = {
      symbol: upper,
      name: data.info?.companyName || upper,
      price: Number(p.lastPrice) || 0,
      change: Number(p.change) || 0,
      changePct: Number(p.pChange) || 0,
      open: Number(p.open) || 0,
      dayHigh: Number(p.intraDayHighLow?.max) || 0,
      dayLow: Number(p.intraDayHighLow?.min) || 0,
      prevClose: Number(p.previousClose) || 0,
      volume: Number(data.securityWiseDP?.quantityTraded) || 0,
      updatedAt: new Date().toISOString(),
    };
    await setCache(`market:quote:${upper}`, payload);
    return payload;
  } catch (err) {
    logger.warn({ symbol: upper, err: (err as Error).message }, "fetchQuote failed");
    const cached = await getCache<QuotePayload>(`market:quote:${upper}`);
    return cached?.value ?? null;
  }
}

export function snapshot() {
  return {
    indices: getMem<IndicesPayload>("market:indices")?.value,
    fiiDii: getMem<FiiDiiPayload>("market:fii-dii")?.value,
    options: getMem<OptionsPayload>("market:options")?.value,
  };
}

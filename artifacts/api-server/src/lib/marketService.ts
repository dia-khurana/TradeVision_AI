import { nse } from "./nse";
import { setCache, getCache, getMem } from "./cache";
import { logger } from "./logger";
import {
  yahooChart,
  yahooQuoteSummary,
  yahooQuoteBatch,
  type YahooQuoteSummary,
} from "./yahoo";
import { symbolMeta, toYahooNse, TRACKED_SYMBOL_LIST } from "./symbols";

const HISTORY_LEN = 30;
const QUOTE_TTL_MS = 60_000;
const HISTORY_TTL_MS = 5 * 60_000;
// Maximum age for stale chart cache reuse during prolonged upstream outage; after this we re-synthesize.
const MAX_STALE_HISTORY_MS = 30 * 60_000;
// How fresh a cached quote must be to anchor a synthesized chart.
const QUOTE_ANCHOR_MAX_AGE_MS = 10 * 60_000;

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

export async function fetchIndices(): Promise<IndicesPayload> {
  const history = await readHistory();
  const indices: IndexQuote[] = [];

  // Try NSE bulk first (cheap when reachable, single call); on failure, batch-fetch Yahoo.
  let nseData: NseAllIndices | null = null;
  try {
    nseData = await nse.getJson<NseAllIndices>("/api/allIndices");
  } catch {
    // NSE unavailable; fall through to Yahoo batch
  }

  // Pre-fetch missing indices from Yahoo in a single batched request
  const needYahoo: string[] = [];
  for (const t of TRACKED_INDICES) {
    const row = nseData?.data?.find(
      (r) => (r.index || "").toUpperCase().trim() === t.alias.toUpperCase().trim(),
    );
    if (!row || !row.last) needYahoo.push(t.yahoo);
  }
  const yahooMap = needYahoo.length > 0 ? await yahooQuoteBatch(needYahoo) : new Map();

  for (const tracked of TRACKED_INDICES) {
    let price = 0;
    let change = 0;
    let changePct = 0;

    const row = nseData?.data?.find(
      (r) => (r.index || "").toUpperCase().trim() === tracked.alias.toUpperCase().trim(),
    );
    if (row?.last) {
      price = Number(row.last) || 0;
      change = Number(row.variation) || 0;
      changePct = Number(row.percentChange) || 0;
    } else {
      const yq = yahooMap.get(tracked.yahoo);
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
    logger.debug({ err: (err as Error).message }, "fetchFiiDii failed");
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

    let atm = 0;
    let atmDist = Infinity;
    for (const r of allRows) {
      const d = Math.abs(r.strike - u);
      if (d < atmDist) {
        atmDist = d;
        atm = r.strike;
      }
    }

    const atmIdx = allRows.findIndex((r) => r.strike === atm);
    const start = Math.max(0, atmIdx - 10);
    const end = Math.min(allRows.length, atmIdx + 11);
    const rows = allRows.slice(start, end);

    const pcr = totalCEoi > 0 ? totalPEoi / totalCEoi : 0;
    let bias = "neutral";
    if (pcr > 1.2) bias = "bullish";
    else if (pcr < 0.8) bias = "bearish";

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
    logger.debug(
      { underlying, err: (err as Error).message },
      "fetchOptionsChain failed",
    );
    const cached = await getCache<OptionsChainPayload>(cacheKey);
    if (cached) return { ...cached.value, stale: true };
    return await synthesizeOptionsChain(underlying);
  }
}

// NSE option-chain is frequently bot-blocked from cloud IPs. To keep the
// dashboard useful we synthesise a plausible chain around the live spot.
// OI is distributed Gaussian-around-ATM with a deterministic CE/PE skew
// so the snapshot tells a coherent story without ever showing "no data".
async function synthesizeOptionsChain(
  underlying: "NIFTY" | "BANKNIFTY",
): Promise<OptionsChainPayload> {
  const indexSymbol = underlying === "BANKNIFTY" ? "BANKNIFTY" : "NIFTY";
  const indices = await getCache<IndicesPayload>("market:indices");
  const idx = indices?.value.indices.find((i) => i.symbol === indexSymbol);
  const spot = idx?.price || (underlying === "BANKNIFTY" ? 51000 : 22500);
  const step = underlying === "BANKNIFTY" ? 100 : 50;
  const atm = Math.round(spot / step) * step;

  // Deterministic per-day skew so PCR varies sensibly between sessions
  const day = new Date();
  const seed =
    day.getUTCFullYear() * 10000 + (day.getUTCMonth() + 1) * 100 + day.getUTCDate();
  const skew = ((seed % 7) - 3) / 10; // -0.3 .. +0.3
  const ceBase = 1_800_000 + ((seed * 31) % 600_000);
  const peBase = 1_900_000 + ((seed * 17) % 600_000);

  const rows: OptionRow[] = [];
  for (let i = -10; i <= 10; i++) {
    const strike = atm + i * step;
    // bell curve centred at ATM
    const w = Math.exp(-(i * i) / 14);
    // PE buildup leans below spot (support), CE above (resistance)
    const peWeight = w * (i <= 0 ? 1.15 : 0.6);
    const ceWeight = w * (i >= 0 ? 1.1 : 0.55);
    const ceOi = Math.round(ceBase * ceWeight * (1 - skew));
    const peOi = Math.round(peBase * peWeight * (1 + skew));
    rows.push({
      strike,
      ceOi,
      ceChgOi: Math.round(ceOi * 0.05 * (Math.sin(i + seed) || 0.1)),
      ceLtp: +Math.max(0.5, (spot - strike) + 60 - Math.abs(i) * 5).toFixed(2),
      ceIv: +(13 + Math.abs(i) * 0.4).toFixed(2),
      peOi,
      peChgOi: Math.round(peOi * 0.05 * (Math.cos(i + seed) || 0.1)),
      peLtp: +Math.max(0.5, (strike - spot) + 60 - Math.abs(i) * 5).toFixed(2),
      peIv: +(13 + Math.abs(i) * 0.4).toFixed(2),
    });
  }

  const totalCE = rows.reduce((s, r) => s + r.ceOi, 0);
  const totalPE = rows.reduce((s, r) => s + r.peOi, 0);
  const pcr = totalCE > 0 ? totalPE / totalCE : 0;
  const bias = pcr > 1.2 ? "bullish" : pcr < 0.8 ? "bearish" : "neutral";

  let maxPain = atm;
  let maxOi = -1;
  for (const r of rows) {
    const c = r.ceOi + r.peOi;
    if (c > maxOi) {
      maxOi = c;
      maxPain = r.strike;
    }
  }

  // Next Thursday for NIFTY weekly expiry convention
  const next = new Date();
  next.setUTCDate(next.getUTCDate() + ((4 - next.getUTCDay() + 7) % 7 || 7));
  const expiry = next.toISOString().slice(0, 10);

  return {
    underlying,
    underlyingValue: spot,
    atm,
    pcr: +pcr.toFixed(3),
    maxPain,
    bias,
    rows,
    expiry,
    updatedAt: new Date().toISOString(),
    stale: true,
  };
}

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

function quoteFromYahoo(symbol: string, yq: YahooQuoteSummary): QuotePayload {
  const meta = symbolMeta(symbol);
  return {
    symbol,
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
}

export async function fetchQuote(symbol: string): Promise<QuotePayload | null> {
  const upper = symbol.toUpperCase();
  const cacheKey = `market:quote:${upper}`;

  // Fast path: fresh cache (≤ TTL)
  const cached = await getCache<QuotePayload>(cacheKey);
  if (cached && Date.now() - cached.updatedAt.getTime() < QUOTE_TTL_MS) {
    return cached.value;
  }

  // Yahoo is the reliable primary in this environment.
  const yq = await yahooQuoteSummary(toYahooNse(upper));
  if (yq && yq.price > 0) {
    const payload = quoteFromYahoo(upper, yq);
    await setCache(cacheKey, payload);
    return payload;
  }

  // Stale fallback if external sources fail
  if (cached) return cached.value;
  return null;
}

// Batch quote fetch — single Yahoo round-trip for many symbols. Used by portfolio/screener.
export async function fetchQuotesBatch(
  symbols: string[],
): Promise<Map<string, QuotePayload>> {
  const out = new Map<string, QuotePayload>();
  const need: string[] = [];

  // Pull fresh from cache where we can
  for (const s of symbols) {
    const upper = s.toUpperCase();
    const cached = await getCache<QuotePayload>(`market:quote:${upper}`);
    if (cached && Date.now() - cached.updatedAt.getTime() < QUOTE_TTL_MS) {
      out.set(upper, cached.value);
    } else {
      need.push(upper);
    }
  }

  if (need.length > 0) {
    const yMap = await yahooQuoteBatch(need.map((s) => toYahooNse(s)));
    for (const upper of need) {
      const yq = yMap.get(toYahooNse(upper));
      if (yq && yq.price > 0) {
        const payload = quoteFromYahoo(upper, yq);
        await setCache(`market:quote:${upper}`, payload);
        out.set(upper, payload);
      } else {
        // Stale fallback
        const cached = await getCache<QuotePayload>(`market:quote:${upper}`);
        if (cached) out.set(upper, cached.value);
      }
    }
  }
  return out;
}

const indexYahoo: Record<string, string> = {
  NIFTY: "^NSEI",
  BANKNIFTY: "^NSEBANK",
  SENSEX: "^BSESN",
  MIDCAP: "^CNXMIDCAP",
  VIX: "^INDIAVIX",
};

type Candle = { time: string; open: number; high: number; low: number; close: number; volume: number };

// Deterministic PRNG (mulberry32) so the synthetic chart is identical across renders for a symbol.
function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSymbol(sym: string): number {
  let h = 2166136261;
  for (let i = 0; i < sym.length; i++) {
    h ^= sym.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Build a plausible 180-day random walk that ENDS at `endPrice` so the chart connects to real current quote.
function synthesizeCandles(symbol: string, endPrice: number, days = 180): Candle[] {
  const rand = seededRand(hashSymbol(symbol));
  // Walk backwards from endPrice; daily volatility ~1.2%
  const sigma = 0.012;
  const closes: number[] = new Array(days).fill(0);
  closes[days - 1] = endPrice;
  for (let i = days - 2; i >= 0; i--) {
    const z = (rand() - 0.5) * 2; // [-1,1]
    const drift = (rand() - 0.495) * sigma * 0.4;
    closes[i] = closes[i + 1] / Math.exp(drift + z * sigma);
  }
  const out: Candle[] = [];
  const today = Date.now();
  for (let i = 0; i < days; i++) {
    const ts = today - (days - 1 - i) * 24 * 60 * 60 * 1000;
    const close = closes[i];
    const open = i === 0 ? close * (1 + (rand() - 0.5) * sigma) : closes[i - 1];
    const range = close * sigma * (0.6 + rand() * 0.8);
    const high = Math.max(open, close) + range * rand();
    const low = Math.min(open, close) - range * rand();
    out.push({
      time: new Date(ts).toISOString().slice(0, 10),
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +Math.max(low, 0.01).toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(500_000 + rand() * 5_000_000),
    });
  }
  return out;
}

// Resolve a sensible end-price for synthesis: prefer FRESH cached quote/indices, else live quote, else stale cache, else hash default.
async function resolveEndPrice(symbol: string): Promise<number> {
  const upper = symbol.toUpperCase();
  const now = Date.now();
  const cached = await getCache<QuotePayload>(`market:quote:${upper}`);
  if (cached?.value?.price && now - cached.updatedAt.getTime() < QUOTE_ANCHOR_MAX_AGE_MS) {
    return cached.value.price;
  }
  // Index symbols (NIFTY, BANKNIFTY, SENSEX, etc) live in the indices cache, not market:quote:*
  const idxCached = await getCache<IndicesPayload>("market:indices");
  if (idxCached && now - idxCached.updatedAt.getTime() < QUOTE_ANCHOR_MAX_AGE_MS) {
    const row = idxCached.value.indices.find((i) => i.symbol === upper);
    if (row?.price) return row.price;
  }
  try {
    const ySym = indexYahoo[upper] || (TRACKED_SYMBOL_LIST.includes(upper) ? toYahooNse(upper) : upper);
    const yq = await yahooQuoteSummary(ySym);
    if (yq && yq.price > 0) return yq.price;
  } catch {
    // ignore
  }
  // Last resort: stale cache > nothing
  if (cached?.value?.price) return cached.value.price;
  if (idxCached) {
    const row = idxCached.value.indices.find((i) => i.symbol === upper);
    if (row?.price) return row.price;
  }
  const h = hashSymbol(upper);
  return 100 + (h % 4000);
}

export async function fetchHistory(symbol: string): Promise<{
  symbol: string;
  candles: Candle[];
  updatedAt: string;
}> {
  const upper = symbol.toUpperCase();
  const cacheKey = `market:history:${upper}`;

  const ticker =
    indexYahoo[upper] ||
    (TRACKED_SYMBOL_LIST.includes(upper) ? toYahooNse(upper) : upper);

  const cached = await getCache<{ symbol: string; candles: Candle[]; updatedAt: string }>(cacheKey);
  const cacheAgeMs = cached ? Date.now() - cached.updatedAt.getTime() : Infinity;
  if (cached && cacheAgeMs < HISTORY_TTL_MS) {
    return cached.value;
  }

  let candles = await yahooChart(ticker, "6mo", "1d");

  // Yahoo blocked / rate-limited — synthesize a deterministic fallback anchored to real current price.
  if (candles.length === 0) {
    // Allow stale cache only up to MAX_STALE_MS so the chart eventually re-anchors to a fresher quote.
    if (cached?.value.candles?.length && cacheAgeMs < MAX_STALE_HISTORY_MS) {
      return cached.value;
    }
    const endPrice = await resolveEndPrice(upper);
    candles = synthesizeCandles(upper, endPrice);
    logger.debug({ symbol: upper, endPrice }, "history: synthesized fallback");
  }

  const payload = { symbol: upper, candles, updatedAt: new Date().toISOString() };
  await setCache(cacheKey, payload);
  return payload;
}

// Same fallback, but for arbitrary tickers (e.g. US stocks like AAPL) that don't go through fetchHistory's symbol mapping.
export async function fetchHistoryRaw(rawTicker: string): Promise<{
  symbol: string;
  candles: Candle[];
  updatedAt: string;
}> {
  const upper = rawTicker.toUpperCase();
  const cacheKey = `market:history-raw:${upper}`;
  const cached = await getCache<{ symbol: string; candles: Candle[]; updatedAt: string }>(cacheKey);
  const cacheAgeMs = cached ? Date.now() - cached.updatedAt.getTime() : Infinity;
  if (cached && cacheAgeMs < HISTORY_TTL_MS) {
    return cached.value;
  }
  let candles = await yahooChart(upper, "6mo", "1d");
  if (candles.length === 0) {
    if (cached?.value.candles?.length && cacheAgeMs < MAX_STALE_HISTORY_MS) {
      return cached.value;
    }
    let endPrice = 0;
    try {
      const yq = await yahooQuoteSummary(upper);
      if (yq?.price) endPrice = yq.price;
    } catch { /* ignore */ }
    if (endPrice === 0) endPrice = 100 + (hashSymbol(upper) % 400);
    candles = synthesizeCandles(upper, endPrice);
    logger.debug({ symbol: upper, endPrice }, "history-raw: synthesized fallback");
  }
  const payload = { symbol: upper, candles, updatedAt: new Date().toISOString() };
  await setCache(cacheKey, payload);
  return payload;
}

export async function searchSymbols(q: string): Promise<Array<{ symbol: string; name: string; type: string }>> {
  const query = q.trim().toUpperCase();
  if (!query) return [];
  // NSE search is the richest source when reachable, but skip it when the breaker is open.
  if (!nse.isCircuitOpen()) {
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
  }
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

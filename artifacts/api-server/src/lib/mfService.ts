import axios from "axios";
import { logger } from "./logger";
import { setCache, getCache } from "./cache";

const mfapi = axios.create({ timeout: 8_000, validateStatus: (s) => s >= 200 && s < 500 });

export interface MfHit {
  schemeCode: string;
  schemeName: string;
}

export interface MfNavPoint {
  date: string;
  nav: number;
}

export interface MfDetail {
  schemeCode: string;
  schemeName: string;
  fundHouse: string;
  category: string;
  currentNav: number;
  change1d: number;
  change1w: number;
  change1m: number;
  change1y: number;
  history: MfNavPoint[];
}

export async function searchMf(q: string): Promise<MfHit[]> {
  const query = q.trim();
  if (!query) return [];
  try {
    const res = await mfapi.get(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`);
    if (res.status >= 400 || !Array.isArray(res.data)) return [];
    return res.data.slice(0, 20).map((r: { schemeCode: number | string; schemeName: string }) => ({
      schemeCode: String(r.schemeCode),
      schemeName: String(r.schemeName),
    }));
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "mf search failed");
    return [];
  }
}

function pct(prev: number, curr: number): number {
  if (!prev || !Number.isFinite(prev) || !Number.isFinite(curr)) return 0;
  return +(((curr - prev) / prev) * 100).toFixed(2);
}

export async function getMfDetail(code: string): Promise<MfDetail | null> {
  const cacheKey = `mf:${code}`;
  try {
    const res = await mfapi.get(`https://api.mfapi.in/mf/${encodeURIComponent(code)}`);
    if (res.status >= 400 || !res.data?.meta) {
      const cached = await getCache<MfDetail>(cacheKey);
      return cached?.value ?? null;
    }
    const data: { meta: { scheme_name: string; fund_house: string; scheme_category: string }; data: Array<{ date: string; nav: string }> } = res.data;
    const navs: MfNavPoint[] = (data.data || [])
      .map((p) => ({
        date: p.date,
        nav: Number(p.nav),
      }))
      .filter((p) => Number.isFinite(p.nav))
      .reverse();

    const last = navs[navs.length - 1]?.nav ?? 0;
    const prev1d = navs[navs.length - 2]?.nav ?? last;
    const prev1w = navs[Math.max(0, navs.length - 6)]?.nav ?? last;
    const prev1m = navs[Math.max(0, navs.length - 22)]?.nav ?? last;
    const prev1y = navs[Math.max(0, navs.length - 252)]?.nav ?? last;

    const detail: MfDetail = {
      schemeCode: code,
      schemeName: data.meta.scheme_name,
      fundHouse: data.meta.fund_house,
      category: data.meta.scheme_category,
      currentNav: last,
      change1d: pct(prev1d, last),
      change1w: pct(prev1w, last),
      change1m: pct(prev1m, last),
      change1y: pct(prev1y, last),
      history: navs.slice(-365),
    };
    await setCache(cacheKey, detail);
    return detail;
  } catch (err) {
    logger.warn({ code, err: (err as Error).message }, "mf detail failed");
    const cached = await getCache<MfDetail>(cacheKey);
    return cached?.value ?? null;
  }
}

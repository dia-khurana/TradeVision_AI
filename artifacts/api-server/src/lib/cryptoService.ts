import axios from "axios";
import { logger } from "./logger";
import { setCache, getCache } from "./cache";

const cg = axios.create({ timeout: 8_000, validateStatus: (s) => s >= 200 && s < 500 });

export interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
}

const TRACKED_COINS = "bitcoin,ethereum,solana,ripple,cardano,dogecoin,polkadot,polygon,avalanche-2,chainlink";

export async function fetchCryptoPrices(): Promise<{ coins: CryptoCoin[]; updatedAt: string }> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${TRACKED_COINS}&order=market_cap_desc&per_page=20&page=1`;
    const res = await cg.get(url);
    if (res.status >= 400 || !Array.isArray(res.data)) {
      const cached = await getCache<{ coins: CryptoCoin[]; updatedAt: string }>("crypto:prices");
      return cached?.value ?? { coins: [], updatedAt: new Date().toISOString() };
    }
    const coins: CryptoCoin[] = res.data.map((c: { id: string; symbol: string; name: string; current_price: number; price_change_percentage_24h: number }) => ({
      id: c.id,
      symbol: String(c.symbol).toUpperCase(),
      name: c.name,
      priceUsd: Number(c.current_price) || 0,
      change24h: Number(c.price_change_percentage_24h) || 0,
    }));
    const payload = { coins, updatedAt: new Date().toISOString() };
    await setCache("crypto:prices", payload);
    return payload;
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "crypto prices failed");
    const cached = await getCache<{ coins: CryptoCoin[]; updatedAt: string }>("crypto:prices");
    return cached?.value ?? { coins: [], updatedAt: new Date().toISOString() };
  }
}

export async function fetchCryptoHistory(
  coin: string,
): Promise<Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }>> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coin)}/market_chart?vs_currency=usd&days=180`;
    const res = await cg.get(url);
    const prices: Array<[number, number]> = res.data?.prices || [];
    const vols: Array<[number, number]> = res.data?.total_volumes || [];
    return prices.map((p, i) => ({
      time: new Date(p[0]).toISOString().slice(0, 10),
      open: p[1],
      high: p[1],
      low: p[1],
      close: p[1],
      volume: vols[i]?.[1] ?? 0,
    }));
  } catch (err) {
    logger.warn({ coin, err: (err as Error).message }, "crypto history failed");
    return [];
  }
}

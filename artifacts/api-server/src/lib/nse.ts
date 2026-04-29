import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { logger } from "./logger";

const BASE = "https://www.nseindia.com";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  Referer: "https://www.nseindia.com/",
  Connection: "keep-alive",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
};

const SEED_PATHS = ["/", "/option-chain"];

const NSE_TIMEOUT_MS = 4_000;
const CB_FAIL_THRESHOLD = 3;
const CB_OPEN_MS = 5 * 60_000;

export class NseClient {
  private cookieJar: Map<string, string> = new Map();
  private cookieExpiry: number = 0;
  private client: AxiosInstance;

  // Circuit breaker
  private failures = 0;
  private openUntil = 0;

  // Single-flight seed
  private seeding: Promise<void> | null = null;

  constructor() {
    this.client = axios.create({
      timeout: NSE_TIMEOUT_MS,
      headers: HEADERS,
      validateStatus: (s) => s >= 200 && s < 500,
      decompress: true,
    });
  }

  private absorbCookies(res: AxiosResponse): number {
    const sc = res.headers["set-cookie"];
    if (!sc) return 0;
    const list = Array.isArray(sc) ? sc : [sc];
    let added = 0;
    for (const raw of list) {
      const pair = raw.split(";", 1)[0];
      const eq = pair.indexOf("=");
      if (eq <= 0) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (!name) continue;
      this.cookieJar.set(name, value);
      added++;
    }
    return added;
  }

  private cookieHeader(): string {
    return Array.from(this.cookieJar.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  private isOpen(): boolean {
    return Date.now() < this.openUntil;
  }

  private tripIfNeeded(err: Error): void {
    this.failures += 1;
    if (this.failures >= CB_FAIL_THRESHOLD) {
      this.openUntil = Date.now() + CB_OPEN_MS;
      this.failures = 0;
      logger.warn(
        { openMs: CB_OPEN_MS, lastErr: err.message },
        "NSE: circuit opened (fallbacks only)",
      );
    }
  }

  private resetBreaker(): void {
    this.failures = 0;
    this.openUntil = 0;
  }

  private async refreshCookies(): Promise<void> {
    if (this.seeding) return this.seeding;
    this.seeding = (async () => {
      let totalAdded = 0;
      for (const path of SEED_PATHS) {
        try {
          const headers: Record<string, string> = { ...HEADERS };
          if (this.cookieJar.size > 0) headers["Cookie"] = this.cookieHeader();
          const res = await this.client.get(BASE + path, {
            headers,
            responseType: "text",
            transformResponse: (d) => d,
          });
          const added = this.absorbCookies(res);
          totalAdded += added;
          if (totalAdded > 0) break; // one good seed is enough
        } catch (err) {
          logger.debug(
            { path, err: (err as Error).message },
            "NSE: seed page failed",
          );
        }
      }
      if (totalAdded > 0) {
        this.cookieExpiry = Date.now() + 5 * 60 * 1000;
      }
    })();
    try {
      await this.seeding;
    } finally {
      this.seeding = null;
    }
  }

  private async ensureCookies(): Promise<void> {
    if (this.cookieJar.size === 0 || Date.now() > this.cookieExpiry) {
      await this.refreshCookies();
    }
  }

  async getJson<T = unknown>(path: string): Promise<T> {
    if (this.isOpen()) {
      throw new Error("NSE circuit open");
    }
    try {
      await this.ensureCookies();
      const url = BASE + path;

      const doFetch = async (): Promise<AxiosResponse> => {
        const headers: Record<string, string> = { ...HEADERS };
        if (this.cookieJar.size > 0) headers["Cookie"] = this.cookieHeader();
        return this.client.get(url, { headers });
      };

      let res = await doFetch();
      const isHtmlBody =
        typeof res.data === "string" && res.data.trim().startsWith("<");
      if (
        res.status === 401 ||
        res.status === 403 ||
        res.status === 419 ||
        isHtmlBody
      ) {
        this.cookieJar.clear();
        await this.refreshCookies();
        res = await doFetch();
      }

      if (res.status >= 400) {
        throw new Error(`NSE ${path} returned ${res.status}`);
      }

      let data: T;
      if (typeof res.data === "string") {
        try {
          data = JSON.parse(res.data) as T;
        } catch {
          throw new Error(`NSE ${path} returned non-JSON body`);
        }
      } else {
        data = res.data as T;
      }
      this.resetBreaker();
      return data;
    } catch (err) {
      this.tripIfNeeded(err as Error);
      throw err;
    }
  }

  isCircuitOpen(): boolean {
    return this.isOpen();
  }
}

export const nse = new NseClient();

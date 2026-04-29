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

const SEED_PATHS = [
  "/",
  "/option-chain",
  "/market-data/live-equity-market",
];

export class NseClient {
  private cookieJar: Map<string, string> = new Map();
  private cookieExpiry: number = 0;
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 12_000,
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

  private async refreshCookies(): Promise<void> {
    let totalAdded = 0;
    for (const path of SEED_PATHS) {
      try {
        const headers: Record<string, string> = { ...HEADERS };
        if (this.cookieJar.size > 0) headers["Cookie"] = this.cookieHeader();
        const res = await this.client.get(BASE + path, {
          headers,
          responseType: "text",
          transformResponse: (d) => d, // keep raw
        });
        const added = this.absorbCookies(res);
        totalAdded += added;
      } catch (err) {
        logger.warn(
          { path, err: (err as Error).message },
          "NSE: seed page failed",
        );
      }
    }
    if (totalAdded > 0) {
      this.cookieExpiry = Date.now() + 5 * 60 * 1000;
      logger.info({ jar: this.cookieJar.size }, "NSE: cookies seeded");
    } else {
      logger.warn(
        { jar: this.cookieJar.size },
        "NSE: no new cookies acquired",
      );
    }
  }

  private async ensureCookies(): Promise<void> {
    if (this.cookieJar.size === 0 || Date.now() > this.cookieExpiry) {
      await this.refreshCookies();
    }
  }

  async getJson<T = unknown>(path: string): Promise<T> {
    await this.ensureCookies();
    const url = BASE + path;

    const doFetch = async (): Promise<AxiosResponse> => {
      const headers: Record<string, string> = { ...HEADERS };
      if (this.cookieJar.size > 0) headers["Cookie"] = this.cookieHeader();
      return this.client.get(url, { headers });
    };

    let res = await doFetch();
    // NSE returns 401/403/419 (sometimes 200 with HTML) when cookies expire
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
    if (typeof res.data === "string") {
      // Sometimes returns string JSON
      try {
        return JSON.parse(res.data) as T;
      } catch {
        throw new Error(`NSE ${path} returned non-JSON body`);
      }
    }
    return res.data as T;
  }
}

export const nse = new NseClient();

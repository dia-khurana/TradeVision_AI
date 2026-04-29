import {
  db,
  usersTable,
  portfolioTable,
  watchlistTable,
  botsTable,
  botTradesTable,
  mfWatchlistTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";
import { logger } from "./logger";
import { symbolMeta } from "./symbols";

const DEMO_EMAIL = "demo@tradevision.in";
const DEMO_PASSWORD = "TradeVision@2025";
const DEMO_NAME = "Demo Trader";
const DEMO_INITIALS = "DT";

const PORTFOLIO_SEED: Array<{ symbol: string; qty: number; avgPrice: number }> = [
  { symbol: "RELIANCE", qty: 25, avgPrice: 2480 },
  { symbol: "HDFCBANK", qty: 40, avgPrice: 1605 },
  { symbol: "INFY", qty: 30, avgPrice: 1420 },
  { symbol: "TCS", qty: 15, avgPrice: 3420 },
  { symbol: "TATASTEEL", qty: 100, avgPrice: 142 },
  { symbol: "BAJFINANCE", qty: 8, avgPrice: 6750 },
  { symbol: "ICICIBANK", qty: 50, avgPrice: 985 },
  { symbol: "MARUTI", qty: 5, avgPrice: 10950 },
  { symbol: "HCLTECH", qty: 20, avgPrice: 1340 },
  { symbol: "ZOMATO", qty: 200, avgPrice: 145 },
];

const WATCHLIST_SEED = ["AXISBANK", "SBIN", "WIPRO", "ADANIENT", "LTIM", "NIFTY", "BANKNIFTY"];

const BOTS_SEED: Array<{
  name: string;
  type: string;
  capital: number;
  config: string;
}> = [
  {
    name: "RELIANCE Momentum",
    type: "MOMENTUM",
    capital: 200000,
    config: JSON.stringify({ symbol: "RELIANCE", qty: 10, threshold: 0.5 }),
  },
  {
    name: "HDFCBANK Grid",
    type: "GRID",
    capital: 150000,
    config: JSON.stringify({ symbol: "HDFCBANK", qty: 5, gridLow: 1550, gridHigh: 1700 }),
  },
  {
    name: "Weekly Expiry Theta",
    type: "OPTIONS_EXPIRY",
    capital: 100000,
    config: JSON.stringify({ symbol: "NIFTY", qty: 50 }),
  },
];

const MF_SEED: Array<{ schemeCode: string; name: string }> = [
  { schemeCode: "120503", name: "Parag Parikh Flexi Cap Fund — Direct Growth" },
  { schemeCode: "118989", name: "Mirae Asset Large Cap Fund — Direct Growth" },
  { schemeCode: "125354", name: "Axis Bluechip Fund — Direct Growth" },
];

export async function seedAll(): Promise<void> {
  // 1) Demo user
  let userId: number;
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, DEMO_EMAIL))
    .limit(1);
  if (existing.length > 0) {
    userId = existing[0].id;
    logger.info({ email: DEMO_EMAIL, id: userId }, "seed: demo user exists");
  } else {
    const hash = await hashPassword(DEMO_PASSWORD);
    const inserted = await db
      .insert(usersTable)
      .values({
        email: DEMO_EMAIL,
        passwordHash: hash,
        name: DEMO_NAME,
        avatarInitials: DEMO_INITIALS,
        plan: "demo",
      })
      .returning({ id: usersTable.id });
    userId = inserted[0].id;
    logger.info({ email: DEMO_EMAIL, id: userId }, "seed: created demo user");
  }

  // 2) Portfolio (only seed if empty)
  const pfCount = await db
    .select({ id: portfolioTable.id })
    .from(portfolioTable)
    .where(eq(portfolioTable.userId, userId));
  if (pfCount.length === 0) {
    await db.insert(portfolioTable).values(
      PORTFOLIO_SEED.map((p) => ({
        userId,
        symbol: p.symbol,
        assetType: "equity",
        qty: p.qty,
        avgPrice: p.avgPrice,
        sector: symbolMeta(p.symbol).sector,
      })),
    );
    logger.info({ count: PORTFOLIO_SEED.length }, "seed: portfolio");
  }

  // 3) Watchlist
  const wlCount = await db
    .select({ id: watchlistTable.id })
    .from(watchlistTable)
    .where(eq(watchlistTable.userId, userId));
  if (wlCount.length === 0) {
    await db.insert(watchlistTable).values(
      WATCHLIST_SEED.map((s) => ({
        userId,
        symbol: s,
        assetType: ["NIFTY", "BANKNIFTY"].includes(s) ? "index" : "equity",
      })),
    );
    logger.info({ count: WATCHLIST_SEED.length }, "seed: watchlist");
  }

  // 4) Bots + simulated 30-day trade history
  const botCount = await db
    .select({ id: botsTable.id })
    .from(botsTable)
    .where(eq(botsTable.userId, userId));
  if (botCount.length === 0) {
    for (const b of BOTS_SEED) {
      const inserted = await db
        .insert(botsTable)
        .values({
          userId,
          name: b.name,
          type: b.type,
          config: b.config,
          status: "running",
          capital: b.capital,
        })
        .returning({ id: botsTable.id });
      const botId = inserted[0].id;

      // Seed 30 days of trades
      const trades: Array<{
        botId: number;
        symbol: string;
        action: string;
        price: number;
        qty: number;
        pnl: number;
        executedAt: Date;
      }> = [];
      const cfg = JSON.parse(b.config) as { symbol?: string; qty?: number };
      const sym = cfg.symbol || "RELIANCE";
      const qty = cfg.qty || 10;
      const now = Date.now();
      for (let day = 30; day >= 0; day--) {
        const tradesPerDay = b.type === "OPTIONS_EXPIRY" ? 1 : b.type === "DCA" ? 1 : 2;
        for (let t = 0; t < tradesPerDay; t++) {
          const win = Math.random() < (b.type === "OPTIONS_EXPIRY" ? 0.7 : 0.58);
          const magnitude =
            b.type === "OPTIONS_EXPIRY" ? 60 + Math.random() * 200 : 80 + Math.random() * 220;
          const pnl = win ? magnitude : -magnitude * 0.85;
          trades.push({
            botId,
            symbol: sym,
            action: t % 2 === 0 ? "BUY" : "SELL",
            price: 100 + Math.random() * 2000,
            qty,
            pnl: +pnl.toFixed(2),
            executedAt: new Date(now - day * 24 * 60 * 60 * 1000 + t * 3 * 60 * 60 * 1000),
          });
        }
      }
      await db.insert(botTradesTable).values(trades);

      const totalPnl = trades.reduce((acc, t) => acc + t.pnl, 0);
      const wins = trades.filter((t) => t.pnl > 0).length;
      const winRate = +((wins / trades.length) * 100).toFixed(1);
      await db
        .update(botsTable)
        .set({
          pnl: +totalPnl.toFixed(2),
          tradesCount: trades.length,
          winRate,
        })
        .where(eq(botsTable.id, botId));
    }
    logger.info({ count: BOTS_SEED.length }, "seed: bots + trade history");
  }

  // 5) MF watchlist
  const mfCount = await db
    .select({ id: mfWatchlistTable.id })
    .from(mfWatchlistTable)
    .where(eq(mfWatchlistTable.userId, userId));
  if (mfCount.length === 0) {
    await db.insert(mfWatchlistTable).values(
      MF_SEED.map((m) => ({
        userId,
        schemeCode: m.schemeCode,
        name: m.name,
      })),
    );
    logger.info({ count: MF_SEED.length }, "seed: mf");
  }
}

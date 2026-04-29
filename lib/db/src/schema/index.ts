import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default(""),
  plan: text("plan").notNull().default("demo"),
  avatarInitials: text("avatar_initials").notNull().default("DT"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;

export const signalsTable = pgTable("signals", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  action: text("action").notNull(),
  type: text("type").notNull(),
  strategy: text("strategy").notNull().default(""),
  entry: doublePrecision("entry").notNull(),
  target: doublePrecision("target").notNull(),
  sl: doublePrecision("sl").notNull(),
  confidence: integer("confidence").notNull(),
  rationale: text("rationale").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Signal = typeof signalsTable.$inferSelect;

export const marketCacheTable = pgTable("market_cache", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  type: text("type").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Alert = typeof alertsTable.$inferSelect;

export const portfolioTable = pgTable("portfolio", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  symbol: text("symbol").notNull(),
  assetType: text("asset_type").notNull().default("equity"),
  qty: doublePrecision("qty").notNull(),
  avgPrice: doublePrecision("avg_price").notNull(),
  sector: text("sector").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type PortfolioRow = typeof portfolioTable.$inferSelect;

export const watchlistTable = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  symbol: text("symbol").notNull(),
  assetType: text("asset_type").notNull().default("equity"),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});
export type WatchlistRow = typeof watchlistTable.$inferSelect;

export const botsTable = pgTable("bots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  config: text("config").notNull().default("{}"),
  status: text("status").notNull().default("stopped"),
  capital: doublePrecision("capital").notNull().default(0),
  pnl: doublePrecision("pnl").notNull().default(0),
  tradesCount: integer("trades_count").notNull().default(0),
  winRate: doublePrecision("win_rate").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Bot = typeof botsTable.$inferSelect;

export const botTradesTable = pgTable("bot_trades", {
  id: serial("id").primaryKey(),
  botId: integer("bot_id").notNull(),
  symbol: text("symbol").notNull(),
  action: text("action").notNull(),
  price: doublePrecision("price").notNull(),
  qty: doublePrecision("qty").notNull(),
  pnl: doublePrecision("pnl").notNull().default(0),
  executedAt: timestamp("executed_at", { withTimezone: true }).notNull().defaultNow(),
});
export type BotTrade = typeof botTradesTable.$inferSelect;

export const newsCacheTable = pgTable("news_cache", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  source: text("source").notNull(),
  url: text("url").notNull(),
  category: text("category").notNull().default("market"),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
});
export type NewsRow = typeof newsCacheTable.$inferSelect;

export const mfWatchlistTable = pgTable("mf_watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  schemeCode: text("scheme_code").notNull(),
  name: text("name").notNull(),
  nav: doublePrecision("nav").notNull().default(0),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});
export type MfWatchRow = typeof mfWatchlistTable.$inferSelect;

export const chatHistoryTable = pgTable("chat_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  hasImage: boolean("has_image").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type ChatRow = typeof chatHistoryTable.$inferSelect;

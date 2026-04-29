# TradeVision AI

## Overview

A real-time Indian markets trading platform: live NSE/BSE indices, F&O options chain, AI signals, paper-trading bots, vision-enabled AI chat, watchlist, mutual funds, crypto, and US stocks — wrapped in a light "premium 3D" UI.

Demo login: `demo@tradevision.in` / `TradeVision@2025`

## Architecture

pnpm monorepo with three artifacts:

- `artifacts/api-server` — Express + Drizzle (Postgres) JWT auth API. Routes: market, signals, options, fii-dii, news, watchlist, portfolio, bots, chat, mutual-funds, crypto, alerts, search, history, screener.
- `artifacts/tradevision` — React + Vite + wouter frontend (light premium theme `#F0F4FF`, indigo `#6366F1`, Three.js animated landing).
- `artifacts/mockup-sandbox` — component preview sandbox (unused for prod).

Shared libs:

- `lib/api-spec` — OpenAPI is the contract source of truth; run `pnpm --filter @workspace/api-spec run codegen` after edits.
- `lib/api-client-react` — generated React Query hooks + Zod schemas.
- `lib/api-zod` — generated server-side validators.
- `lib/db` — Drizzle schema + migrations (users, watchlist, portfolio, bots, botTrades, chatMessages, alerts).
- `lib/integrations-gemini-ai` — Gemini 2.5 wrapper for vision chat.

## Data sources (all live, public)

- NSE / Yahoo Finance fallback for indices & quotes
- NSE option-chain (graceful empty state when blocked)
- mfapi.in for mutual funds NAV
- CoinGecko for crypto
- Yahoo for US stocks
- A simple internal news service
- Gemini 2.5 for AI chat (text + chart image vision)

## Bot lifecycle

- Status enum is `running` / `stopped` (UI labels: Active / Paused).
- 4 strategies: `MOMENTUM`, `GRID`, `DCA`, `OPTIONS_EXPIRY`.
- `getBotPerformance` returns ALREADY-cumulative pnl per day; UI plots `equity = capital + cumulativePnl`.

## Security notes

- JWT bearer on all protected routes (`requireAuth`).
- Per-user scoping on watchlist, portfolio, bots, bot-trades, chat history, **and alerts** (alerts allow `userId NULL` shared rows).
- SESSION_SECRET env var required.

## Conventions

- Frontend uses generated `useGet*` hooks + `getGet*QueryKey` from `@workspace/api-client-react`.
- Backend uses Zod-parsed responses from `@workspace/api-zod`.
- Charts use `dataKey="time" / "close"` (not `t`/`c`) per `Candle` schema.

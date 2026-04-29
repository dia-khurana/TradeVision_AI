import { Router, type IRouter } from "express";
import { db, watchlistTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { type AuthedRequest, requireAuth } from "../lib/auth";
import { fetchQuotesBatch, fetchIndices } from "../lib/marketService";
import {
  GetWatchlistResponse,
  AddToWatchlistBody,
  AddToWatchlistResponse,
  RemoveFromWatchlistResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/watchlist", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.sub;
  const rows = await db
    .select()
    .from(watchlistTable)
    .where(eq(watchlistTable.userId, userId));

  // Run indices + batched equity quotes in parallel.
  const equitySymbols = rows.filter((r) => r.assetType !== "index").map((r) => r.symbol);
  const [indices, quotes] = await Promise.all([
    fetchIndices(),
    fetchQuotesBatch(equitySymbols),
  ]);

  const items = rows.map((r) => {
    let price = 0;
    let change = 0;
    let changePct = 0;
    if (r.assetType === "index") {
      const idx = indices.indices.find((i) => i.symbol === r.symbol);
      if (idx) {
        price = idx.price;
        change = idx.change;
        changePct = idx.changePct;
      }
    } else {
      const q = quotes.get(r.symbol.toUpperCase());
      if (q) {
        price = q.price;
        change = q.change;
        changePct = q.changePct;
      }
    }
    return {
      id: r.id,
      symbol: r.symbol,
      assetType: r.assetType,
      price,
      change,
      changePct,
    };
  });

  res.json(
    GetWatchlistResponse.parse({
      items,
      updatedAt: new Date().toISOString(),
    }),
  );
});

router.post("/watchlist", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.sub;
  const parse = AddToWatchlistBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { symbol, assetType } = parse.data;
  const existing = await db
    .select()
    .from(watchlistTable)
    .where(and(eq(watchlistTable.userId, userId), eq(watchlistTable.symbol, symbol.toUpperCase())))
    .limit(1);
  if (existing.length === 0) {
    await db.insert(watchlistTable).values({
      userId,
      symbol: symbol.toUpperCase(),
      assetType,
    });
  }
  res.json(AddToWatchlistResponse.parse({ ok: true }));
});

router.delete("/watchlist/:symbol", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.sub;
  const sym = String(req.params["symbol"] || "").toUpperCase();
  await db
    .delete(watchlistTable)
    .where(and(eq(watchlistTable.userId, userId), eq(watchlistTable.symbol, sym)));
  res.json(RemoveFromWatchlistResponse.parse({ ok: true }));
});

export default router;

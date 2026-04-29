import { Router, type IRouter } from "express";
import {
  fetchIndices,
  fetchFiiDii,
  fetchOptionsChain,
  fetchQuote,
  fetchHistory,
  searchSymbols,
} from "../lib/marketService";
import { requireAuth } from "../lib/auth";
import {
  GetMarketIndicesResponse,
  GetFiiDiiResponse,
  GetOptionsChainForResponse,
  GetQuoteResponse,
  GetHistoryResponse,
  SearchSymbolsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/market/indices", async (_req, res) => {
  const data = await fetchIndices();
  res.json(GetMarketIndicesResponse.parse(data));
});

router.get("/market/fii-dii", async (_req, res) => {
  const data = await fetchFiiDii();
  res.json(GetFiiDiiResponse.parse(data));
});

router.get("/market/options/:underlying", async (req, res) => {
  const u = String(req.params["underlying"] || "NIFTY").toUpperCase();
  const allowed: Array<"NIFTY" | "BANKNIFTY"> = ["NIFTY", "BANKNIFTY"];
  const underlying = allowed.includes(u as "NIFTY" | "BANKNIFTY")
    ? (u as "NIFTY" | "BANKNIFTY")
    : "NIFTY";
  const data = await fetchOptionsChain(underlying);
  res.json(GetOptionsChainForResponse.parse(data));
});

router.get("/market/quote/:symbol", requireAuth, async (req, res) => {
  const sym = String(req.params["symbol"] || "");
  const q = await fetchQuote(sym);
  if (!q) {
    res.status(404).json({ error: "Quote not available" });
    return;
  }
  res.json(GetQuoteResponse.parse(q));
});

router.get("/market/history/:symbol", requireAuth, async (req, res) => {
  const sym = String(req.params["symbol"] || "");
  const data = await fetchHistory(sym);
  res.json(GetHistoryResponse.parse(data));
});

router.get("/market/search", requireAuth, async (req, res) => {
  const q = String(req.query["q"] || "");
  const results = await searchSymbols(q);
  res.json(SearchSymbolsResponse.parse({ results }));
});

export default router;

import { Router, type IRouter } from "express";
import {
  GetMarketIndicesResponse,
  GetFiiDiiResponse,
  GetOptionsChainResponse,
  GetQuoteResponse,
} from "@workspace/api-zod";
import {
  fetchIndices,
  fetchFiiDii,
  fetchOptions,
  fetchQuote,
} from "../lib/marketService";
import { getMem } from "../lib/cache";

const router: IRouter = Router();

router.get("/market/indices", async (_req, res) => {
  const cached = getMem<unknown>("market:indices");
  const data = cached ? (cached.value as Awaited<ReturnType<typeof fetchIndices>>) : await fetchIndices();
  res.json(GetMarketIndicesResponse.parse(data));
});

router.get("/market/fii-dii", async (_req, res) => {
  const cached = getMem<unknown>("market:fii-dii");
  const data = cached ? (cached.value as Awaited<ReturnType<typeof fetchFiiDii>>) : await fetchFiiDii();
  res.json(GetFiiDiiResponse.parse(data));
});

router.get("/market/options", async (_req, res) => {
  const cached = getMem<unknown>("market:options");
  const data = cached ? (cached.value as Awaited<ReturnType<typeof fetchOptions>>) : await fetchOptions();
  res.json(GetOptionsChainResponse.parse(data));
});

router.get("/market/quote/:symbol", async (req, res) => {
  const sym = String(req.params.symbol || "").toUpperCase();
  if (!sym) {
    res.status(400).json({ error: "symbol required" });
    return;
  }
  const data = await fetchQuote(sym);
  if (!data) {
    res.status(404).json({ error: `Quote not available for ${sym}` });
    return;
  }
  res.json(GetQuoteResponse.parse(data));
});

export default router;

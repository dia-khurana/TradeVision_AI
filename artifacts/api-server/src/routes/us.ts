import { Router, type IRouter } from "express";
import { yahooChart } from "../lib/yahoo";
import { GetUsHistoryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/us/:symbol", async (req, res) => {
  const sym = String(req.params["symbol"] || "").toUpperCase();
  const candles = await yahooChart(sym, "6mo", "1d");
  res.json(
    GetUsHistoryResponse.parse({
      symbol: sym,
      candles,
      updatedAt: new Date().toISOString(),
    }),
  );
});

export default router;

import { Router, type IRouter } from "express";
import { fetchCryptoPrices, fetchCryptoHistory } from "../lib/cryptoService";
import { GetCryptoPricesResponse, GetCryptoHistoryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/crypto", async (_req, res) => {
  const data = await fetchCryptoPrices();
  res.json(GetCryptoPricesResponse.parse(data));
});

router.get("/crypto/:coin/history", async (req, res) => {
  const coin = String(req.params["coin"] || "");
  const candles = await fetchCryptoHistory(coin);
  res.json(
    GetCryptoHistoryResponse.parse({
      symbol: coin,
      candles,
      updatedAt: new Date().toISOString(),
    }),
  );
});

export default router;

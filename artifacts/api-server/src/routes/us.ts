import { Router, type IRouter } from "express";
import { fetchHistoryRaw } from "../lib/marketService";
import { GetUsHistoryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/us/:symbol", async (req, res) => {
  const sym = String(req.params["symbol"] || "").toUpperCase();
  const payload = await fetchHistoryRaw(sym);
  res.json(GetUsHistoryResponse.parse(payload));
});

export default router;

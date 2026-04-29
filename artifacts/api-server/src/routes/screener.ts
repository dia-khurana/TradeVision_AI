import { Router, type IRouter } from "express";
import { runScreener } from "../lib/screenerService";
import { RunScreenerResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/screener", async (req, res) => {
  const sector = req.query["sector"] ? String(req.query["sector"]) : undefined;
  const minPrice = req.query["minPrice"] ? Number(req.query["minPrice"]) : undefined;
  const maxPrice = req.query["maxPrice"] ? Number(req.query["maxPrice"]) : undefined;
  const minRsi = req.query["minRsi"] ? Number(req.query["minRsi"]) : undefined;
  const maxRsi = req.query["maxRsi"] ? Number(req.query["maxRsi"]) : undefined;

  const rows = await runScreener({ sector, minPrice, maxPrice, minRsi, maxRsi });
  res.json(RunScreenerResponse.parse({ rows }));
});

export default router;

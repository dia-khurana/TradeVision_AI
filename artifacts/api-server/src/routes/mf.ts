import { Router, type IRouter } from "express";
import { searchMf, getMfDetail } from "../lib/mfService";
import { SearchMutualFundsResponse, GetMutualFundResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/mf/search", async (req, res) => {
  const q = String(req.query["q"] || "");
  const results = await searchMf(q);
  res.json(SearchMutualFundsResponse.parse({ results }));
});

router.get("/mf/:code", async (req, res) => {
  const code = String(req.params["code"] || "");
  const data = await getMfDetail(code);
  if (!data) {
    res.status(404).json({ error: "Scheme not found" });
    return;
  }
  res.json(GetMutualFundResponse.parse(data));
});

export default router;

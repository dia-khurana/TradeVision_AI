import { Router, type IRouter } from "express";
import { getPortfolioForUser } from "../lib/portfolioService";
import { type AuthedRequest, requireAuth } from "../lib/auth";
import { GetPortfolioResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/portfolio", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.user!.sub;
  const data = await getPortfolioForUser(userId);
  res.json(GetPortfolioResponse.parse(data));
});

export default router;

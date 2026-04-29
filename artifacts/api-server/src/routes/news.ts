import { Router, type IRouter } from "express";
import { getNews } from "../lib/newsService";
import { GetNewsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/news", async (_req, res) => {
  const articles = await getNews();
  res.json(GetNewsResponse.parse({ articles }));
});

export default router;

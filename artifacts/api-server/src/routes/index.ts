import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import marketRouter from "./market";
import signalsRouter from "./signals";
import alertsRouter from "./alerts";
import chatRouter from "./chat";
import newsRouter from "./news";
import mfRouter from "./mf";
import usRouter from "./us";
import cryptoRouter from "./crypto";
import portfolioRouter from "./portfolio";
import watchlistRouter from "./watchlist";
import botsRouter from "./bots";
import screenerRouter from "./screener";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(marketRouter);
router.use(signalsRouter);
router.use(alertsRouter);
router.use(chatRouter);
router.use(newsRouter);
router.use(mfRouter);
router.use(usRouter);
router.use(cryptoRouter);
router.use(portfolioRouter);
router.use(watchlistRouter);
router.use(botsRouter);
router.use(screenerRouter);

export default router;

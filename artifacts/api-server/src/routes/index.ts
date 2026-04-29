import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import marketRouter from "./market";
import signalsRouter from "./signals";
import alertsRouter from "./alerts";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(marketRouter);
router.use(signalsRouter);
router.use(alertsRouter);
router.use(chatRouter);

export default router;

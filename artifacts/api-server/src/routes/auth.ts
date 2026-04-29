import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  AuthLoginBody,
  AuthLoginResponse,
  AuthVerifyResponse,
} from "@workspace/api-zod";
import {
  comparePassword,
  signToken,
  requireAuth,
  type AuthedRequest,
} from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res) => {
  const parse = AuthLoginBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  const { email, password } = parse.data;

  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);
  const user = rows[0];
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ sub: user.id, email: user.email, plan: user.plan });
  const payload = AuthLoginResponse.parse({
    token,
    user: { id: user.id, email: user.email, plan: user.plan },
  });
  res.json(payload);
});

router.get("/auth/verify", requireAuth, async (req: AuthedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const payload = AuthVerifyResponse.parse({
    user: { id: req.user.sub, email: req.user.email, plan: req.user.plan },
  });
  res.json(payload);
});

export default router;

import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  comparePassword,
  signToken,
  verifyToken,
  type AuthedRequest,
  requireAuth,
} from "../lib/auth";
import { AuthLoginBody, AuthLoginResponse, AuthVerifyResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/login", async (req, res) => {
  const parse = AuthLoginBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { email, password } = parse.data;
  const rows = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (rows.length === 0) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const user = rows[0];
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = signToken({ sub: user.id, email: user.email, plan: user.plan });
  const payload = AuthLoginResponse.parse({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split("@")[0],
      plan: user.plan,
      avatarInitials: user.avatarInitials || user.email.slice(0, 2).toUpperCase(),
    },
  });
  res.json(payload);
});

router.get("/auth/verify", async (req: AuthedRequest, res) => {
  const auth = req.header("authorization") || req.header("Authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) {
    res.status(401).json({ error: "Missing token" });
    return;
  }
  const decoded = verifyToken(auth.slice(7).trim());
  if (!decoded) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  const rows = await db.select().from(usersTable).where(eq(usersTable.id, decoded.sub)).limit(1);
  if (rows.length === 0) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const u = rows[0];
  res.json(
    AuthVerifyResponse.parse({
      user: {
        id: u.id,
        email: u.email,
        name: u.name || u.email.split("@")[0],
        plan: u.plan,
        avatarInitials: u.avatarInitials || u.email.slice(0, 2).toUpperCase(),
      },
    }),
  );
});

// `requireAuth` re-exported for convenience for any future-protected auth route
export { requireAuth };
export default router;

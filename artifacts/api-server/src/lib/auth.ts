import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

const SECRET = process.env["SESSION_SECRET"];
if (!SECRET || SECRET.length < 16) {
  throw new Error(
    "SESSION_SECRET environment variable must be set to a strong secret (>= 16 chars). Refusing to start with a missing or weak secret.",
  );
}
const SECRET_RESOLVED: string = SECRET;
const EXPIRES_IN = "24h";

export interface JwtPayload {
  sub: number;
  email: string;
  plan: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET_RESOLVED, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET_RESOLVED) as unknown as JwtPayload;
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      typeof decoded.sub === "number" &&
      typeof decoded.email === "string" &&
      typeof decoded.plan === "string"
    ) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface AuthedRequest extends Request {
  user?: JwtPayload;
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): void {
  const auth = req.header("authorization") || req.header("Authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const token = auth.slice(7).trim();
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  req.user = payload;
  next();
}

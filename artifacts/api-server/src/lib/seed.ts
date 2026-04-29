import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";
import { logger } from "./logger";

const DEMO_EMAIL = "demo@tradevision.in";
const DEMO_PASSWORD = "TradeVision@2025";

export async function seedDemoUser(): Promise<void> {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, DEMO_EMAIL))
    .limit(1);
  if (existing.length > 0) {
    logger.info({ email: DEMO_EMAIL }, "seed: demo user already exists");
    return;
  }
  const hash = await hashPassword(DEMO_PASSWORD);
  await db.insert(usersTable).values({
    email: DEMO_EMAIL,
    passwordHash: hash,
    plan: "demo",
  });
  logger.info({ email: DEMO_EMAIL }, "seed: created demo user");
}

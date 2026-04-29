import { db, marketCacheTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const memCache = new Map<string, { value: unknown; updatedAt: Date }>();

export async function setCache(key: string, value: unknown): Promise<void> {
  const updatedAt = new Date();
  memCache.set(key, { value, updatedAt });
  const json = JSON.stringify(value);
  await db
    .insert(marketCacheTable)
    .values({ key, value: json, updatedAt })
    .onConflictDoUpdate({
      target: marketCacheTable.key,
      set: { value: json, updatedAt },
    });
}

export async function getCache<T = unknown>(
  key: string,
): Promise<{ value: T; updatedAt: Date } | null> {
  const mem = memCache.get(key);
  if (mem) return { value: mem.value as T, updatedAt: mem.updatedAt };

  const rows = await db
    .select()
    .from(marketCacheTable)
    .where(eq(marketCacheTable.key, key))
    .limit(1);
  if (rows.length === 0) return null;

  const row = rows[0];
  try {
    const parsed = JSON.parse(row.value) as T;
    memCache.set(key, { value: parsed, updatedAt: row.updatedAt });
    return { value: parsed, updatedAt: row.updatedAt };
  } catch {
    return null;
  }
}

export function getMem<T = unknown>(
  key: string,
): { value: T; updatedAt: Date } | null {
  const m = memCache.get(key);
  if (!m) return null;
  return { value: m.value as T, updatedAt: m.updatedAt };
}

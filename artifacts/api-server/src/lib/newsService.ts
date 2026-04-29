import Parser from "rss-parser";
import { db, newsCacheTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { logger } from "./logger";

const FEEDS: Array<{ url: string; source: string; category: string }> = [
  { url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms", source: "ETMarkets", category: "market" },
  { url: "https://www.livemint.com/rss/markets", source: "LiveMint", category: "market" },
  { url: "https://www.moneycontrol.com/rss/MCtopnews.xml", source: "MoneyControl", category: "market" },
  { url: "https://www.business-standard.com/rss/markets-106.rss", source: "Business Standard", category: "market" },
];

const parser = new Parser({ timeout: 8000 });

export async function refreshNews(): Promise<number> {
  let added = 0;
  for (const feed of FEEDS) {
    try {
      const f = await parser.parseURL(feed.url);
      for (const item of (f.items || []).slice(0, 15)) {
        if (!item.link || !item.title) continue;
        const pub = item.isoDate
          ? new Date(item.isoDate)
          : item.pubDate
            ? new Date(item.pubDate)
            : new Date();
        const summary = (item.contentSnippet || item.summary || "")
          .replace(/<[^>]*>/g, "")
          .slice(0, 400);

        const inserted = await db
          .insert(newsCacheTable)
          .values({
            title: item.title.slice(0, 500),
            summary,
            source: feed.source,
            url: item.link,
            category: feed.category,
            publishedAt: pub,
          })
          .onConflictDoNothing()
          .returning({ id: newsCacheTable.id });
        if (inserted.length > 0) added++;
      }
    } catch (err) {
      logger.warn({ feed: feed.source, err: (err as Error).message }, "news feed failed");
    }
  }
  // Trim to 200 latest
  const all = await db
    .select({ id: newsCacheTable.id })
    .from(newsCacheTable)
    .orderBy(desc(newsCacheTable.publishedAt));
  if (all.length > 200) {
    const keep = all.slice(0, 200).map((r) => r.id);
    await db.delete(newsCacheTable).where(sql`${newsCacheTable.id} NOT IN (${sql.join(keep.map((k) => sql`${k}`), sql`, `)})`);
  }
  if (added > 0) logger.info({ added }, "news: refreshed");
  return added;
}

export async function getNews(): Promise<Array<{
  id: number;
  title: string;
  summary: string;
  source: string;
  url: string;
  category: string;
  publishedAt: string;
}>> {
  const rows = await db
    .select()
    .from(newsCacheTable)
    .orderBy(desc(newsCacheTable.publishedAt))
    .limit(60);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    source: r.source,
    url: r.url,
    category: r.category,
    publishedAt: r.publishedAt.toISOString(),
  }));
}

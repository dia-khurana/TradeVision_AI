import type { Server as IoServer } from "socket.io";
import { recomputeSignals } from "./signalEngine";
import {
  fetchIndices,
  fetchFiiDii,
  fetchOptionsChain,
} from "./marketService";
import { refreshNews } from "./newsService";
import { tickAllBots } from "./botEngine";
import { logger } from "./logger";

const REFRESH_MS = 30_000;
const NEWS_MS = 5 * 60_000;
const BOT_MS = 60_000;

let timer: NodeJS.Timeout | null = null;
let newsTimer: NodeJS.Timeout | null = null;
let botTimer: NodeJS.Timeout | null = null;

async function tick(io: IoServer | null): Promise<void> {
  try {
    const [indices, fiiDii, options] = await Promise.all([
      fetchIndices(),
      fetchFiiDii(),
      fetchOptionsChain("NIFTY"),
    ]);
    if (io) {
      io.emit("market:indices", indices);
      io.emit("market:fii-dii", fiiDii);
      io.emit("market:options", options);
    }
    try {
      await recomputeSignals();
      if (io) io.emit("signals:updated", { at: new Date().toISOString() });
    } catch (err) {
      logger.warn({ err: (err as Error).message }, "signal recompute failed");
    }
  } catch (err) {
    logger.warn({ err: (err as Error).message }, "scheduler tick failed");
  }
}

export async function startScheduler(io: IoServer | null): Promise<void> {
  if (timer) clearInterval(timer);
  if (newsTimer) clearInterval(newsTimer);
  if (botTimer) clearInterval(botTimer);

  await tick(io);
  timer = setInterval(() => void tick(io), REFRESH_MS);

  // News refresh — initial then every 5 min
  void refreshNews().catch((err) => logger.warn({ err: err.message }, "initial news refresh failed"));
  newsTimer = setInterval(
    () => void refreshNews().catch((err) => logger.warn({ err: err.message }, "news refresh failed")),
    NEWS_MS,
  );

  // Bots: tick every minute
  botTimer = setInterval(
    () =>
      void tickAllBots().catch((err) =>
        logger.warn({ err: err.message }, "bot tick failed"),
      ),
    BOT_MS,
  );

  logger.info({ intervalMs: REFRESH_MS }, "scheduler: started");
}

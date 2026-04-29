import type { Server as IoServer } from "socket.io";
import { recomputeSignals } from "./signalEngine";
import {
  fetchIndices,
  fetchFiiDii,
  fetchOptions,
} from "./marketService";
import { logger } from "./logger";

const REFRESH_MS = 30_000;

let timer: NodeJS.Timeout | null = null;

async function tick(io: IoServer | null): Promise<void> {
  try {
    const [indices, fiiDii, options] = await Promise.all([
      fetchIndices(),
      fetchFiiDii(),
      fetchOptions(),
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
  // First tick immediately, then every 30s
  await tick(io);
  timer = setInterval(() => {
    void tick(io);
  }, REFRESH_MS);
  logger.info({ intervalMs: REFRESH_MS }, "scheduler: started");
}

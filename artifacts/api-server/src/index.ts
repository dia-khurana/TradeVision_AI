import { createServer } from "node:http";
import { Server as IoServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";
import { seedDemoUser } from "./lib/seed";
import { startScheduler } from "./lib/scheduler";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);
const io = new IoServer(httpServer, {
  cors: { origin: true, credentials: true },
  path: "/socket.io",
});

io.on("connection", (socket) => {
  logger.info({ id: socket.id }, "socket: client connected");
  socket.on("disconnect", () => {
    logger.info({ id: socket.id }, "socket: client disconnected");
  });
});

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening (HTTP + socket.io)");

  // Seed and start scheduler — non-blocking
  void (async () => {
    try {
      await seedDemoUser();
    } catch (err) {
      logger.error({ err }, "seed failed");
    }
    try {
      await startScheduler(io);
    } catch (err) {
      logger.error({ err }, "scheduler failed to start");
    }
  })();
});

import "dotenv/config";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "@core/config/env.config.js";
import { logger } from "@core/utils/logger.js";
import { createApp } from "./app.js";
import { redisClient, closeRedisConnection } from "@core/config/redis.config.js";
import { connectCloudinary } from "@core/config/cloudinary.config.js";
import { AppServer } from "@core/types/socket.types.js";
import { registerSocketServer } from "@infra/socket/socket.server.js";
import { setSocketServer } from "@infra/socket/socket.registry.js";
import { registerMessageHandlers } from "@modules/message/message.socket-handler.js";
import { registerNotificationHandlers } from "@modules/notification/notification.socket-handler.js";
import { initStoryCleanupCron } from "./jobs/story-cleanup.job.js";
import { initTokenCleanupCron } from "./jobs/token-cleanup.job.js";

const httpServer = createServer();

const io: AppServer = new SocketServer(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const pubClient = redisClient.duplicate({ keyPrefix: "" });
const subClient = redisClient.duplicate({ keyPrefix: "" });

pubClient.on("error", (error: Error) => {
  logger.error(`[REDIS PUB] Connection error: ${error.message}`);
});
subClient.on("error", (error: Error) => {
  logger.error(`[REDIS SUB] Connection error: ${error.message}`);
});

io.adapter(createAdapter(pubClient, subClient, { key: `${env.APP_NAME}:socket.io` }));

setSocketServer(io);

registerSocketServer(io, [
  (socketIo, socket) => registerMessageHandlers(socketIo, socket as never),
  (socketIo, socket) => registerNotificationHandlers(socketIo, socket as never),
]);

const app = createApp();
app.set("io", io);
httpServer.on("request", app);

const storyCron = initStoryCleanupCron();
const tokenCron = initTokenCleanupCron();
logger.info("[CRON] Background jobs initialized (story cleanup & token cleanup).");

const gracefulShutdown = (signal: string): void => {
  logger.info(`[SERVER] ${signal} received - shutting down gracefully`);

  storyCron.stop();
  tokenCron.stop();

  io.close(async () => {
    logger.info("[SERVER] Socket and HTTP server closed. Closing Redis connections...");

    await pubClient.quit();
    await subClient.quit();
    await closeRedisConnection();

    logger.info("[SERVER] All connections closed. Process terminated.");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("[SERVER] Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason: unknown) => {
  logger.error(`[SERVER] Unhandled Promise Rejection: ${reason}`);
  gracefulShutdown("unhandledRejection");
});

process.on("uncaughtException", (error: Error) => {
  logger.error(`[SERVER] Uncaught Exception: ${error.message}`);
  gracefulShutdown("uncaughtException");
});

const bootstrap = async (): Promise<void> => {
  try {
    await connectCloudinary();

    httpServer.listen(env.PORT, () => {
      logger.info(`[SERVER] Running in ${env.NODE_ENV} mode`);
      logger.info(`[SERVER] Listening on http://localhost:${env.PORT}`);
      logger.info(`[SERVER] API Docs: http://localhost:${env.PORT}/docs`);
      logger.info(`[SERVER] Health check: http://localhost:${env.PORT}/health`);
    });
  } catch (error) {
    logger.error(`[SERVER] Failed to start: ${error}`);
    process.exit(1);
  }
};

bootstrap();

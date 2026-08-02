import "dotenv/config";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { env } from "./config/env.js";
import { logger } from "./common/utils/logger.js";
import { createApp } from "./app.js";
import { redisClient, closeRedisConnection } from "./config/redis.js";
import { connectCloudinary } from "./config/cloudinary.js";
import { AppServer } from "./common/types/socket.types.js";
import { registerSocketServer } from "./socket/index.js";
import { setSocketServer } from "./socket/registry.js";

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
io.adapter(createAdapter(pubClient, subClient, { key: `${env.APP_NAME ?? "app"}:socket.io` }));

setSocketServer(io);
registerSocketServer(io);

const app = createApp(io);
httpServer.on("request", app);

const gracefulShutdown = (signal: string): void => {
  logger.info(`[SERVER] ${signal} received - shutting down gracefully`);

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
    logger.info("[SERVER] Cloudinary connected.");

    httpServer.listen(env.PORT, () => {
      logger.info(`[SERVER] Running in ${env.NODE_ENV} mode`);
      logger.info(`[SERVER] Listening on http://localhost:${env.PORT}`);
      logger.info(`[SERVER] Health check: http://localhost:${env.PORT}/health`);
    });
  } catch (error) {
    logger.error(`[SERVER] Failed to start: ${error}`);
    process.exit(1);
  }
};

bootstrap();

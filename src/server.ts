import "dotenv/config";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import { env } from "./config/env.js";
import { logger } from "./common/utils/logger.js";
import { createApp } from "./app.js";
import { closeRedisConnection } from "./config/redis.js";
import { connectCloudinary } from "./config/cloudinary.js";

const httpServer = createServer();

const io = new SocketServer(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

const app = createApp(io);
httpServer.on("request", app);

io.on("connection", (socket) => {
  logger.info(`[SOCKET] User connected: ${socket.id}`);

  // TODO: Add socket

  socket.on("disconnect", (reason) => {
    logger.info(`[SOCKET] User disconnected: ${socket.id} - reason: ${reason}`);
  });
});

const gracefulShutdown = (signal: string): void => {
  logger.info(`[SERVER] ${signal} received - shutting down gracefully`);

  httpServer.close(async () => {
    logger.info("[SERVER HTTP server closed");

    await closeRedisConnection();

    logger.info("[SERVER All connections closed. Process terminated.");
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

const boostrap = async (): Promise<void> => {
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

boostrap();

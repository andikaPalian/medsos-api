import express, { Request, Response } from "express";
import { Server as SocketServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import { logger } from "./common/utils/logger.js";
import { messageRouter } from "./modules/message/routes/message.routes.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import { userAuthRouter } from "./modules/auth/routes/userAuth.routes.js";
import { userRouter } from "./modules/user/routes/user.routes.js";

const API_PREFIX = "api/v1" as const;

export const createApp = (io: SocketServer) => {
  const app = express();

  app.set("trust proxy", env.NODE_ENV === "production" ? 1 : "loopback");

  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
      crossOriginEmbedderPolicy: env.NODE_ENV === "production",
    }),
  );

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  if (env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
  } else {
    app.use(
      morgan("combined", {
        stream: {
          write: (message) => logger.info(message.trim()),
        },
      }),
    );
  }

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  app.use(globalLimiter);

  app.use(`${API_PREFIX}/auth`, userAuthRouter);
  app.use(`${API_PREFIX}/user`, userRouter);
  app.use(`${API_PREFIX}/message`, messageRouter);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: "The requested resource was not found.",
    });
  });

  app.use(globalErrorHandler);

  return app;
};

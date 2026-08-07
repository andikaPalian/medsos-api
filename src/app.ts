import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { env } from "@core/config/env.config.js";
import { globalErrorHandler } from "@infra/http/middlewares/error.middleware.js";
import { globalLimiter } from "@infra/http/middlewares/rate-limit.middleware.js";
import { xssProtection } from "@infra/http/middlewares/xss.middleware.js";
import { csrfProtection } from "@infra/http/middlewares/csrf.middleware.js";
import { logger } from "@core/utils/logger.js";
import { registerRoutes } from "@infra/http/router.js";
import { swaggerSpec } from "@core/config/swagger.config.js";
import passport from "@core/config/passport.config.js";
import { prisma } from "@core/config/database.config.js";
import { redisClient } from "@core/config/redis.config.js";

export const createApp = (): Express => {
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
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token"],
    }),
  );

  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(xssProtection);
  app.use(csrfProtection);
  app.use(passport.initialize());

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

  // Swagger Documentation Dashboard
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/docs.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Health Check Endpoint
  app.get("/health", async (_req: Request, res: Response) => {
    let dbStatus = "ok";
    let redisStatus = "ok";

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "error";
    }

    try {
      await redisClient.ping();
    } catch {
      redisStatus = "error";
    }

    const isHealthy = dbStatus === "ok" && redisStatus === "ok";

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "ok" : "degraded",
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    });
  });

  app.use(globalLimiter);

  // Register domain modules
  registerRoutes(app);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: "The requested resource was not found.",
    });
  });

  app.use(globalErrorHandler);

  return app;
};

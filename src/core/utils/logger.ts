// ============================================================
// Winston logger with daily file rotation
// ============================================================

import winston from "winston";
import "winston-daily-rotate-file";

interface LogInfo extends winston.Logform.TransformableInfo {
  timestamp?: string;
}

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf((info: LogInfo) => `${info.timestamp} ${info.level}: ${info.message}`),
);

const fileFormat = winston.format.combine(winston.format.timestamp(), winston.format.json());

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: "logs/application-%DATE%.log",
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  level: "info",
  format: fileFormat,
});

const errorRotateTransport = new winston.transports.DailyRotateFile({
  filename: "logs/error-%DATE%.log",
  datePattern: "YYYY-MM-DD-HH",
  maxFiles: "30d",
  level: "error",
  format: fileFormat,
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  transports: [
    fileRotateTransport,
    errorRotateTransport,
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

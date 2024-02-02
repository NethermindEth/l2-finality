import { Request, Response, NextFunction } from "express";
import winston from "winston";

const { createLogger, format, transports } = winston;

const logger: winston.Logger = createLogger({
  level: "info",
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}] [API]: ${message}`;
    }),
  ),
  transports: [new transports.Console()],
});

export function apiLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = new Date();

  res.on("finish", () => {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    logger.info(
      `${req.method} ${req.originalUrl} | ${res.statusCode} | ${duration}ms`,
    );
  });

  next();
}

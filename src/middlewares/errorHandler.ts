import { Request, Response, NextFunction } from "express";
import { logger } from "@/config/logger";
import { createError, type AppError } from "@/utils/appError";

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV === "development") {
    logger.error(`Error: ${message}`, {
      statusCode,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.error(`Error: ${message}`, {
      statusCode,
      path: req.path,
      method: req.method,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};

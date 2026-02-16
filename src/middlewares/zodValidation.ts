import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { createError } from "@/middlewares/errorHandler";

export const validateZod = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((err) => {
          const path = err.path.join(".");
          return path ? `${path}: ${err.message}` : err.message;
        });
        throw createError(errorMessages.join(", "), 400);
      }
      throw createError("Validation error", 400);
    }
  };
};

import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { createError } from "@/utils/appError";

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    throw createError(errorMessages.join(", "), 400);
  }
  next();
};

import { Request, Response, NextFunction } from "express";
import { env } from "@/config/env.config";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";

const minSecretLength = 16;

export const requireWalletInternalSecret = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const secret = env.WALLET_INTERNAL_SECRET;
  if (!secret || secret.length < minSecretLength) {
    next(
      createError(
        "Wallet internal operations are not configured (set WALLET_INTERNAL_SECRET)",
        503
      )
    );
    return;
  }
  const header = req.headers["x-wallet-internal-secret"];
  if (typeof header !== "string" || header !== secret) {
    next(createError("Forbidden", HTTP_STATUS.FORBIDDEN));
    return;
  }
  next();
};

import type { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { sendSuccess } from "@/utils/responseFormatter";
import { createError } from "@/utils/appError";
import type { AuthRequest } from "@/middlewares/auth";
import {
  startVerificationSession,
  getVerificationStatusForUser,
  handleVeriffWebhook,
} from "@/modules/verification/verification.service";

export const startVerificationController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError("Unauthorized", 401);
    }
    const result = await startVerificationSession(req.user.userId);
    sendSuccess(res, { data: result });
  }
);

export const getVerificationStatusController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError("Unauthorized", 401);
    }
    const status = await getVerificationStatusForUser(req.user.userId);
    sendSuccess(res, { data: status });
  }
);

export const veriffWebhookController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    await handleVeriffWebhook(rawBody, req.headers, req.body);
    res.status(200).json({ received: true });
  }
);


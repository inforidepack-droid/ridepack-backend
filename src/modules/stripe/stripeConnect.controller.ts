import type { Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import type { AuthRequest } from "@/middlewares/auth";
import { createError } from "@/utils/appError";
import { sendSuccess } from "@/utils/responseFormatter";
import {
  createConnectOnboardingLink,
  disconnectStripeAccount,
  getStripeAccountStatus,
} from "@/modules/stripe/stripeConnect.service";

export const createConnectAccountController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError("Unauthorized", 401);
    }

    const link = await createConnectOnboardingLink(req.user.userId);

    sendSuccess(res, { data: link });
  }
);

export const getStripeStatusController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError("Unauthorized", 401);
    }

    const status = await getStripeAccountStatus(req.user.userId);

    sendSuccess(res, { data: status });
  }
);

export const disconnectStripeController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError("Unauthorized", 401);
    }

    await disconnectStripeAccount(req.user.userId);

    sendSuccess(res, { data: { disconnected: true } });
  }
);


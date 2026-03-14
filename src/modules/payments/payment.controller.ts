import type { Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import type { AuthRequest } from "@/middlewares/auth";
import { createError } from "@/utils/appError";
import { sendCreated, sendSuccess } from "@/utils/responseFormatter";
import {
  createSetupIntentForUser,
  deletePaymentMethodForUser,
  listPaymentMethodsForUser,
  savePaymentMethodForUser,
} from "@/modules/payments/payment.service";

export const createSetupIntentController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError("Unauthorized", 401);
    }

    const result = await createSetupIntentForUser(req.user.userId);

    sendSuccess(res, { data: result });
  }
);

export const savePaymentMethodController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError("Unauthorized", 401);
    }

    const { paymentMethodId } = req.body as { paymentMethodId?: string };

    if (!paymentMethodId) {
      throw createError("paymentMethodId is required", 400);
    }

    const paymentMethod = await savePaymentMethodForUser(
      req.user.userId,
      paymentMethodId
    );

    sendCreated(res, { data: { paymentMethod } });
  }
);

export const listPaymentMethodsController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError("Unauthorized", 401);
    }

    const paymentMethods = await listPaymentMethodsForUser(req.user.userId);

    sendSuccess(res, { data: { paymentMethods } });
  }
);

export const deletePaymentMethodController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw createError("Unauthorized", 401);
    }

    const paymentMethodDbId = req.params.id;

    await deletePaymentMethodForUser(req.user.userId, paymentMethodDbId);

    sendSuccess(res, { data: { deleted: true } });
  }
);


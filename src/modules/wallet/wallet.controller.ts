import { Request, Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import { sendSuccess, sendCreated } from "@/utils/responseFormatter";
import type { AuthRequest } from "@/middlewares/auth";
import { listWalletTransactionsQuerySchema } from "@/modules/wallet/wallet.validation";
import type { CreditWalletBody, WithdrawWalletBody } from "@/modules/wallet/wallet.types";
import {
  creditWalletForDelivery,
  getWalletSummary,
  getWalletTransactionById,
  listWalletTransactions,
  withdrawFromWallet,
} from "@/modules/wallet/wallet.service";

export const getWalletSummaryController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const wallet = await getWalletSummary(req.user.userId);
    sendSuccess(res, { data: { wallet } });
  }
);

export const listWalletTransactionsController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const parsed = listWalletTransactionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(", ");
      throw createError(msg, HTTP_STATUS.BAD_REQUEST);
    }
    const result = await listWalletTransactions(req.user.userId, parsed.data);
    sendSuccess(res, { data: result });
  }
);

export const getWalletTransactionByIdController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const transaction = await getWalletTransactionById(req.user.userId, req.params.id as string);
    sendSuccess(res, { data: { transaction } });
  }
);

export const creditWalletController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreditWalletBody;
    const result = await creditWalletForDelivery(body);
    sendCreated(res, { data: result });
  }
);

export const withdrawWalletController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const transaction = await withdrawFromWallet(req.user.userId, req.body as WithdrawWalletBody);
    sendCreated(res, { data: { transaction } });
  }
);

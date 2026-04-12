import { z } from "zod";
import mongoose from "mongoose";

const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
import {
  WALLET_MIN_WITHDRAW_USD,
  WALLET_TX_LIST_DEFAULT_LIMIT,
  WALLET_TX_LIST_MAX_LIMIT,
  WALLET_TX_TYPE,
} from "@/modules/wallet/wallet.constants";

const positiveMoney = z.coerce
  .number()
  .finite("Amount must be a valid number")
  .positive("Amount must be positive")
  .refine((n) => Math.round(n * 100) === n * 100, {
    message: "Amount must have at most 2 decimal places",
  });

export const creditWalletBodySchema = z.object({
  riderId: z
    .string()
    .min(1)
    .refine((id) => isValidObjectId(id), { message: "Invalid riderId format" }),
  bookingId: z
    .string()
    .min(1)
    .refine((id) => isValidObjectId(id), { message: "Invalid bookingId format" }),
  amount: positiveMoney,
});

export const withdrawWalletBodySchema = z.object({
  amount: positiveMoney.refine((n) => n >= WALLET_MIN_WITHDRAW_USD, {
    message: `Minimum withdrawal is $${WALLET_MIN_WITHDRAW_USD}`,
  }),
});

export const listWalletTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(WALLET_TX_LIST_MAX_LIMIT)
    .default(WALLET_TX_LIST_DEFAULT_LIMIT),
  type: z.enum([WALLET_TX_TYPE.CREDIT, WALLET_TX_TYPE.DEBIT]).optional(),
});

export type ListWalletTransactionsQuery = z.infer<typeof listWalletTransactionsQuerySchema>;

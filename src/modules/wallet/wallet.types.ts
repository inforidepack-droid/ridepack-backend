import type mongoose from "mongoose";
import type { WalletTxSource, WalletTxStatus, WalletTxType } from "@/modules/wallet/wallet.constants";

export type WalletLean = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  balance: number;
  totalEarnings: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

export type WalletTransactionLean = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: WalletTxType;
  amount: number;
  status: WalletTxStatus;
  source: WalletTxSource;
  bookingId?: mongoose.Types.ObjectId;
  stripeTransferId?: string;
  description?: string;
  createdAt: Date;
};

export type CreditWalletBody = {
  riderId: string;
  bookingId: string;
  amount: number;
};

export type WithdrawWalletBody = {
  amount: number;
};

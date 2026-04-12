import mongoose, { type ClientSession } from "mongoose";
import WalletTransaction from "@/modules/wallet/walletTransaction.model";
import type { WalletTransactionLean } from "@/modules/wallet/wallet.types";
import {
  WALLET_TX_SOURCE,
  type WalletTxSource,
  type WalletTxStatus,
  type WalletTxType,
} from "@/modules/wallet/wallet.constants";

export const createWalletTransaction = async (
  doc: {
    userId: mongoose.Types.ObjectId;
    type: WalletTxType;
    amount: number;
    status: WalletTxStatus;
    source: WalletTxSource;
    bookingId?: mongoose.Types.ObjectId;
    stripeTransferId?: string;
    description?: string;
  },
  session?: ClientSession | null
): Promise<WalletTransactionLean> => {
  const rows = await WalletTransaction.create([doc], session ? { session } : {});
  return rows[0].toObject() as WalletTransactionLean;
};

export const findDeliveryCreditByUserAndBooking = (
  userId: string,
  bookingId: string
): Promise<WalletTransactionLean | null> =>
  WalletTransaction.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    bookingId: new mongoose.Types.ObjectId(bookingId),
    source: WALLET_TX_SOURCE.DELIVERY,
  })
    .lean()
    .exec() as Promise<WalletTransactionLean | null>;

export const findById = (id: string): Promise<WalletTransactionLean | null> =>
  WalletTransaction.findById(id).lean().exec() as Promise<WalletTransactionLean | null>;

export const findByIdForUser = (
  id: string,
  userId: string
): Promise<WalletTransactionLean | null> =>
  WalletTransaction.findOne({
    _id: id,
    userId: new mongoose.Types.ObjectId(userId),
  })
    .lean()
    .exec() as Promise<WalletTransactionLean | null>;

export const findByUserPaginated = (
  userId: string,
  filter: { type?: WalletTxType },
  skip: number,
  limit: number
): Promise<WalletTransactionLean[]> => {
  const q: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
  if (filter.type) q.type = filter.type;
  return WalletTransaction.find(q)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
    .exec() as Promise<WalletTransactionLean[]>;
};

export const countByUser = (
  userId: string,
  filter: { type?: WalletTxType }
): Promise<number> => {
  const q: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };
  if (filter.type) q.type = filter.type;
  return WalletTransaction.countDocuments(q).exec();
};

export const updateStatusById = (
  id: string,
  patch: { status: WalletTxStatus; stripeTransferId?: string },
  session?: ClientSession | null
): Promise<WalletTransactionLean | null> => {
  const q = WalletTransaction.findByIdAndUpdate(id, { $set: patch }, {
    new: true,
    ...(session ? { session } : {}),
  });
  return q.lean().exec() as Promise<WalletTransactionLean | null>;
};

import mongoose, { type ClientSession } from "mongoose";
import Wallet from "@/modules/wallet/wallet.model";
import { env } from "@/config/env.config";
import { WALLET_DEFAULT_CURRENCY } from "@/modules/wallet/wallet.constants";
import type { WalletLean } from "@/modules/wallet/wallet.types";

const defaultCurrency = (): string =>
  (env.STRIPE_CURRENCY || WALLET_DEFAULT_CURRENCY).toLowerCase();

export const findWalletByUserId = (userId: string): Promise<WalletLean | null> =>
  Wallet.findOne({ userId: new mongoose.Types.ObjectId(userId) })
    .lean()
    .exec() as Promise<WalletLean | null>;

export const getOrCreateWallet = async (
  userId: string,
  session?: ClientSession | null
): Promise<WalletLean> => {
  const oid = new mongoose.Types.ObjectId(userId);
  const cur = defaultCurrency();
  const opts = session ? { session, new: true, upsert: true } : { new: true, upsert: true };
  const doc = await Wallet.findOneAndUpdate(
    { userId: oid },
    {
      $setOnInsert: {
        userId: oid,
        balance: 0,
        totalEarnings: 0,
        currency: cur,
      },
    },
    opts
  )
    .lean()
    .exec();

  if (doc) return doc as WalletLean;

  const created = await Wallet.create(
    [{ userId: oid, balance: 0, totalEarnings: 0, currency: cur }],
    session ? { session } : {}
  );
  return created[0].toObject() as WalletLean;
};

export const incrementBalanceAndEarnings = (
  userId: string,
  amount: number,
  session: ClientSession
): Promise<WalletLean | null> =>
  Wallet.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    { $inc: { balance: amount, totalEarnings: amount } },
    { new: true, session }
  )
    .lean()
    .exec() as Promise<WalletLean | null>;

export const atomicDecrementBalanceIfSufficient = (
  userId: string,
  amount: number,
  session: ClientSession
): Promise<WalletLean | null> =>
  Wallet.findOneAndUpdate(
    {
      userId: new mongoose.Types.ObjectId(userId),
      balance: { $gte: amount },
    },
    { $inc: { balance: -amount } },
    { new: true, session }
  )
    .lean()
    .exec() as Promise<WalletLean | null>;

export const incrementBalanceOnly = (
  userId: string,
  amount: number,
  session: ClientSession
): Promise<WalletLean | null> =>
  Wallet.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId) },
    { $inc: { balance: amount } },
    { new: true, session }
  )
    .lean()
    .exec() as Promise<WalletLean | null>;


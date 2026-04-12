import mongoose from "mongoose";
import { MongoServerError } from "mongodb";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import { BOOKING_STATUS } from "@/modules/booking/booking.constants";
import * as bookingRepo from "@/modules/booking/booking.repository";
import * as walletRepo from "@/modules/wallet/wallet.repository";
import * as txRepo from "@/modules/wallet/walletTransaction.repository";
import {
  WALLET_TX_SOURCE,
  WALLET_TX_STATUS,
  WALLET_TX_TYPE,
} from "@/modules/wallet/wallet.constants";
import type { CreditWalletBody, WithdrawWalletBody } from "@/modules/wallet/wallet.types";
import type { ListWalletTransactionsQuery } from "@/modules/wallet/wallet.validation";
import { getStripeAccountStatus } from "@/modules/stripe/stripeConnect.service";
import User from "@/modules/auth/models/User.model";
import { transferToConnectedAccount } from "@/modules/wallet/wallet.stripe.transfer";

const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;

const duplicateCreditMessage = "Wallet credit for this booking already exists";

const mapTransaction = (t: {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: string;
  amount: number;
  status: string;
  source: string;
  bookingId?: mongoose.Types.ObjectId;
  stripeTransferId?: string;
  description?: string;
  createdAt: Date;
}) => ({
  id: t._id.toString(),
  userId: t.userId.toString(),
  type: t.type,
  amount: t.amount,
  status: t.status,
  source: t.source,
  ...(t.bookingId ? { bookingId: t.bookingId.toString() } : {}),
  ...(t.stripeTransferId ? { stripeTransferId: t.stripeTransferId } : {}),
  ...(t.description ? { description: t.description } : {}),
  createdAt: t.createdAt,
});

export const getWalletSummary = async (userId: string) => {
  const wallet = await walletRepo.getOrCreateWallet(userId);
  return {
    balance: wallet.balance,
    totalEarnings: wallet.totalEarnings,
    currency: wallet.currency,
  };
};

export const listWalletTransactions = async (userId: string, query: ListWalletTransactionsQuery) => {
  const skip = (query.page - 1) * query.limit;
  const filter = { ...(query.type ? { type: query.type } : {}) };
  const [items, total] = await Promise.all([
    txRepo.findByUserPaginated(userId, filter, skip, query.limit),
    txRepo.countByUser(userId, filter),
  ]);
  return { transactions: items.map(mapTransaction), page: query.page, limit: query.limit, total };
};

export const getWalletTransactionById = async (userId: string, txId: string) => {
  if (!isValidObjectId(txId)) {
    throw createError("Invalid transaction id format", HTTP_STATUS.BAD_REQUEST);
  }
  const tx = await txRepo.findByIdForUser(txId, userId);
  if (!tx) throw createError("Transaction not found", HTTP_STATUS.NOT_FOUND);
  return mapTransaction(tx);
};

export const creditWalletForDelivery = async (body: CreditWalletBody) => {
  const existing = await txRepo.findDeliveryCreditByUserAndBooking(body.riderId, body.bookingId);
  if (existing) throw createError(duplicateCreditMessage, HTTP_STATUS.BAD_REQUEST);

  const booking = await bookingRepo.findByIdWithTripRider(body.bookingId);
  if (!booking) throw createError("Booking not found", HTTP_STATUS.NOT_FOUND);
  if (booking.status !== BOOKING_STATUS.DELIVERED) {
    throw createError("Booking must be delivered before crediting the wallet", HTTP_STATUS.BAD_REQUEST);
  }
  const trip = booking.tripId;
  if (!trip?.riderId || trip.riderId.toString() !== body.riderId) {
    throw createError("Rider does not match this booking", HTTP_STATUS.FORBIDDEN);
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await walletRepo.getOrCreateWallet(body.riderId, session);
      await txRepo.createWalletTransaction(
        {
          userId: new mongoose.Types.ObjectId(body.riderId),
          type: WALLET_TX_TYPE.CREDIT,
          amount: body.amount,
          status: WALLET_TX_STATUS.COMPLETED,
          source: WALLET_TX_SOURCE.DELIVERY,
          bookingId: new mongoose.Types.ObjectId(body.bookingId),
          description: `Delivery earnings (booking ${body.bookingId})`,
        },
        session
      );
      await walletRepo.incrementBalanceAndEarnings(body.riderId, body.amount, session);
    });
    const wallet = await getWalletSummary(body.riderId);
    const txRow = await txRepo.findDeliveryCreditByUserAndBooking(body.riderId, body.bookingId);
    return { wallet, transaction: txRow ? mapTransaction(txRow) : null };
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) {
      throw createError(duplicateCreditMessage, HTTP_STATUS.BAD_REQUEST);
    }
    throw e;
  } finally {
    await session.endSession();
  }
};

export const withdrawFromWallet = async (userId: string, body: WithdrawWalletBody) => {
  const amount = body.amount;
  const user = await User.findById(userId).select("stripeAccountId isBlocked").lean().exec();
  if (!user) throw createError("User not found", HTTP_STATUS.NOT_FOUND);
  if ((user as { isBlocked?: boolean }).isBlocked) {
    throw createError("Account is blocked", HTTP_STATUS.FORBIDDEN);
  }
  const stripeAccountId = (user as { stripeAccountId?: string }).stripeAccountId;
  if (!stripeAccountId) {
    throw createError("Connect a Stripe account to withdraw funds", HTTP_STATUS.BAD_REQUEST);
  }
  const stripeStatus = await getStripeAccountStatus(userId);
  if (!stripeStatus.payoutsEnabled) {
    throw createError("Stripe payouts are not enabled for this account", HTTP_STATUS.BAD_REQUEST);
  }

  const session = await mongoose.startSession();
  let pendingTxId: string | null = null;
  try {
    await session.withTransaction(async () => {
      const updated = await walletRepo.atomicDecrementBalanceIfSufficient(userId, amount, session);
      if (!updated) {
        throw createError("Insufficient wallet balance", HTTP_STATUS.BAD_REQUEST);
      }
      const tx = await txRepo.createWalletTransaction(
        {
          userId: new mongoose.Types.ObjectId(userId),
          type: WALLET_TX_TYPE.DEBIT,
          amount,
          status: WALLET_TX_STATUS.PENDING,
          source: WALLET_TX_SOURCE.WITHDRAWAL,
          description: "Withdrawal to Stripe Connect account",
        },
        session
      );
      pendingTxId = tx._id.toString();
    });
  } finally {
    await session.endSession();
  }

  if (!pendingTxId) {
    throw createError("Withdrawal could not be started", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  const withdrawalTxId = pendingTxId;

  try {
    const { transferId } = await transferToConnectedAccount({
      destinationAccountId: stripeAccountId,
      amountDollars: amount,
      metadata: {
        userId,
        walletTransactionId: withdrawalTxId,
      },
    });
    const completed = await txRepo.updateStatusById(withdrawalTxId, {
      status: WALLET_TX_STATUS.COMPLETED,
      stripeTransferId: transferId,
    });
    if (!completed) {
      throw createError("Failed to finalize withdrawal record", HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    return mapTransaction(completed);
  } catch (stripeErr) {
    const rollback = await mongoose.startSession();
    try {
      await rollback.withTransaction(async () => {
        await walletRepo.incrementBalanceOnly(userId, amount, rollback);
        await txRepo.updateStatusById(
          withdrawalTxId,
          { status: WALLET_TX_STATUS.FAILED },
          rollback
        );
      });
    } finally {
      await rollback.endSession();
    }
    throw stripeErr;
  }
};

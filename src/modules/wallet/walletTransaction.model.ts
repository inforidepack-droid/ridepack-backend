import mongoose, { Schema, Document, Model } from "mongoose";
import {
  WALLET_TX_SOURCE,
  WALLET_TX_STATUS,
  WALLET_TX_TYPE,
} from "@/modules/wallet/wallet.constants";
import type { WalletTxSource, WalletTxStatus, WalletTxType } from "@/modules/wallet/wallet.constants";

export interface IWalletTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: WalletTxType;
  amount: number;
  status: WalletTxStatus;
  source: WalletTxSource;
  bookingId?: mongoose.Types.ObjectId;
  stripeTransferId?: string;
  description?: string;
  createdAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: Object.values(WALLET_TX_TYPE), required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(WALLET_TX_STATUS),
      required: true,
      default: WALLET_TX_STATUS.PENDING,
    },
    source: { type: String, enum: Object.values(WALLET_TX_SOURCE), required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    stripeTransferId: { type: String, trim: true },
    description: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index(
  { userId: 1, bookingId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      source: WALLET_TX_SOURCE.DELIVERY,
      bookingId: { $exists: true, $ne: null },
    },
  }
);

const WalletTransaction: Model<IWalletTransaction> =
  mongoose.models.WalletTransaction ||
  mongoose.model<IWalletTransaction>("WalletTransaction", walletTransactionSchema);
export default WalletTransaction;

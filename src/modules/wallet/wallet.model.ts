import mongoose, { Schema, Document, Model } from "mongoose";
import { WALLET_DEFAULT_CURRENCY } from "@/modules/wallet/wallet.constants";

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  balance: number;
  totalEarnings: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: { type: Number, required: true, default: 0, min: 0 },
    totalEarnings: { type: Number, required: true, default: 0, min: 0 },
    currency: {
      type: String,
      required: true,
      default: WALLET_DEFAULT_CURRENCY,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

walletSchema.index({ userId: 1 });

const Wallet: Model<IWallet> =
  mongoose.models.Wallet || mongoose.model<IWallet>("Wallet", walletSchema);
export default Wallet;

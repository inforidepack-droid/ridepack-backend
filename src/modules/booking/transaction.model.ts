import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  bookingId: mongoose.Types.ObjectId;
  amount: number;
  status: string;
  paymentIntentId?: string;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: "completed" },
    paymentIntentId: { type: String },
  },
  { timestamps: true }
);

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", transactionSchema);
export default Transaction;

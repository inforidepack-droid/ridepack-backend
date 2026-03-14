import mongoose, { Schema, type Model } from "mongoose";
import type { IPaymentMethod } from "@/modules/payments/payment.types";

const paymentMethodSchema = new Schema<IPaymentMethod>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stripePaymentMethodId: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    last4: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentMethodSchema.index(
  { userId: 1, stripePaymentMethodId: 1 },
  { unique: true }
);

const PaymentMethod: Model<IPaymentMethod> =
  mongoose.models.PaymentMethod ||
  mongoose.model<IPaymentMethod>("PaymentMethod", paymentMethodSchema);

export default PaymentMethod;


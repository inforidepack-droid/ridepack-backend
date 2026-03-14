import type { Document, Types } from "mongoose";

export interface IPaymentMethod extends Document {
  userId: Types.ObjectId;
  stripePaymentMethodId: string;
  brand: string;
  last4: string;
  createdAt: Date;
  updatedAt: Date;
}


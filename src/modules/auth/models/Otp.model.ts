import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOtp extends Document {
  phoneNumber: string;
  countryCode: string;
  hashedOtp: string;
  expiresAt: Date;
  attemptCount: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    countryCode: {
      type: String,
      required: true,
      trim: true,
    },
    hashedOtp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for phone lookup
otpSchema.index({ phoneNumber: 1, countryCode: 1 });

// Create model
const Otp: Model<IOtp> = mongoose.model<IOtp>("Otp", otpSchema);

export default Otp;

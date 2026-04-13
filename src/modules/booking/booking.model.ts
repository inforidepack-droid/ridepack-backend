import mongoose, { Schema, Document, Model } from "mongoose";
import type { IParcel, IContactDetails } from "@/modules/booking/booking.types";
import { BOOKING_STATUS } from "@/modules/booking/booking.constants";

export interface IOtpVerification {
  pickupVerified: boolean;
  deliveryVerified: boolean;
}

export interface IOtpAttempts {
  pickup: number;
  delivery: number;
}

export interface IBooking extends Document {
  tripId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  parcel: IParcel;
  senderDetails: IContactDetails;
  receiverDetails: IContactDetails;
  packageImages: string[];
  agreedPrice: number;
  illegalItemsDeclaration: boolean;
  status: string;
  paymentTransactionId?: string;
  escrowAmount?: number;
  /** Per-booking delivery OTP; never exposed in API JSON (`select: false`). */
  deliveryOtp?: string;
  otpVerification: IOtpVerification;
  otpAttempts: IOtpAttempts;
  createdAt: Date;
  updatedAt: Date;
}

const parcelSchema = new Schema<IParcel>(
  {
    weight: { type: Number, required: true },
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    description: { type: String },
  },
  { _id: false }
);

const contactSchema = new Schema<IContactDetails>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    countryCode: { type: String, required: false, trim: true },
  },
  { _id: false }
);

const otpVerificationSchema = new Schema<IOtpVerification>(
  {
    pickupVerified: { type: Boolean, default: false },
    deliveryVerified: { type: Boolean, default: false },
  },
  { _id: false }
);

const otpAttemptsSchema = new Schema<IOtpAttempts>(
  {
    pickup: { type: Number, default: 0, min: 0 },
    delivery: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const bookingSchema = new Schema<IBooking>(
  {
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parcel: { type: parcelSchema, required: true },
    senderDetails: { type: contactSchema, required: true },
    receiverDetails: { type: contactSchema, required: true },
    packageImages: [{ type: String, required: true }],
    agreedPrice: { type: Number, required: true },
    illegalItemsDeclaration: { type: Boolean, required: true },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING_PAYMENT,
    },
    paymentTransactionId: { type: String },
    escrowAmount: { type: Number },
    deliveryOtp: { type: String, select: false, trim: true },
    otpVerification: {
      type: otpVerificationSchema,
      default: () => ({ pickupVerified: false, deliveryVerified: false }),
    },
    otpAttempts: {
      type: otpAttemptsSchema,
      default: () => ({ pickup: 0, delivery: 0 }),
    },
  },
  { timestamps: true }
);

bookingSchema.index({ tripId: 1, status: 1 });
bookingSchema.index({ senderId: 1 });
bookingSchema.index({ senderId: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", bookingSchema);
export default Booking;

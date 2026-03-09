import mongoose, { Schema, Document, Model } from "mongoose";
import type { IParcel, IContactDetails } from "@/modules/booking/booking.types";
import { BOOKING_STATUS } from "@/modules/booking/booking.constants";

export interface IBooking extends Document {
  tripId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  parcel: IParcel;
  senderDetails: IContactDetails;
  receiverDetails: IContactDetails;
  packageImages: string[];
  governmentIdImage: string;
  agreedPrice: number;
  illegalItemsDeclaration: boolean;
  status: string;
  paymentTransactionId?: string;
  escrowAmount?: number;
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
    governmentIdImage: { type: String, required: true },
    agreedPrice: { type: Number, required: true },
    illegalItemsDeclaration: { type: Boolean, required: true },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING_PAYMENT,
    },
    paymentTransactionId: { type: String },
    escrowAmount: { type: Number },
  },
  { timestamps: true }
);

bookingSchema.index({ tripId: 1, status: 1 });
bookingSchema.index({ senderId: 1 });

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", bookingSchema);
export default Booking;

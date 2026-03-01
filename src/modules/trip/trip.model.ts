import mongoose, { Schema, Document, Model } from "mongoose";
import type { ILocation, ICapacity, ICompliance } from "@/modules/trip/trip.types";
import { TRIP_STATUS } from "@/modules/trip/trip.constants";

export interface ITrip extends Document {
  riderId: mongoose.Types.ObjectId;
  status: string;
  fromLocation?: ILocation;
  toLocation?: ILocation;
  travelDate?: Date;
  departureTime?: string;
  arrivalTime?: string;
  capacity?: ICapacity;
  remainingCapacity?: ICapacity;
  price?: number;
  vehicleType?: string;
  legalItemConfirmed?: boolean;
  fitsLuggageConfirmed?: boolean;
  willNotOpenConfirmed?: boolean;
  willMeetReceiverConfirmed?: boolean;
  isLocked: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String },
  },
  { _id: false }
);

const capacitySchema = new Schema<ICapacity>(
  {
    maxWeight: { type: Number, required: true },
    maxLength: { type: Number, required: true },
    maxWidth: { type: Number, required: true },
    maxHeight: { type: Number, required: true },
  },
  { _id: false }
);

const tripSchema = new Schema<ITrip>(
  {
    riderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(TRIP_STATUS),
      default: TRIP_STATUS.DRAFT,
    },
    fromLocation: { type: locationSchema },
    toLocation: { type: locationSchema },
    travelDate: { type: Date },
    departureTime: { type: String },
    arrivalTime: { type: String },
    capacity: { type: capacitySchema },
    remainingCapacity: { type: capacitySchema },
    price: { type: Number },
    vehicleType: { type: String, trim: true },
    legalItemConfirmed: { type: Boolean, default: false },
    fitsLuggageConfirmed: { type: Boolean, default: false },
    willNotOpenConfirmed: { type: Boolean, default: false },
    willMeetReceiverConfirmed: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

tripSchema.index({ riderId: 1, status: 1 });

const Trip: Model<ITrip> =
  mongoose.models.Trip || mongoose.model<ITrip>("Trip", tripSchema);
export default Trip;

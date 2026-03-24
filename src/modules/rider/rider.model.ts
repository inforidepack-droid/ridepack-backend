import mongoose, { Schema, Document, Model } from "mongoose";
import type { IVehicleDetails } from "@/modules/rider/rider.types";
import { VEHICLE_TYPE } from "@/modules/rider/rider.constants";

export interface IRider extends Document {
  userId: mongoose.Types.ObjectId;
  isKycVerified: boolean;
  vehicleType: string;
  vehicleDetails?: IVehicleDetails;
  rating: number;
  totalTrips: number;
  totalDeliveries: number;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleDetailsSchema = new Schema<IVehicleDetails>(
  {
    model: { type: String, trim: true },
    color: { type: String, trim: true },
    plateNumber: { type: String, trim: true },
  },
  { _id: false }
);

const riderSchema = new Schema<IRider>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    isKycVerified: { type: Boolean, default: false },
    vehicleType: {
      type: String,
      enum: Object.values(VEHICLE_TYPE),
      required: true,
    },
    vehicleDetails: { type: vehicleDetailsSchema },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    totalTrips: { type: Number, default: 0, min: 0 },
    totalDeliveries: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const Rider: Model<IRider> =
  mongoose.models.Rider || mongoose.model<IRider>("Rider", riderSchema);
export default Rider;

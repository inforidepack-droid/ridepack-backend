import mongoose, { Schema, type Model } from "mongoose";
import type { IVehicle } from "@/modules/vehicle/vehicle.types";
import { VEHICLE_CATEGORIES } from "@/modules/vehicle/vehicle.constants";

const vehicleSchema = new Schema<IVehicle>(
  {
    riderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: VEHICLE_CATEGORIES,
      required: true,
    },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Vehicle: Model<IVehicle> =
  mongoose.models.Vehicle || mongoose.model<IVehicle>("Vehicle", vehicleSchema);

export default Vehicle;


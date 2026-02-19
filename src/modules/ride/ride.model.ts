import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRide extends Document {
  userId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  status: string;
  pickup: { lat: number; lng: number; address?: string };
  dropoff: { lat: number; lng: number; address?: string };
  createdAt: Date;
  updatedAt: Date;
}

const rideSchema = new Schema<IRide>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    driverId: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, default: "pending" },
    pickup: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: String,
    },
    dropoff: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: String,
    },
  },
  { timestamps: true }
);

const Ride: Model<IRide> = mongoose.models.Ride || mongoose.model<IRide>("Ride", rideSchema);
export default Ride;

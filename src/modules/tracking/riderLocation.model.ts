import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRiderLocation extends Document {
  riderId: mongoose.Types.ObjectId;
  lat: number;
  lng: number;
  updatedAt: Date;
}

const riderLocationSchema = new Schema<IRiderLocation>(
  {
    riderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { timestamps: true }
);

riderLocationSchema.index({ riderId: 1 }, { unique: true });

const RiderLocation: Model<IRiderLocation> =
  mongoose.models.RiderLocation ||
  mongoose.model<IRiderLocation>("RiderLocation", riderLocationSchema);

export default RiderLocation;

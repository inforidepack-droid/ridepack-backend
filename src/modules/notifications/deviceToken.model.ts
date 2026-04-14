import mongoose, { Schema, Document, Model } from "mongoose";

export type DeviceType = "android" | "ios" | "web";

export interface IDeviceToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  deviceType: DeviceType;
  createdAt: Date;
  updatedAt: Date;
}

const deviceTokenSchema = new Schema<IDeviceToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, trim: true },
    deviceType: {
      type: String,
      enum: ["android", "ios", "web"],
      required: true,
    },
  },
  { timestamps: true }
);

deviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });
deviceTokenSchema.index({ userId: 1, createdAt: -1 });

const DeviceToken: Model<IDeviceToken> =
  mongoose.models.DeviceToken ||
  mongoose.model<IDeviceToken>("DeviceToken", deviceTokenSchema);

export default DeviceToken;

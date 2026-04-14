import mongoose from "mongoose";
import DeviceToken from "@/modules/notifications/deviceToken.model";
import type { DeviceType } from "@/modules/notifications/deviceToken.model";

export const upsertDeviceToken = async (
  userId: string,
  token: string,
  deviceType: DeviceType
): Promise<void> => {
  const t = token.trim();
  if (!t) return;
  await DeviceToken.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(userId), token: t },
    { $set: { deviceType } },
    { upsert: true, new: true }
  ).exec();
};

export const removeDeviceToken = async (userId: string, token: string): Promise<void> => {
  await DeviceToken.deleteOne({
    userId: new mongoose.Types.ObjectId(userId),
    token: token.trim(),
  }).exec();
};

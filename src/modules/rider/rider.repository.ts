import mongoose from "mongoose";
import Rider, { IRider } from "@/modules/rider/rider.model";

export type RiderLean = Omit<IRider, keyof mongoose.Document> & {
  _id: mongoose.Types.ObjectId;
};

export const findByUserId = (userId: string): Promise<RiderLean | null> =>
  Rider.findOne({ userId: new mongoose.Types.ObjectId(userId) })
    .lean()
    .exec() as Promise<RiderLean | null>;

export const findById = (id: string): Promise<RiderLean | null> =>
  Rider.findById(id).lean().exec() as Promise<RiderLean | null>;

export const findByIdWithUser = (id: string): Promise<(RiderLean & { userId: { _id: mongoose.Types.ObjectId; name?: string; email?: string; phoneNumber?: string; isBlocked?: boolean } }) | null> =>
  Rider.findById(id)
    .populate("userId", "name email phoneNumber isBlocked role")
    .lean()
    .exec() as Promise<(RiderLean & { userId: { _id: mongoose.Types.ObjectId; name?: string; email?: string; phoneNumber?: string; isBlocked?: boolean } }) | null>;

export const create = (data: {
  userId: string;
  vehicleType: string;
  vehicleDetails?: { model?: string; color?: string; plateNumber?: string };
}): Promise<RiderLean> =>
  Rider.create({
    ...data,
    userId: new mongoose.Types.ObjectId(data.userId),
  }).then((doc) => doc.toObject() as RiderLean);

export const updateById = (
  id: string,
  data: Partial<{
    vehicleType: string;
    vehicleDetails: { model?: string; color?: string; plateNumber?: string };
  }>
): Promise<RiderLean | null> =>
  Rider.findByIdAndUpdate(id, data, { new: true })
    .lean()
    .exec() as Promise<RiderLean | null>;

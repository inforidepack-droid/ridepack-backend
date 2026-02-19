import Ride, { IRide } from "@/modules/ride/ride.model";

export const create = (data: Partial<IRide>) => Ride.create(data);

export const findById = (id: string) => Ride.findById(id).populate("userId").lean().exec();

export const findByUserId = (userId: string) =>
  Ride.find({ userId }).sort({ createdAt: -1 }).lean().exec();

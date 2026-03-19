import mongoose from "mongoose";
import { createError } from "@/utils/appError";
import * as rideRepository from "@/modules/ride/ride.repository";
import Ride from "@/modules/ride/ride.model";
import { HTTP_STATUS } from "@/constants/http.constants";

export const createRide = async (
  userId: string,
  data: { pickup: { lat: number; lng: number; address?: string }; dropoff: { lat: number; lng: number; address?: string } }
) =>
  rideRepository.create({
    userId: new mongoose.Types.ObjectId(userId),
    ...data,
  });

export const getById = async (id: string) => {
  const ride = await rideRepository.findById(id);
  if (!ride) throw createError("Ride not found", HTTP_STATUS.NOT_FOUND);
  return ride;
};

export const getByUserId = (userId: string) => rideRepository.findByUserId(userId);

export const cancelRide = async (userId: string, rideId: string) => {
  const userObjectId =
    mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;

  if (!userObjectId) {
    throw createError("Invalid user id", HTTP_STATUS.BAD_REQUEST);
  }

  if (!mongoose.Types.ObjectId.isValid(rideId)) {
    throw createError("Invalid ride id", HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await Ride.findOneAndUpdate(
    { _id: rideId, userId: userObjectId, status: "pending" },
    { $set: { status: "cancelled" } },
    { new: true }
  )
    .lean()
    .exec();

  if (updated) return updated;

  const ride = await Ride.findById(rideId).lean().exec();
  if (!ride) {
    throw createError("Ride not found", HTTP_STATUS.NOT_FOUND);
  }
  if (ride.userId.toString() !== userId) {
    throw createError("You are not allowed to cancel this ride", HTTP_STATUS.FORBIDDEN);
  }
  throw createError("Ride cannot be cancelled in its current status", HTTP_STATUS.BAD_REQUEST);
};

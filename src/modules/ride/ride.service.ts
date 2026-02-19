import mongoose from "mongoose";
import { createError } from "@/utils/appError";
import * as rideRepository from "@/modules/ride/ride.repository";
import { HTTP_STATUS } from "@/constants/http.constants";

export const createRide = async (userId: string, data: { pickup: { lat: number; lng: number; address?: string }; dropoff: { lat: number; lng: number; address?: string } }) => {
  return rideRepository.create({
    userId: new mongoose.Types.ObjectId(userId),
    ...data,
  });
};

export const getById = async (id: string) => {
  const ride = await rideRepository.findById(id);
  if (!ride) throw createError("Ride not found", HTTP_STATUS.NOT_FOUND);
  return ride;
};

export const getByUserId = (userId: string) => rideRepository.findByUserId(userId);

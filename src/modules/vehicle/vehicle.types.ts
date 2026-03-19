import type mongoose from "mongoose";
import type { VehicleCategory } from "@/modules/vehicle/vehicle.constants";

export interface IVehicle {
  riderId: mongoose.Types.ObjectId;
  category: VehicleCategory;
  brand: string;
  model: string;
  color: string;
  registrationNumber: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateVehicleInput = {
  category: VehicleCategory;
  brand: string;
  model: string;
  color: string;
  registrationNumber: string;
  confirmation: true;
};

export type UpdateVehicleInput = {
  category?: VehicleCategory;
  brand?: string;
  model?: string;
  color?: string;
};

export type VehicleLean = IVehicle & { _id: mongoose.Types.ObjectId };


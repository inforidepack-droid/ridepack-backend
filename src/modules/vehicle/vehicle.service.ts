import mongoose from "mongoose";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import Vehicle from "@/modules/vehicle/vehicle.model";
import type { CreateVehicleInput, UpdateVehicleInput, VehicleLean } from "@/modules/vehicle/vehicle.types";
import { DEFAULT_MAX_VEHICLES_PER_RIDER, REGISTRATION_NUMBER_PATTERN, VEHICLE_CATEGORIES } from "@/modules/vehicle/vehicle.constants";

const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;

const getMaxVehiclesPerRider = (): number => {
  const raw = process.env.MAX_VEHICLES_PER_RIDER;
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_MAX_VEHICLES_PER_RIDER;
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_VEHICLES_PER_RIDER;
  return parsed;
};

const normalizeCategory = (category: string): typeof VEHICLE_CATEGORIES[number] => category.trim().toLowerCase() as any;

const normalizeNonEmptyString = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const normalizeRegistrationNumber = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
};

const normalizeCreatePayload = (userId: string, data: CreateVehicleInput) => {
  const category = normalizeCategory(String(data.category));
  const brand = normalizeNonEmptyString(data.brand);
  const model = normalizeNonEmptyString(data.model);
  const color = normalizeNonEmptyString(data.color);
  const registrationNumber = normalizeRegistrationNumber(data.registrationNumber);

  if (data.confirmation !== true) {
    throw createError("confirmation must be true", HTTP_STATUS.BAD_REQUEST);
  }

  if (!brand || !model || !color) {
    throw createError("brand, model, and color are required", HTTP_STATUS.BAD_REQUEST);
  }

  if (!REGISTRATION_NUMBER_PATTERN.test(registrationNumber)) {
    throw createError("registrationNumber format is invalid", HTTP_STATUS.BAD_REQUEST);
  }

  return {
    riderId: new mongoose.Types.ObjectId(userId),
    category,
    brand,
    model,
    color,
    registrationNumber,
    isVerified: true,
    isActive: true,
  };
};

const normalizeUpdatePayload = (data: UpdateVehicleInput): UpdateVehicleInput => {
  const normalizedEntries = [
    [data.category !== undefined ? "category" : undefined, data.category !== undefined ? normalizeCategory(String(data.category)) : undefined],
    [data.brand !== undefined ? "brand" : undefined, data.brand !== undefined ? normalizeNonEmptyString(data.brand) : undefined],
    [data.model !== undefined ? "model" : undefined, data.model !== undefined ? normalizeNonEmptyString(data.model) : undefined],
    [data.color !== undefined ? "color" : undefined, data.color !== undefined ? normalizeNonEmptyString(data.color) : undefined],
  ].filter((pair) => pair[0] !== undefined && pair[1] !== undefined) as Array<[keyof UpdateVehicleInput, NonNullable<UpdateVehicleInput[keyof UpdateVehicleInput]>]>;

  const asObject = Object.fromEntries(normalizedEntries) as UpdateVehicleInput;
  return asObject;
};

const toLean = (doc: unknown): VehicleLean => doc as VehicleLean;

const handleDuplicateRegistrationError = (error: unknown): never => {
  const mongoError = error as { code?: number; keyValue?: unknown; message?: string };
  if (mongoError && mongoError.code === 11000) {
    throw createError("registrationNumber already exists", HTTP_STATUS.BAD_REQUEST);
  }
  throw error instanceof Error ? error : createError("Failed to create vehicle", HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

export const addVehicle = async (userId: string, data: CreateVehicleInput): Promise<VehicleLean> => {
  if (!isValidObjectId(userId)) throw createError("Invalid rider id", HTTP_STATUS.BAD_REQUEST);

  const payload = normalizeCreatePayload(userId, data);

  const maxVehicles = getMaxVehiclesPerRider();
  const activeVehicleCount = await Vehicle.countDocuments({ riderId: payload.riderId, isActive: true }).exec();
  if (activeVehicleCount >= maxVehicles) {
    throw createError(`You can add up to ${maxVehicles} vehicle(s)`, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const created = await Vehicle.create(payload);
    return toLean(created.toObject());
  } catch (error) {
    handleDuplicateRegistrationError(error);
    throw createError("Failed to create vehicle", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

export const getVehiclesByRiderId = async (userId: string): Promise<VehicleLean[]> => {
  if (!isValidObjectId(userId)) throw createError("Invalid rider id", HTTP_STATUS.BAD_REQUEST);

  const riderObjId = new mongoose.Types.ObjectId(userId);
  const vehicles = await Vehicle.find({ riderId: riderObjId }).lean().exec();
  return vehicles as VehicleLean[];
};

export const getVehicleByIdForOwner = async (vehicleId: string, userId: string): Promise<VehicleLean> => {
  if (!isValidObjectId(vehicleId)) throw createError("Invalid vehicle id", HTTP_STATUS.BAD_REQUEST);
  if (!isValidObjectId(userId)) throw createError("Invalid rider id", HTTP_STATUS.BAD_REQUEST);

  const vehicleObjId = new mongoose.Types.ObjectId(vehicleId);
  const vehicle = (await Vehicle.findById(vehicleObjId).lean().exec()) as VehicleLean | null;

  if (!vehicle) throw createError("Vehicle not found", HTTP_STATUS.NOT_FOUND);

  const ownerId = (vehicle.riderId as unknown as mongoose.Types.ObjectId).toString();
  if (ownerId !== userId) throw createError("Unauthorized access", HTTP_STATUS.FORBIDDEN);

  return vehicle;
};

export const updateVehicle = async (vehicleId: string, userId: string, data: UpdateVehicleInput & { registrationNumber?: unknown }): Promise<VehicleLean> => {
  if (!isValidObjectId(vehicleId)) throw createError("Invalid vehicle id", HTTP_STATUS.BAD_REQUEST);
  if (!isValidObjectId(userId)) throw createError("Invalid rider id", HTTP_STATUS.BAD_REQUEST);

  if (data.registrationNumber !== undefined) {
    throw createError("registrationNumber cannot be updated once created", HTTP_STATUS.BAD_REQUEST);
  }

  const vehicleObjId = new mongoose.Types.ObjectId(vehicleId);
  const existing = (await Vehicle.findById(vehicleObjId).lean().exec()) as VehicleLean | null;
  if (!existing) throw createError("Vehicle not found", HTTP_STATUS.NOT_FOUND);

  const ownerId = (existing.riderId as unknown as mongoose.Types.ObjectId).toString();
  if (ownerId !== userId) throw createError("Unauthorized access", HTTP_STATUS.FORBIDDEN);

  const updatePayload = normalizeUpdatePayload(data);
  if (Object.keys(updatePayload).length === 0) {
    throw createError("At least one updatable field must be provided", HTTP_STATUS.BAD_REQUEST);
  }

  const updated = await Vehicle.findByIdAndUpdate(vehicleObjId, { $set: updatePayload }, { new: true }).lean().exec();
  if (!updated) throw createError("Vehicle not found", HTTP_STATUS.NOT_FOUND);
  return updated as VehicleLean;
};

export const softDeleteVehicle = async (vehicleId: string, userId: string): Promise<void> => {
  if (!isValidObjectId(vehicleId)) throw createError("Invalid vehicle id", HTTP_STATUS.BAD_REQUEST);
  if (!isValidObjectId(userId)) throw createError("Invalid rider id", HTTP_STATUS.BAD_REQUEST);

  const vehicleObjId = new mongoose.Types.ObjectId(vehicleId);
  const existing = (await Vehicle.findById(vehicleObjId).lean().exec()) as VehicleLean | null;
  if (!existing) throw createError("Vehicle not found", HTTP_STATUS.NOT_FOUND);

  const ownerId = (existing.riderId as unknown as mongoose.Types.ObjectId).toString();
  if (ownerId !== userId) throw createError("Unauthorized access", HTTP_STATUS.FORBIDDEN);

  await Vehicle.findByIdAndUpdate(vehicleObjId, { $set: { isActive: false } }).exec();
};


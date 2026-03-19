import { body, param } from "express-validator";
import mongoose from "mongoose";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import { VEHICLE_CATEGORIES, REGISTRATION_NUMBER_PATTERN } from "@/modules/vehicle/vehicle.constants";

const registrationNumberMessage = `registrationNumber format is invalid`;

export const createVehicleValidation = () => [
  body("category")
    .notEmpty()
    .isIn(VEHICLE_CATEGORIES)
    .withMessage(`category must be one of: ${VEHICLE_CATEGORIES.join(", ")}`),
  body("brand").notEmpty().isString().trim().withMessage("brand is required"),
  body("model").notEmpty().isString().trim().withMessage("model is required"),
  body("color").notEmpty().isString().trim().withMessage("color is required"),
  body("registrationNumber")
    .notEmpty()
    .isString()
    .trim()
    .matches(REGISTRATION_NUMBER_PATTERN)
    .withMessage(registrationNumberMessage),
  body("confirmation")
    .custom((v) => v === true)
    .withMessage("confirmation must be true"),
];

export const vehicleIdParamValidation = () => [
  param("id")
    .custom((value) => {
      if (typeof value !== "string") throw new Error("Invalid vehicle id");
      if (!mongoose.Types.ObjectId.isValid(value)) throw new Error("Invalid vehicle id");
      const normalized = new mongoose.Types.ObjectId(value);
      if (normalized.toString() !== value) throw new Error("Invalid vehicle id");
      return true;
    })
    .withMessage("Invalid vehicle id"),
];

export const updateVehicleValidation = () => [
  body("registrationNumber")
    .optional({ nullable: false })
    .custom(() => {
      throw new Error("registrationNumber cannot be updated once created");
    }),
  body("category")
    .optional()
    .isIn(VEHICLE_CATEGORIES)
    .withMessage(`category must be one of: ${VEHICLE_CATEGORIES.join(", ")}`),
  body("brand").optional().isString().trim().notEmpty().withMessage("brand cannot be empty"),
  body("model").optional().isString().trim().notEmpty().withMessage("model cannot be empty"),
  body("color").optional().isString().trim().notEmpty().withMessage("color cannot be empty"),
];

export const ensureVehicleUpdateHasFields = () => {
  return (req: any, _res: any, next: any): void => {
    const allowedFields = ["category", "brand", "model", "color"];
    const hasAny = allowedFields.some((k) => req.body?.[k] !== undefined);
    if (!hasAny) {
      next(createError("At least one field must be provided", HTTP_STATUS.BAD_REQUEST));
      return;
    }
    next();
  };
};


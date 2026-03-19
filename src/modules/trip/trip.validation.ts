import { body, query, param } from "express-validator";

const locationValidator = (prefix: string) => [
  body(`${prefix}.lat`).isFloat().withMessage(`${prefix}.lat is required`),
  body(`${prefix}.lng`).isFloat().withMessage(`${prefix}.lng is required`),
  body(`${prefix}.address`).optional().isString(),
];

const capacityValidator = (prefix: string) => [
  body(`${prefix}.maxWeight`).isFloat({ min: 0.01 }).withMessage(`${prefix}.maxWeight must be > 0`),
  body(`${prefix}.maxLength`).isFloat({ min: 0.01 }).withMessage(`${prefix}.maxLength must be > 0`),
  body(`${prefix}.maxWidth`).isFloat({ min: 0.01 }).withMessage(`${prefix}.maxWidth must be > 0`),
  body(`${prefix}.maxHeight`).isFloat({ min: 0.01 }).withMessage(`${prefix}.maxHeight must be > 0`),
];

export const createDraftValidation = () => [
  ...locationValidator("fromLocation"),
  ...locationValidator("toLocation"),
  body("travelDate").isISO8601().withMessage("travelDate must be a valid ISO date"),
  body("departureTime").notEmpty().withMessage("departureTime is required"),
  body("arrivalTime").notEmpty().withMessage("arrivalTime is required"),
  ...capacityValidator("capacity"),
  body("price").isFloat({ min: 0.01 }).withMessage("price must be > 0"),
  body("legalItemConfirmed").custom((v) => v === true).withMessage("legalItemConfirmed must be true"),
  body("fitsLuggageConfirmed").custom((v) => v === true).withMessage("fitsLuggageConfirmed must be true"),
  body("willNotOpenConfirmed").custom((v) => v === true).withMessage("willNotOpenConfirmed must be true"),
  body("willMeetReceiverConfirmed").custom((v) => v === true).withMessage("willMeetReceiverConfirmed must be true"),
];

export const searchTripsValidation = () => [
  query("fromLat").notEmpty().isFloat().withMessage("fromLat required"),
  query("fromLng").notEmpty().isFloat().withMessage("fromLng required"),
  query("toLat").notEmpty().isFloat().withMessage("toLat required"),
  query("toLng").notEmpty().isFloat().withMessage("toLng required"),
  query("travelDate").notEmpty().isISO8601().withMessage("travelDate required (ISO)"),
  query("parcelWeight").notEmpty().isFloat({ min: 0 }).withMessage("parcelWeight required"),
  query("parcelLength").notEmpty().isFloat({ min: 0 }).withMessage("parcelLength required"),
  query("parcelWidth").notEmpty().isFloat({ min: 0 }).withMessage("parcelWidth required"),
  query("parcelHeight").notEmpty().isFloat({ min: 0 }).withMessage("parcelHeight required"),
];

export const priceBreakdownValidation = () => [
  query("parcelWeight").notEmpty().isFloat({ min: 0 }).withMessage("parcelWeight required"),
  query("parcelLength").notEmpty().isFloat({ min: 0 }).withMessage("parcelLength required"),
  query("parcelWidth").notEmpty().isFloat({ min: 0 }).withMessage("parcelWidth required"),
  query("parcelHeight").notEmpty().isFloat({ min: 0 }).withMessage("parcelHeight required"),
];

export const cancelTripValidation = () => [
  param("tripId").notEmpty().withMessage("tripId required").isString(),
];

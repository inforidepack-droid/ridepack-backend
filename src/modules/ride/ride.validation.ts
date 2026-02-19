import { body } from "express-validator";

export const createRideValidation = () => [
  body("pickup.lat").isFloat().withMessage("Pickup latitude required"),
  body("pickup.lng").isFloat().withMessage("Pickup longitude required"),
  body("pickup.address").optional().isString().trim(),
  body("dropoff.lat").isFloat().withMessage("Dropoff latitude required"),
  body("dropoff.lng").isFloat().withMessage("Dropoff longitude required"),
  body("dropoff.address").optional().isString().trim(),
];

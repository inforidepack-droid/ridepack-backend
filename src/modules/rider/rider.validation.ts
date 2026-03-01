import { body } from "express-validator";
import { VEHICLE_TYPE } from "@/modules/rider/rider.constants";

export const createRiderValidation = () => [
  body("governmentIdImage").notEmpty().trim().withMessage("governmentIdImage is required"),
  body("vehicleType")
    .notEmpty()
    .isIn(Object.values(VEHICLE_TYPE))
    .withMessage(`vehicleType must be one of: ${Object.values(VEHICLE_TYPE).join(", ")}`),
  body("vehicleDetails").optional().isObject(),
  body("vehicleDetails.model").optional().isString().trim(),
  body("vehicleDetails.color").optional().isString().trim(),
  body("vehicleDetails.plateNumber").optional().isString().trim(),
  body("vehicleDetails").custom((v, { req }) => {
    if (req.body?.vehicleType === VEHICLE_TYPE.OWN_VEHICLE) {
      const details = v || req.body?.vehicleDetails;
      if (!details?.model?.trim() || !details?.color?.trim() || !details?.plateNumber?.trim()) {
        throw new Error("vehicleDetails (model, color, plateNumber) required when vehicleType is own_vehicle");
      }
    }
    return true;
  }),
];

export const updateRiderValidation = () => [
  body("governmentIdImage").optional().notEmpty().trim(),
  body("vehicleType").optional().isIn(Object.values(VEHICLE_TYPE)),
  body("vehicleDetails").optional().isObject(),
  body("vehicleDetails.model").optional().isString().trim(),
  body("vehicleDetails.color").optional().isString().trim(),
  body("vehicleDetails.plateNumber").optional().isString().trim(),
];

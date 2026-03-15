import { body } from "express-validator";
import {
  LAT_MIN,
  LAT_MAX,
  LNG_MIN,
  LNG_MAX,
} from "@/modules/tracking/tracking.constants";

export const updateLocationValidation = () => [
  body("lat")
    .isFloat({ min: LAT_MIN, max: LAT_MAX })
    .withMessage(`lat must be a number between ${LAT_MIN} and ${LAT_MAX}`),
  body("lng")
    .isFloat({ min: LNG_MIN, max: LNG_MAX })
    .withMessage(`lng must be a number between ${LNG_MIN} and ${LNG_MAX}`),
];

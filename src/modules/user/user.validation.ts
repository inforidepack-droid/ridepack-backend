import { body } from "express-validator";
import { USER_CONSTANTS } from "@/modules/user/user.constants";
import { USER_GENDERS } from "@/modules/user/user.types";

export const createUserValidation = () => [
  body("email").optional().isEmail().normalizeEmail().withMessage("Valid email required"),
  body("phoneNumber").optional().isString().trim().withMessage("Valid phone number required"),
  body("countryCode").optional().isString().trim(),
];

export const updateUserValidation = () => [
  body("email").optional().isEmail().normalizeEmail(),
  body("phoneNumber").optional().isString().trim(),
  body("countryCode").optional().isString().trim(),
];

export const updateProfileValidation = () => [
  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({ max: USER_CONSTANTS.PROFILE_NAME_MAX })
    .withMessage(`name max ${USER_CONSTANTS.PROFILE_NAME_MAX} characters`),
  body("firstName")
    .optional()
    .isString()
    .trim()
    .isLength({ max: USER_CONSTANTS.PROFILE_NAME_MAX })
    .withMessage(`firstName max ${USER_CONSTANTS.PROFILE_NAME_MAX} characters`),
  body("lastName")
    .optional()
    .isString()
    .trim()
    .isLength({ max: USER_CONSTANTS.PROFILE_NAME_MAX })
    .withMessage(`lastName max ${USER_CONSTANTS.PROFILE_NAME_MAX} characters`),
  body("gender")
    .optional()
    .isIn([...USER_GENDERS])
    .withMessage(`gender must be one of: ${USER_GENDERS.join(", ")}`),
  body("profileImage")
    .optional()
    .isString()
    .trim()
    .isLength({ max: USER_CONSTANTS.PROFILE_IMAGE_MAX_LEN })
    .withMessage(`profileImage max ${USER_CONSTANTS.PROFILE_IMAGE_MAX_LEN} characters (URL or key)`),
  body("email").optional().isEmail().normalizeEmail().withMessage("Valid email required"),
  body("phoneNumber").optional().isString().trim(),
  body("countryCode").optional().isString().trim(),
  body("address")
    .optional()
    .isString()
    .trim()
    .isLength({ max: USER_CONSTANTS.ADDRESS_MAX })
    .withMessage(`address max ${USER_CONSTANTS.ADDRESS_MAX} characters`),
];

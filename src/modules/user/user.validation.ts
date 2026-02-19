import { body } from "express-validator";

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

/** Validation for PATCH /profile – only name and email allowed. */
export const updateProfileValidation = () => [
  body("name").optional().isString().trim().isLength({ max: 100 }).withMessage("Name max 100 characters"),
  body("email").optional().isEmail().normalizeEmail().withMessage("Valid email required"),
];

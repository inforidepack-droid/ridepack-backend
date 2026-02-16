import { body, ValidationChain } from "express-validator";

export const registerValidation = (): ValidationChain[] => {
  return [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  ];
};

export const loginValidation = (): ValidationChain[] => {
  return [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ];
};

export const refreshTokenValidation = (): ValidationChain[] => {
  return [body("refreshToken").notEmpty().withMessage("Refresh token is required")];
};

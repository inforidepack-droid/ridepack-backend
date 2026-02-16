import { body, ValidationChain } from "express-validator";

export const refreshTokenValidation = (): ValidationChain[] => {
  return [body("refreshToken").notEmpty().withMessage("Refresh token is required")];
};

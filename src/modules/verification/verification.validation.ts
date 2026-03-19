import type { ValidationChain } from "express-validator";
import { body } from "express-validator";

export const startVerificationValidation = (): ValidationChain[] => [];

export const veriffWebhookValidation = (): ValidationChain[] => [
  body("verification.id").optional().isString(),
  body("verification.status").optional().isString(),
  body("id").optional().isString(),
  body("status").optional().isString(),
];


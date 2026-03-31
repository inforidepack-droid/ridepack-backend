import { body, param } from "express-validator";

const MAX_MESSAGE_LENGTH = 500;

export const getBookingChatValidation = () => [
  param("bookingId").notEmpty().withMessage("bookingId is required"),
];

export const sendMessageValidation = () => [
  body("bookingId").notEmpty().withMessage("bookingId is required"),
  body("message")
    .notEmpty()
    .withMessage("message is required")
    .isString()
    .trim()
    .isLength({ min: 1, max: MAX_MESSAGE_LENGTH })
    .withMessage(`message must be 1-${MAX_MESSAGE_LENGTH} characters`),
];

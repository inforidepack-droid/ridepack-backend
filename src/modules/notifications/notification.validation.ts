import { body, param, query } from "express-validator";

const listQuery = () => [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const listNotificationsValidation = () => listQuery();

export const notificationIdValidation = () => [
  param("id").notEmpty().isMongoId().withMessage("Invalid notification id"),
];

export const registerDeviceValidation = () => [
  body("token").notEmpty().trim().isString().isLength({ min: 10, max: 512 }),
  body("deviceType").isIn(["android", "ios", "web"]).withMessage("deviceType required"),
];

export const sendNotificationValidation = () => [
  body("userId").notEmpty().isMongoId(),
  body("title").notEmpty().trim().isLength({ max: 200 }),
  body("message").notEmpty().trim().isLength({ max: 2000 }),
  body("type").notEmpty().trim().isLength({ max: 64 }),
  body("referenceId").optional().isMongoId(),
];

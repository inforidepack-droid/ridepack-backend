import { Router } from "express";
import { authenticate } from "@/middlewares/auth";
import { validate } from "@/middlewares/validation";
import {
  listNotificationsController,
  unreadCountController,
  markReadController,
  markAllReadController,
  registerDeviceController,
  unregisterDeviceController,
  adminSendNotificationController,
} from "@/modules/notifications/notification.controller";
import {
  listNotificationsValidation,
  notificationIdValidation,
  registerDeviceValidation,
  adminSendNotificationValidation,
} from "@/modules/notifications/notification.validation";
import { body } from "express-validator";

const router = Router();

router.use(authenticate);

router.get("/", listNotificationsValidation(), validate, listNotificationsController);
router.get("/unread-count", unreadCountController);
router.patch("/read-all", markAllReadController);
router.patch("/:id/read", notificationIdValidation(), validate, markReadController);
router.post("/device-token", registerDeviceValidation(), validate, registerDeviceController);
router.post(
  "/device-token/remove",
  body("token").notEmpty().trim(),
  validate,
  unregisterDeviceController
);
router.post(
  "/send",
  adminSendNotificationValidation(),
  validate,
  adminSendNotificationController
);

export default router;

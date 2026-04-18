import type { Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import { sendSuccess } from "@/utils/responseFormatter";
import type { AuthRequest } from "@/middlewares/auth";
import {
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
} from "@/modules/notifications/notification.inbox.service";
import { upsertDeviceToken, removeDeviceToken } from "@/modules/notifications/notification.device.service";
import { sendPushToUser } from "@/modules/notifications/notification.push.service";
import type { DeviceType } from "@/modules/notifications/deviceToken.model";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export const listNotificationsController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const page = Number(req.query.page) || DEFAULT_PAGE;
    const limit = Number(req.query.limit) || DEFAULT_LIMIT;
    const result = await listNotifications(req.user.userId, page, limit);
    sendSuccess(res, { data: result.data, pagination: result.pagination });
  }
);

export const unreadCountController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const count = await unreadCount(req.user.userId);
    sendSuccess(res, { data: { count } });
  }
);

export const markReadController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const id = req.params.id as string;
    const result = await markRead(req.user.userId, id);
    sendSuccess(res, { data: result });
  }
);

export const markAllReadController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const result = await markAllRead(req.user.userId);
    sendSuccess(res, { data: result });
  }
);

export const registerDeviceController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const { token, deviceType } = req.body as { token: string; deviceType: DeviceType };
    await upsertDeviceToken(req.user.userId, token, deviceType);
    sendSuccess(res, { data: { ok: true }, message: "Device token registered" });
  }
);

export const unregisterDeviceController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const { token } = req.body as { token: string };
    await removeDeviceToken(req.user.userId, token);
    sendSuccess(res, { data: { ok: true } });
  }
);

/** Any authenticated user may send a test/in-app notification to a target user (dev / internal tooling). */
export const sendNotificationController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const { userId, title, message, type, referenceId } = req.body as {
      userId: string;
      title: string;
      message: string;
      type: string;
      referenceId?: string;
    };
    await sendPushToUser(userId, title, message, type, { referenceId });
    sendSuccess(res, { data: { ok: true }, message: "Notification sent" });
  }
);

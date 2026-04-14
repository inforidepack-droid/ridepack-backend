import mongoose from "mongoose";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import { computeSkip, computeTotalPages } from "@/utils/pagination.utils";
import Notification from "@/modules/notifications/notification.model";

export const listNotifications = async (
  userId: string,
  page: number,
  limit: number
) => {
  const skip = computeSkip(page, limit);
  const filter = { userId: new mongoose.Types.ObjectId(userId) };
  const [rows, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
    Notification.countDocuments(filter).exec(),
  ]);
  const data = rows.map((n) => ({
    id: n._id.toString(),
    title: n.title,
    message: n.message,
    type: n.type,
    referenceId: n.referenceId ? n.referenceId.toString() : undefined,
    isRead: n.isRead,
    readAt: n.readAt ? n.readAt.toISOString() : undefined,
    createdAt: n.createdAt.toISOString(),
  }));
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: computeTotalPages(total, limit),
    },
  };
};

export const unreadCount = async (userId: string): Promise<number> =>
  Notification.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    isRead: false,
  }).exec();

export const markRead = async (userId: string, notificationId: string) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw createError("Invalid notification id", HTTP_STATUS.BAD_REQUEST);
  }
  const uid = new mongoose.Types.ObjectId(userId);
  const existing = await Notification.findOne({
    _id: notificationId,
    userId: uid,
  })
    .lean()
    .exec();
  if (!existing) {
    throw createError("Notification not found", HTTP_STATUS.NOT_FOUND);
  }
  if (existing.isRead) {
    return { ok: true };
  }
  await Notification.findByIdAndUpdate(notificationId, {
    $set: { isRead: true, readAt: new Date() },
  }).exec();
  return { ok: true };
};

export const markAllRead = async (userId: string) => {
  const result = await Notification.updateMany(
    { userId: new mongoose.Types.ObjectId(userId), isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  ).exec();
  const modified = (result as { modifiedCount?: number }).modifiedCount ?? 0;
  return { ok: true, modifiedCount: modified };
};

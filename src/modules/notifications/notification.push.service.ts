import mongoose from "mongoose";
import { getFirebaseMessaging } from "@/config/firebase.admin";
import { isFirebaseConfigured } from "@/config/env.config";
import { logger } from "@/config/logger";
import User from "@/modules/auth/models/User.model";
import DeviceToken from "@/modules/notifications/deviceToken.model";
import Notification from "@/modules/notifications/notification.model";

const FCM_BATCH = 500;

export type PushData = Record<string, string>;

const uniqueTokens = (tokens: string[]): string[] => [...new Set(tokens.filter(Boolean))];

const collectTokensForUser = async (userId: string): Promise<string[]> => {
  const uid = new mongoose.Types.ObjectId(userId);
  const fromDevices = await DeviceToken.find({ userId: uid }).select("token").lean().exec();
  const deviceTokens = fromDevices.map((d) => d.token);
  const u = await User.findById(userId).select("+fcmToken").lean().exec();
  const legacy = (u as { fcmToken?: string } | null)?.fcmToken;
  return uniqueTokens([...deviceTokens, ...(legacy ? [legacy] : [])]);
};

const sendFcmMulticast = async (
  tokens: string[],
  title: string,
  body: string,
  data: PushData
): Promise<void> => {
  if (tokens.length === 0) return;
  const messaging = getFirebaseMessaging();
  if (!messaging || !isFirebaseConfigured()) {
    logger.warn("FCM skipped: Firebase not configured or init failed");
    return;
  }
  const dataPayload: Record<string, string> = { ...data };
  for (let i = 0; i < tokens.length; i += FCM_BATCH) {
    const chunk = tokens.slice(i, i + FCM_BATCH);
    try {
      const res = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        data: dataPayload,
        apns: { payload: { aps: { sound: "default" } } },
      });
      res.responses.forEach((r, idx) => {
        if (!r.success && r.error) {
          logger.warn(`FCM token failed: ${chunk[idx]} ${r.error.message}`);
        }
      });
    } catch (e) {
      logger.error("FCM sendEachForMulticast failed", { err: e });
    }
  }
};

export const sendPushToUser = async (
  userId: string,
  title: string,
  message: string,
  type: string,
  options?: {
    referenceId?: string;
    data?: PushData;
  }
): Promise<{ notificationId: string } | null> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;

  const refId =
    options?.referenceId && mongoose.Types.ObjectId.isValid(options.referenceId)
      ? new mongoose.Types.ObjectId(options.referenceId)
      : undefined;

  const doc = await Notification.create({
    userId: new mongoose.Types.ObjectId(userId),
    title,
    message,
    type,
    ...(refId ? { referenceId: refId } : {}),
    isRead: false,
  });

  const data: PushData = {
    type,
    notificationId: doc._id.toString(),
    ...(options?.referenceId ? { referenceId: options.referenceId } : {}),
    ...(options?.data ?? {}),
  };

  const tokens = await collectTokensForUser(userId);
  await sendFcmMulticast(tokens, title, message, data);

  return { notificationId: doc._id.toString() };
};

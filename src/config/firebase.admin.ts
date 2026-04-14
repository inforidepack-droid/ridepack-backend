import * as admin from "firebase-admin";
import { readFileSync } from "node:fs";
import { env, isFirebaseConfigured } from "@/config/env.config";
import { logger } from "@/config/logger";

let initialized = false;

export const getFirebaseMessaging = (): admin.messaging.Messaging | null => {
  if (!isFirebaseConfigured()) return null;
  if (!initialized) {
    try {
      const path = env.FIREBASE_SERVICE_ACCOUNT_PATH.trim();
      if (path) {
        const json = JSON.parse(readFileSync(path, "utf8")) as {
          project_id: string;
          client_email: string;
          private_key: string;
        };
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: json.project_id,
            clientEmail: json.client_email,
            privateKey: json.private_key,
          }),
        });
      } else {
        const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey,
          }),
        });
      }
      initialized = true;
      logger.info("Firebase Admin initialized for FCM");
    } catch (e) {
      logger.error("Firebase Admin init failed", { err: e });
      return null;
    }
  }
  return admin.messaging();
};

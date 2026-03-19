import crypto from "crypto";
import axios from "axios";
import User from "@/modules/auth/models/User.model";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import { env } from "@/config/env.config";
import {
  VERIFICATION_PROVIDER,
  VERIFICATION_STATUS,
  type VerificationStatus,
} from "@/modules/verification/verification.constants";
import type {
  StartVerificationResult,
  VerificationState,
  VeriffSessionResponse,
  VeriffDecisionPayload,
} from "@/modules/verification/verification.types";

const resolveVerificationStatus = (status?: string): VerificationStatus => {
  const normalized = (status || "").toLowerCase();
  if (normalized === VERIFICATION_STATUS.APPROVED) return VERIFICATION_STATUS.APPROVED;
  if (normalized === VERIFICATION_STATUS.DECLINED) return VERIFICATION_STATUS.DECLINED;
  if (normalized === VERIFICATION_STATUS.EXPIRED || normalized === "abandoned") {
    return VERIFICATION_STATUS.EXPIRED;
  }
  return VERIFICATION_STATUS.PENDING;
};

const computeHmacSignature = (payload: Buffer, secret: string): string =>
  crypto.createHmac("sha256", secret).update(payload).digest("hex");

const timingSafeEquals = (a: string, b: string): boolean => {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

const VERIFF_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const isKnownVerificationStatus = (status: unknown): status is VerificationStatus =>
  Object.values(VERIFICATION_STATUS).includes(status as VerificationStatus);

export const startVerificationSession = async (userId: string): Promise<StartVerificationResult> => {
  if (!env.VERIFF_API_KEY || !env.VERIFF_CALLBACK_URL) {
    throw createError("Veriff integration is not configured", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  const user = await User.findById(userId).select("name isBlocked verification").lean().exec();
  if (!user) {
    throw createError("User not found", HTTP_STATUS.NOT_FOUND);
  }
  if (user.isBlocked) {
    throw createError("Blocked users cannot start verification", HTTP_STATUS.FORBIDDEN);
  }

  const verification = (user as { verification?: Record<string, unknown> }).verification ?? {};
  const existingStatus = isKnownVerificationStatus(verification.status) ? verification.status : VERIFICATION_STATUS.NOT_STARTED;

  if (existingStatus === VERIFICATION_STATUS.APPROVED) {
    throw createError("Identity verification already completed", HTTP_STATUS.FORBIDDEN);
  }

  const pendingVerificationUrl =
    typeof verification.verificationUrl === "string" ? verification.verificationUrl : undefined;
  const pendingCreatedAt =
    verification.createdAt instanceof Date
      ? verification.createdAt
      : typeof verification.createdAt === "string"
        ? (() => {
            const d = new Date(verification.createdAt);
            return Number.isNaN(d.getTime()) ? undefined : d;
          })()
        : undefined;

  if (existingStatus === VERIFICATION_STATUS.PENDING && pendingVerificationUrl && pendingCreatedAt) {
    const ageMs = Date.now() - pendingCreatedAt.getTime();
    if (ageMs <= VERIFF_SESSION_TTL_MS) {
      return { verificationUrl: pendingVerificationUrl };
    }
  }

  // If pending but older than 24h, or pending without url/createdAt, create a new session.
  // If declined/expired/not_started, retries are allowed by requirements.

  const userName = (user as { name?: string }).name;
  const firstName =
    userName && userName.trim().length > 0
      ? userName.trim()
      : "RidePack User";

  const payload = {
    verification: {
      callback: env.VERIFF_CALLBACK_URL,
      person: {
        firstName,
      },
    },
  };

  const response = await axios.post<VeriffSessionResponse>(
    "https://stationapi.veriff.com/v1/sessions",
    payload,
    {
      headers: {
        "X-AUTH-CLIENT": env.VERIFF_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    }
  );

  const session = response.data.verification;
  if (!session?.id || !session.url) {
    throw createError("Failed to create verification session", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  const now = new Date();
  await User.findByIdAndUpdate(
    userId,
    {
      verification: {
        provider: VERIFICATION_PROVIDER.VERIFF,
        sessionId: session.id,
        verificationUrl: session.url,
        status: VERIFICATION_STATUS.PENDING,
        createdAt: now,
        verifiedAt: null,
      },
    },
    { new: true }
  ).lean();

  return { verificationUrl: session.url };
};

export const getVerificationStatusForUser = async (userId: string): Promise<VerificationState> => {
  const user = await User.findById(userId).select("verification").lean().exec();
  if (!user) {
    throw createError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  const verification = (user as { verification?: { status?: unknown } }).verification;
  const storedStatus = isKnownVerificationStatus(verification?.status) ? verification?.status : VERIFICATION_STATUS.NOT_STARTED;

  return {
    status: storedStatus,
  };
};

export const ensureUserVerificationApprovedForBooking = async (userId: string): Promise<void> => {
  const { status } = await getVerificationStatusForUser(userId);
  // if (status !== VERIFICATION_STATUS.APPROVED) {
  //   throw createError(
  //     "Identity verification required before sending parcels",
  //     HTTP_STATUS.FORBIDDEN
  //   );
  // }
};

export const ensureUserVerificationApprovedForTripPublish = async (
  userId: string
): Promise<void> => {
  const { status } = await getVerificationStatusForUser(userId);
  if (status !== VERIFICATION_STATUS.APPROVED) {
    throw createError(
      "Identity verification required before publishing trips",
      HTTP_STATUS.FORBIDDEN
    );
  }
};

export const handleVeriffWebhook = async (
  rawBody: Buffer | undefined,
  headers: Record<string, string | string[] | undefined>,
  body: VeriffDecisionPayload
): Promise<void> => {
  if (!env.VERIFF_WEBHOOK_SECRET) {
    throw createError("Veriff webhook secret is not configured", HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  const signatureHeader = headers["x-hmac-signature"];
  const signature =
    typeof signatureHeader === "string" ? signatureHeader : signatureHeader?.[0] || "";
  if (!signature) {
    throw createError("Missing webhook signature", HTTP_STATUS.FORBIDDEN);
  }

  if (!rawBody || !(rawBody instanceof Buffer)) {
    throw createError("Webhook raw body is missing", HTTP_STATUS.BAD_REQUEST);
  }

  const expectedSignature = computeHmacSignature(rawBody, env.VERIFF_WEBHOOK_SECRET);
  if (!timingSafeEquals(signature, expectedSignature)) {
    throw createError("Invalid webhook signature", HTTP_STATUS.FORBIDDEN);
  }

  const verification = body.verification;
  const sessionId = verification?.id || body.id;
  const decision = verification?.status || body.status;

  if (!sessionId || !decision) {
    // Unknown payload shape – acknowledge without side effects
    return;
  }

  const normalizedStatus = resolveVerificationStatus(decision);

  // Only update user verification states we explicitly support.
  if (
    normalizedStatus !== VERIFICATION_STATUS.APPROVED &&
    normalizedStatus !== VERIFICATION_STATUS.DECLINED &&
    normalizedStatus !== VERIFICATION_STATUS.EXPIRED
  ) {
    return;
  }

  const user = await User.findOne({ "verification.sessionId": sessionId }).select("verification.status verification.verifiedAt _id").exec();
  if (!user) {
    // Unknown session – acknowledge without error to avoid retries
    return;
  }

  const currentStatus = isKnownVerificationStatus(user.verification?.status) ? (user.verification?.status as VerificationStatus) : VERIFICATION_STATUS.NOT_STARTED;
  const alreadyApproved = currentStatus === VERIFICATION_STATUS.APPROVED;

  // Prevent late duplicate webhooks from downgrading an approved user.
  if (alreadyApproved && normalizedStatus !== VERIFICATION_STATUS.APPROVED) {
    return;
  }

  const now = new Date();
  const existingVerifiedAt = user.verification?.verifiedAt ?? null;
  const verifiedAtToSet =
    normalizedStatus === VERIFICATION_STATUS.APPROVED
      ? existingVerifiedAt || now
      : null;

  await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        "verification.provider": VERIFICATION_PROVIDER.VERIFF,
        "verification.sessionId": sessionId,
        "verification.status": normalizedStatus,
        "verification.verifiedAt": verifiedAtToSet,
      },
    },
    { new: true }
  )
    .lean()
    .exec();
};


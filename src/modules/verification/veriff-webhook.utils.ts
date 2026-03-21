import crypto from "crypto";
import type { VeriffDecisionPayload } from "@/modules/verification/verification.types";

export const computeHmacSignature = (payload: Buffer, secret: string): string =>
  crypto.createHmac("sha256", secret).update(payload).digest("hex");

export const timingSafeEquals = (a: string, b: string): boolean => {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

/**
 * Veriff sends multiple shapes: decision webhook (`verification.status`), fullauto (`sessionId` + `data.verification.decision`).
 */
export const extractSessionIdAndDecision = (
  body: VeriffDecisionPayload
): { sessionId?: string; decision?: string } => {
  const dataVerification = body.data?.verification;
  const decision =
    dataVerification?.decision ??
    dataVerification?.status ??
    body.verification?.status ??
    (body.status && body.status !== "success" ? body.status : undefined);

  const sessionId = body.sessionId ?? body.verification?.id ?? body.id;

  return { sessionId, decision };
};

import { normalizePhoneForOtp } from "@/modules/auth/phoneE164.utils";
import { sendSms } from "@/services/sms/sms.service";
import { PARCEL_DELIVERY_SMS_PREFIX } from "@/modules/booking/booking.parcelOtp.constants";

export const buildParcelDeliverySmsBody = (plainOtp: string): string =>
  `${PARCEL_DELIVERY_SMS_PREFIX}${plainOtp}. Share it with the rider to confirm delivery.`;

export type ReceiverPhoneInput = {
  phone: string;
  countryCode?: string;
};

export const resolveReceiverSmsParts = (
  input: ReceiverPhoneInput
): { countryCode: string; nationalNumber: string } | null => {
  const normalized = normalizePhoneForOtp({
    phoneNumber: input.phone.trim(),
    ...(input.countryCode ? { countryCode: input.countryCode.trim() } : {}),
  });
  if (!normalized) return null;
  return { countryCode: normalized.countryCode, nationalNumber: normalized.nationalNumber };
};

export const sendParcelDeliveryOtpSms = async (
  receiver: ReceiverPhoneInput,
  plainOtp: string
): Promise<void> => {
  const parts = resolveReceiverSmsParts(receiver);
  if (!parts) {
    throw new Error("INVALID_RECEIVER_PHONE");
  }
  await sendSms(parts.countryCode, parts.nationalNumber, buildParcelDeliverySmsBody(plainOtp));
};

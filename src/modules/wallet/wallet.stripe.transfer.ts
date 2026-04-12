import { getStripeClient } from "@/services/stripe/stripe.client";
import { env } from "@/config/env.config";
import { dollarsToStripeAmount } from "@/modules/booking/booking.stripe.utils";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";

export const transferToConnectedAccount = async (params: {
  destinationAccountId: string;
  amountDollars: number;
  metadata: Record<string, string>;
}): Promise<{ transferId: string }> => {
  const stripe = getStripeClient();
  const amountCents = dollarsToStripeAmount(params.amountDollars);
  if (amountCents < 1) {
    throw createError("Withdrawal amount too small for Stripe", HTTP_STATUS.BAD_REQUEST);
  }
  try {
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: env.STRIPE_CURRENCY,
      destination: params.destinationAccountId,
      metadata: params.metadata,
    });
    return { transferId: transfer.id };
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? "Stripe transfer failed";
    throw createError(msg, 502);
  }
};

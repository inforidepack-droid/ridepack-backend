import { getStripeClient } from "@/services/stripe/stripe.client";
import { createError } from "@/utils/appError";
import { env } from "@/config/env.config";
import { HTTP_STATUS } from "@/constants/http.constants";

export const dollarsToStripeAmount = (dollars: number): number => Math.round(dollars * 100);

export const assertPaymentIntentMatchesBooking = async ({
  paymentIntentId,
  bookingId,
  senderId,
  agreedPriceDollars,
  stripeCustomerId,
}: {
  paymentIntentId: string;
  bookingId: string;
  senderId: string;
  agreedPriceDollars: number;
  stripeCustomerId: string | undefined | null;
}): Promise<void> => {
  const stripe = getStripeClient();

  let pi: Awaited<ReturnType<typeof stripe.paymentIntents.retrieve>>;
  try {
    pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    throw createError("Invalid or unknown PaymentIntent", HTTP_STATUS.BAD_REQUEST);
  }

  if (pi.status !== "succeeded") {
    throw createError(
      `Payment not completed. Current status: ${pi.status}`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const expectedAmount = dollarsToStripeAmount(agreedPriceDollars);
  if (pi.amount !== expectedAmount) {
    throw createError("Payment amount does not match booking", HTTP_STATUS.BAD_REQUEST);
  }

  if (pi.currency.toLowerCase() !== env.STRIPE_CURRENCY) {
    throw createError("Payment currency does not match booking", HTTP_STATUS.BAD_REQUEST);
  }

  if (!pi.metadata?.bookingId || pi.metadata.bookingId !== bookingId) {
    throw createError("PaymentIntent does not belong to this booking", HTTP_STATUS.BAD_REQUEST);
  }

  if (pi.metadata.senderId !== senderId) {
    throw createError("PaymentIntent sender mismatch", HTTP_STATUS.BAD_REQUEST);
  }

  const cust = pi.customer as string | null | undefined;
  if (cust && stripeCustomerId && cust !== stripeCustomerId) {
    throw createError("PaymentIntent customer mismatch", HTTP_STATUS.BAD_REQUEST);
  }
};

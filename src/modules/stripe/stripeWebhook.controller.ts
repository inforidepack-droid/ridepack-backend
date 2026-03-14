import type express from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/utils/appError";
import { sendSuccess } from "@/utils/responseFormatter";
import { constructStripeWebhookEvent } from "@/services/stripe/stripe.client";

type StripeRequest = express.Request & { rawBody?: Buffer };

export const stripeWebhookController = asyncHandler(
  async (req: StripeRequest, res: express.Response): Promise<void> => {
    const signature = req.headers["stripe-signature"];

    if (!signature || typeof signature !== "string") {
      throw createError("Missing Stripe signature", 400);
    }

    if (!req.rawBody) {
      throw createError("Missing raw body for Stripe webhook", 400);
    }

    let event;

    try {
      event = constructStripeWebhookEvent(req.rawBody, signature);
    } catch {
      throw createError("Invalid Stripe webhook signature", 400);
    }

    if (event.type === "account.updated") {
      // For this minimal test implementation, we just acknowledge the event.
    } else if (event.type === "payment_method.attached") {
      // Card attached to customer; main persistence happens via our own API.
    } else if (event.type === "payout.paid") {
      // In a full implementation we would sync payout status to rider earnings.
    }

    sendSuccess(res, { data: { received: true } });
  }
);


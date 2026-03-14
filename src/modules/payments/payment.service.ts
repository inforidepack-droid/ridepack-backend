import mongoose from "mongoose";
import { getStripeClient } from "@/services/stripe/stripe.client";
import { createError } from "@/utils/appError";
import User from "@/modules/auth/models/User.model";
import Booking from "@/modules/booking/booking.model";
import { BOOKING_STATUS } from "@/modules/booking/booking.constants";
import PaymentMethod from "@/modules/payments/paymentMethod.model";
import type { IPaymentMethod } from "@/modules/payments/payment.types";

const findUserOrThrow = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw createError("Invalid user id", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw createError("User not found", 404);
  }

  return user;
};

const ensureSenderRole = (role: string | undefined) => {
  if (role !== "sender") {
    throw createError("Only senders can manage payment methods", 403);
  }
};

const ensureStripeCustomer = async (user: Awaited<ReturnType<typeof findUserOrThrow>>) => {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const stripe = getStripeClient();

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user._id.toString() },
  });

  user.stripeCustomerId = customer.id;
  await user.save();

  return customer.id;
};

export const createSetupIntentForUser = async (
  userId: string
): Promise<{ clientSecret: string }> => {
  const user = await findUserOrThrow(userId);

  ensureSenderRole(user.role);

  const customerId = await ensureStripeCustomer(user);

  try {
    const stripe = getStripeClient();
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: "off_session",
      payment_method_types: ["card"],
    });

    if (!setupIntent.client_secret) {
      throw createError("Failed to create setup intent", 502);
    }

    return { clientSecret: setupIntent.client_secret };
  } catch {
    throw createError("Stripe API error while creating setup intent", 502);
  }
};

export const savePaymentMethodForUser = async (
  userId: string,
  paymentMethodId: string
): Promise<IPaymentMethod> => {
  if (!paymentMethodId) {
    throw createError("paymentMethodId is required", 400);
  }

  const user = await findUserOrThrow(userId);

  ensureSenderRole(user.role);

  const customerId = await ensureStripeCustomer(user);

  try {
    const stripe = getStripeClient();
    const existing = await PaymentMethod.findOne({
      userId: user._id,
      stripePaymentMethodId: paymentMethodId,
    });

    if (existing) {
      throw createError("This card is already saved", 400);
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.type !== "card" || !paymentMethod.card) {
      throw createError("Only card payment methods are supported", 400);
    }

    if (!paymentMethod.customer) {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    }

    const created = await PaymentMethod.create({
      userId: user._id,
      stripePaymentMethodId: paymentMethodId,
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
    });

    return created;
  } catch (error) {
    if ((error as any).statusCode && (error as any).statusCode >= 400) {
      throw error;
    }

    throw createError("Stripe API error while saving payment method", 502);
  }
};

export const listPaymentMethodsForUser = async (
  userId: string
): Promise<IPaymentMethod[]> => {
  const user = await findUserOrThrow(userId);

  ensureSenderRole(user.role);

  const paymentMethods = await PaymentMethod.find({ userId: user._id }).sort({
    createdAt: -1,
  });

  return paymentMethods;
};

export const deletePaymentMethodForUser = async (
  userId: string,
  paymentMethodDbId: string
): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(paymentMethodDbId)) {
    throw createError("Invalid payment method id", 400);
  }

  const user = await findUserOrThrow(userId);

  ensureSenderRole(user.role);

  const paymentMethod = await PaymentMethod.findOne({
    _id: paymentMethodDbId,
    userId: user._id,
  });

  if (!paymentMethod) {
    throw createError("Payment method not found", 404);
  }

  const activeBooking = await Booking.findOne({
    senderId: user._id,
    status: BOOKING_STATUS.PENDING_PAYMENT,
  });

  if (activeBooking) {
    throw createError(
      "Cannot delete card while you have an active booking awaiting payment",
      400
    );
  }

  try {
    const stripe = getStripeClient();
    await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);
  } catch {
    // Ignore detach errors in this minimal test implementation
  }

  await paymentMethod.deleteOne();
};


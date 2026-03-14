import mongoose from "mongoose";
import { getStripeClient } from "@/services/stripe/stripe.client";
import { env } from "@/config/env.config";
import { createError } from "@/utils/appError";
import User from "@/modules/auth/models/User.model";

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

const ensureRiderRole = (role: string | undefined) => {
  if (role !== "rider") {
    throw createError("Only riders can connect Stripe accounts", 403);
  }
};

const getOrCreateConnectAccount = async (
  user: Awaited<ReturnType<typeof findUserOrThrow>>
) => {
  const stripe = getStripeClient();
  if (user.stripeAccountId) {
    const existing = await stripe.accounts.retrieve(user.stripeAccountId);

    if (existing.charges_enabled && existing.payouts_enabled) {
      throw createError("Stripe account is already fully connected", 400);
    }

    return existing;
  }

  const account = await stripe.accounts.create({
    type: "express",
    email: user.email || undefined,
    business_type: "individual",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      userId: user._id.toString(),
    },
  });

  user.stripeAccountId = account.id;
  await user.save();

  return account;
};

export const createConnectOnboardingLink = async (
  userId: string
): Promise<{ url: string }> => {
  const user = await findUserOrThrow(userId);

  ensureRiderRole(user.role);

  const account = await getOrCreateConnectAccount(user);

  const baseUrl = env.CORS_ORIGIN || "http://localhost:3000";

  try {
    const stripe = getStripeClient();
    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/connect-stripe`,
      return_url: `${baseUrl}/connect-stripe`,
      type: "account_onboarding",
    });

    return { url: link.url };
  } catch {
    throw createError("Stripe API error while creating onboarding link", 502);
  }
};

export const getStripeAccountStatus = async (userId: string) => {
  const user = await findUserOrThrow(userId);

  ensureRiderRole(user.role);

  if (!user.stripeAccountId) {
    return {
      chargesEnabled: false,
      payoutsEnabled: false,
      last4: null as string | null,
    };
  }

  try {
    const stripe = getStripeClient();
    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    const defaultExternal =
      account.external_accounts &&
      "data" in account.external_accounts &&
      account.external_accounts.data.length > 0
        ? account.external_accounts.data[0]
        : null;

    const last4 =
      defaultExternal && "last4" in defaultExternal ? defaultExternal.last4 ?? null : null;

    return {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      last4,
    };
  } catch {
    throw createError("Stripe API error while fetching account status", 502);
  }
};

export const disconnectStripeAccount = async (userId: string): Promise<void> => {
  const user = await findUserOrThrow(userId);

  ensureRiderRole(user.role);

  if (!user.stripeAccountId) {
    return;
  }

  user.stripeAccountId = undefined;
  await user.save();
};


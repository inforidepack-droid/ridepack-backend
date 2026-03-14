import StripeModule from "stripe";
import { env } from "@/config/env.config";

// Use a looser type here to avoid coupling to specific Stripe TypeScript versions.
// This is a minimal test integration, so runtime behavior is more important than compile-time typing.
type StripeInstance = any;

let stripeClient: StripeInstance | null = null;

const getOrCreateStripeClient = (): StripeInstance => {
  if (stripeClient) {
    return stripeClient;
  }

  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key is not configured");
  }

  stripeClient = new StripeModule(env.STRIPE_SECRET_KEY);

  return stripeClient;
};

export const getStripeClient = (): StripeInstance => getOrCreateStripeClient();

export const constructStripeWebhookEvent = (rawBody: Buffer, signature: string) => {
  const client = getOrCreateStripeClient();

  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe webhook secret is not configured");
  }

  return client.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
};


import { Router } from "express";
import { authenticate } from "@/middlewares/auth";
import {
  createConnectAccountController,
  disconnectStripeController,
  getStripeStatusController,
} from "@/modules/stripe/stripeConnect.controller";
import { stripeWebhookController } from "@/modules/stripe/stripeWebhook.controller";

const stripeRouter = Router();
const stripeWebhookRouter = Router();

stripeRouter.post("/connect", authenticate, createConnectAccountController);
stripeRouter.get("/status", authenticate, getStripeStatusController);
stripeRouter.delete("/disconnect", authenticate, disconnectStripeController);

stripeWebhookRouter.post("/stripe", stripeWebhookController);

export default stripeRouter;
export { stripeWebhookRouter };


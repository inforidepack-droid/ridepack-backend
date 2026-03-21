import { Router } from "express";
import { authenticate } from "@/middlewares/auth";
import { validate } from "@/middlewares/validation";
import {
  startVerificationController,
  getVerificationStatusController,
  veriffWebhookController,
  veriffCallbackReturnController,
} from "@/modules/verification/verification.controller";
import {
  startVerificationValidation,
  veriffWebhookValidation,
} from "@/modules/verification/verification.validation";

const verificationRouter = Router();
const webhookRouter = Router();

verificationRouter.post(
  "/start",
  authenticate,
  startVerificationValidation(),
  validate,
  startVerificationController
);

verificationRouter.get("/status", authenticate, getVerificationStatusController);

webhookRouter.get("/veriff", veriffCallbackReturnController);
webhookRouter.post("/veriff", veriffWebhookValidation(), validate, veriffWebhookController);

export default verificationRouter;
export { webhookRouter as veriffWebhookRouter };


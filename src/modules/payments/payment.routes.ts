import { Router } from "express";
import { authenticate } from "@/middlewares/auth";
import {
  createSetupIntentController,
  deletePaymentMethodController,
  listPaymentMethodsController,
  savePaymentMethodController,
} from "@/modules/payments/payment.controller";

const router = Router();

router.post("/setup-intent", authenticate, createSetupIntentController);
router.post("/methods", authenticate, savePaymentMethodController);
router.get("/methods", authenticate, listPaymentMethodsController);
router.delete("/methods/:id", authenticate, deletePaymentMethodController);

export default router;


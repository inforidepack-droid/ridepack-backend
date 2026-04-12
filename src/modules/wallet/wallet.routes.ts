import { Router } from "express";
import { authenticate } from "@/middlewares/auth";
import { requireRider } from "@/modules/rider/rider.middleware";
import { validateZod } from "@/middlewares/zodValidation";
import { requireWalletInternalSecret } from "@/modules/wallet/wallet.internal.middleware";
import { creditWalletBodySchema, withdrawWalletBodySchema } from "@/modules/wallet/wallet.validation";
import {
  creditWalletController,
  getWalletSummaryController,
  getWalletTransactionByIdController,
  listWalletTransactionsController,
  withdrawWalletController,
} from "@/modules/wallet/wallet.controller";

const router = Router();

router.post(
  "/credit",
  requireWalletInternalSecret,
  validateZod(creditWalletBodySchema),
  creditWalletController
);

router.get("/", authenticate, getWalletSummaryController);
router.get("/transactions", authenticate, listWalletTransactionsController);
router.get("/transactions/:id", authenticate, getWalletTransactionByIdController);
router.post(
  "/withdraw",
  authenticate,
  requireRider,
  validateZod(withdrawWalletBodySchema),
  withdrawWalletController
);

export default router;

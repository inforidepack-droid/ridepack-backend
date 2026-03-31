import { Router } from "express";
import { authenticate } from "@/middlewares/auth";
import { validate } from "@/middlewares/validation";
import {
  getBookingChatController,
  listConversationsController,
  sendChatMessageController,
} from "@/modules/chat/chat.controller";
import { getBookingChatValidation, sendMessageValidation } from "@/modules/chat/chat.validation";

const router = Router();

router.get("/conversations", authenticate, listConversationsController);
router.get("/:bookingId", authenticate, getBookingChatValidation(), validate, getBookingChatController);
router.post("/send", authenticate, sendMessageValidation(), validate, sendChatMessageController);

export default router;

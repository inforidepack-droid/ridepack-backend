import { Router } from "express";
import { authenticate } from "@/middlewares/auth";
import { listMyRequestsController } from "@/modules/request/request.controller";

const router = Router();

router.get("/", authenticate, listMyRequestsController);

export default router;

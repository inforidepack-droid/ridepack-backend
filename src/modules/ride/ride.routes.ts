import { Router } from "express";
import { createRideController, getRideController, getMyRidesController } from "@/modules/ride/ride.controller";
import { createRideValidation } from "@/modules/ride/ride.validation";
import { authenticate } from "@/middlewares/auth";
import { validate } from "@/middlewares/validation";

const router = Router();

router.use(authenticate);

router.post("/", createRideValidation(), validate, createRideController);
router.get("/", getMyRidesController);
router.get("/:id", getRideController);

export default router;

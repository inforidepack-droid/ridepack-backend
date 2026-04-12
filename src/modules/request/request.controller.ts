import { Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/utils/appError";
import { HTTP_STATUS } from "@/constants/http.constants";
import { sendSuccess } from "@/utils/responseFormatter";
import type { AuthRequest } from "@/middlewares/auth";
import { listMyRequestsQuerySchema } from "@/modules/request/request.validation";
import { listMyParcelRequests } from "@/modules/request/request.service";

export const listMyRequestsController = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw createError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    const parsed = listMyRequestsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(", ");
      throw createError(msg, HTTP_STATUS.BAD_REQUEST);
    }
    const result = await listMyParcelRequests(req.user.userId, parsed.data);
    sendSuccess(res, {
      data: result.data,
      pagination: result.pagination,
    });
  }
);

import { Response } from "express";
import { asyncHandler } from "@/middlewares/asyncHandler";
import { createError } from "@/utils/appError";
import { sendSuccess } from "@/utils/responseFormatter";
import { uploadBuffer, buildUploadKey } from "@/services/s3/s3.service";
import { handleMulterError } from "@/modules/upload/upload.multer";
import { UPLOAD_FIELD_NAME } from "@/modules/upload/upload.constants";
import { AuthRequest } from "@/middlewares/auth";

export const uploadImageController = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) throw createError("Unauthorized", 401);

  const file = req.file;
  if (!file || !file.buffer) {
    throw createError(`Missing file. Upload with field: ${UPLOAD_FIELD_NAME}`, 400);
  }

  const key = buildUploadKey(req.user.userId, file.originalname || "image");
  const url = await uploadBuffer(key, file.buffer, file.mimetype);

  sendSuccess(res, { data: { url, key } });
});

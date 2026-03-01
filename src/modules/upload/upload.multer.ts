import multer from "multer";
import { createError } from "@/utils/appError";
import { ALLOWED_IMAGE_MIMES, MAX_IMAGE_SIZE_BYTES, UPLOAD_FIELD_NAME } from "@/modules/upload/upload.constants";

const storage = multer.memoryStorage();

const fileFilter = (
  _req: unknown,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowed = ALLOWED_IMAGE_MIMES.includes(file.mimetype as (typeof ALLOWED_IMAGE_MIMES)[number]);
  if (allowed) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${ALLOWED_IMAGE_MIMES.join(", ")}`));
  }
};

export const uploadImageMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
}).single(UPLOAD_FIELD_NAME);

export const handleMulterError = (err: unknown): never => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      throw createError("Image too large. Max 5 MB.", 400);
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      throw createError(`Field name must be: ${UPLOAD_FIELD_NAME}`, 400);
    }
  }
  throw err;
};

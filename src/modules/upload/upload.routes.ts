import { Router, Request, Response, NextFunction } from "express";
import { uploadImageController } from "@/modules/upload/upload.controller";
import { uploadImageMiddleware, handleMulterError } from "@/modules/upload/upload.multer";
import { authenticate } from "@/middlewares/auth";

const router = Router();

const withMulter = (req: Request, res: Response, next: NextFunction): void => {
  uploadImageMiddleware(req, res, (err: unknown) => {
    if (err) {
      try {
        handleMulterError(err);
      } catch (e) {
        next(e);
        return;
      }
    }
    next();
  });
};

router.post("/image", authenticate, withMulter, uploadImageController);

export default router;

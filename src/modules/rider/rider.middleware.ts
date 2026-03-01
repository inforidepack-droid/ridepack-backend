import { Response, NextFunction } from "express";
import { createError } from "@/utils/appError";
import User from "@/modules/auth/models/User.model";
import { AuthRequest } from "@/middlewares/auth";

/**
 * Ensures the authenticated user has role "rider" and is not blocked.
 * Use before creating a rider profile.
 */
export const requireRider = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user?.userId) {
    next(createError("Unauthorized", 401));
    return;
  }
  const user = await User.findById(req.user.userId).select("role isBlocked").lean().exec();
  if (!user) {
    next(createError("User not found", 404));
    return;
  }
  if ((user as { isBlocked?: boolean }).isBlocked) {
    next(createError("Account is blocked", 403));
    return;
  }
  if ((user as { role?: string }).role !== "rider") {
    next(createError("Only users with rider role can perform this action", 403));
    return;
  }
  next();
};

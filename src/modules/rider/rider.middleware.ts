import { Response, NextFunction } from "express";
import { createError } from "@/utils/appError";
import User from "@/modules/auth/models/User.model";
import { AuthRequest } from "@/middlewares/auth";
import { isMarketplaceParticipantRole } from "@/constants/marketplace.roles";

/**
 * Ensures the authenticated user is a marketplace participant (`user`, `sender`, or `rider`)
 * and not blocked — same rule as payment methods / Stripe Connect. Use before rider-profile
 * creation, vehicles, wallet withdraw, etc.
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
  const role = (user as { role?: string }).role;
  if (!isMarketplaceParticipantRole(role)) {
    next(
      createError(
        "Only marketplace users (user, sender, or rider) can perform this action",
        403
      )
    );
    return;
  }
  next();
};

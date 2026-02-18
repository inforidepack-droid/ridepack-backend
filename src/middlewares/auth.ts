import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "@/libs/jwt";
import { createError } from "@/middlewares/errorHandler";

// export interface AuthRequest extends Request {
//   user?: TokenPayload;
// }
export interface AuthRequest extends Request {}

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createError("No token provided", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token) as TokenPayload;

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof Error && (error as any).statusCode) {
      next(error);
    } else {
      next(createError("Invalid or expired token", 401));
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError("Unauthorized", 401));
    }

    // This is a placeholder - implement role checking based on your user model
    // For now, we'll assume roles are stored in the token payload
    const userRole = (req.user as any).role || "user";

    if (!roles.includes(userRole)) {
      return next(createError("Forbidden: Insufficient permissions", 403));
    }

    next();
  };
};

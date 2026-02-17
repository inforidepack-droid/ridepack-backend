import { TokenPayload } from "@/libs/jwt";
import { IUser } from "@/interfaces/user.interface";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload | IUser;
    }
  }
}

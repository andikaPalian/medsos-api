import { Request } from "express";
import { UserSession } from "../modules/auth/dto/session.type.ts";

declare global {
  namespace Express {
    interface Request {
      user: UserSession;
    }
  }
}

import { Request } from "express";
import { UserSession } from "./auth/session.type.ts";

declare global {
  namespace Express {
    interface Request {
      user: UserSession;
    }
  }
}

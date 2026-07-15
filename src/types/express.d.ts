import { Request } from "express";
import { UserSession } from "../common/types/authenticated-request.ts";

declare global {
  namespace Express {
    interface Request {
      user?: UserSession;
      validatedQuery?: unknown;
    }
  }
}

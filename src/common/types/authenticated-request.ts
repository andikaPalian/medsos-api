import { Request } from "express";

export interface UserSession {
  id: string;
  username: string;
}

export interface AuthenticatedRequest<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user: UserSession;
}

import { Response, NextFunction, RequestHandler } from "express";
import { AuthenticatedRequest } from "../types/authenticated-request.js";

export const authHandler = <P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
  fn: (
    req: AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => Promise<any>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (req, res, next) => {
    Promise.resolve(
      fn(req as AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery>, res, next),
    ).catch(next);
  };
};

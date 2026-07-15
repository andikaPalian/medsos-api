import { Response, NextFunction, RequestHandler } from "express";
import { AuthenticatedRequest } from "../types/authenticated-request.js";

export const authHandler = <
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
  ValidatedQuery = any,
>(
  fn: (
    req: AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery, ValidatedQuery>,
    res: Response,
    next: NextFunction,
  ) => Promise<any>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (req, res, next) => {
    Promise.resolve(
      fn(req as AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery, ValidatedQuery>, res, next),
    ).catch(next);
  };
};

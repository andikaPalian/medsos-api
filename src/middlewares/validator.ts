import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { ValidationError } from "../common/error/validationError.js";

export const validate = <T extends ZodType>(schema: T) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await schema.safeParseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        next(new ValidationError(result.error));
        return;
      }

      const { body, query, params } = result.data as {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };

      if (body !== undefined) req.body = body;
      if (params !== undefined) req.params = params as typeof req.params;

      if (query !== undefined) {
        (req as Request & { validatedQuery: unknown }).validatedQuery = query;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

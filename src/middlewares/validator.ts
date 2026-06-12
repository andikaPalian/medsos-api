import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { ValidationError } from "../utils/validationError.js";

interface ValidationRequestPayload {
  body?: string;
  query?: string;
  params?: string;
}

export const validate = <T extends ZodType>(schema: T) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const result = await schema.safeParseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        return next(new ValidationError(result.error));
      }

      const validatedData = result.data as ValidationRequestPayload;
      const { body, query, params } = validatedData;

      if (body !== undefined) req.body = body;
      if (query !== undefined) req.query = query as unknown as typeof req.query;
      if (params !== undefined) req.params = params as unknown as typeof req.params;

      next();
    } catch (error) {
      next(error);
    }
  };
};

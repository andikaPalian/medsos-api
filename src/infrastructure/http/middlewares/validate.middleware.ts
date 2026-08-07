import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "@core/errors/validation.error.js";

export const validate = (schema: ZodSchema): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
        file: req.file,
        files: req.files,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        next(new ValidationError(formattedErrors));
        return;
      }
      next(error);
    }
  };
};

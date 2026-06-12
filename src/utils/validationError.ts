import { ZodError } from "zod";
import { AppError } from "./errorHandler.js";

interface ValidationErrorDetail {
  path: string;
  message: string;
}

export class ValidationError extends AppError {
  public readonly errors: ValidationErrorDetail[];

  constructor(zodError: ZodError) {
    super("Validation error", 400);

    this.errors = zodError.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

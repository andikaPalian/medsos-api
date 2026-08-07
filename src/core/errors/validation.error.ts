import { AppError } from "./base.error.js";

export interface FormattedFieldError {
  field: string;
  message: string;
}

export class ValidationError extends AppError {
  public override readonly statusCode = 422;
  public readonly code = "VALIDATION_ERROR";

  constructor(
    public readonly errors: FormattedFieldError[],
    message = "Validation failed for incoming request data",
  ) {
    super(message);
  }
}

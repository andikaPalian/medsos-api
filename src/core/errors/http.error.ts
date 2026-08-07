import { AppError } from "./base.error.js";

export abstract class HttpError extends AppError {
  constructor(
    message: string,
    public override readonly statusCode: number,
    public readonly code: string = "HTTP_ERROR",
  ) {
    super(message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "Bad request", code = "BAD_REQUEST") {
    super(message, 400, code);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized access", code = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden access", code = "FORBIDDEN") {
    super(message, 403, code);
  }
}

export class NotFoundError extends HttpError {
  constructor(entityName = "Resource", code = "NOT_FOUND") {
    super(`${entityName} not found`, 404, code);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Conflict occurred", public readonly field?: string, code = "CONFLICT") {
    super(message, 409, code);
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message = "Too many requests. Please try again later.", code = "TOO_MANY_REQUESTS") {
    super(message, 429, code);
  }
}

export class InternalServerError extends HttpError {
  constructor(message = "Internal server error", code = "INTERNAL_SERVER_ERROR") {
    super(message, 500, code);
  }
}

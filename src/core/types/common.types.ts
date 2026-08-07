import { FormattedFieldError } from "@core/errors/index.js";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: FormattedFieldError[];
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
}

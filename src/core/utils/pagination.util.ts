// ============================================================
// Cursor-based pagination helper
// ============================================================

export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export const paginateCursor = <T>(
  data: T[],
  take: number,
  getCursorId: (item: T) => string,
): CursorPaginationResult<T> => {
  const hasNextPage = data.length > take;
  const items = hasNextPage ? data.slice(0, take) : data;
  const nextCursor = hasNextPage && items.length > 0 ? getCursorId(items[items.length - 1]) : null;

  return { items, nextCursor, hasNextPage };
};

/** Clamp limit to [1, maxLimit], defaulting to defaultLimit */
export const clampLimit = (limit: number | undefined, defaultLimit: number, maxLimit: number): number =>
  Math.min(maxLimit, Math.max(1, limit ?? defaultLimit));

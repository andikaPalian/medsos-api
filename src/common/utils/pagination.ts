export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export const paginateCursor = <T>(data: T[], take: number, getCursorId: (item: T) => string) => {
  const hasNextPage = data.length > take;
  const items = hasNextPage ? data.slice(0, take) : data;
  const nextCursor = hasNextPage && items.length > 0 ? getCursorId(items[items.length - 1]) : null;

  return {
    items,
    nextCursor,
    hasNextPage,
  };
};

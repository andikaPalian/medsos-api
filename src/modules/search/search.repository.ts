import { Prisma } from "@prisma/client";
import { prisma } from "@core/config/database.config.js";

const userSearchSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  username: true,
  fullName: true,
  profilePic: true,
  isVerified: true,
});

export type UserSearchResult = Prisma.UserGetPayload<{ select: typeof userSearchSelect }>;

export interface SearchUsersParams {
  query: string;
  excludeUserId: string;
  take: number;
  skip: number;
}

export const createSearchRepository = (db = prisma) => ({
  searchUsers: async ({ query, excludeUserId, take, skip }: SearchUsersParams): Promise<UserSearchResult[]> => {
    return db.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { fullName: { contains: query, mode: "insensitive" } },
        ],
        NOT: { id: excludeUserId },
      },
      select: userSearchSelect,
      take,
      skip,
    });
  },
});

export type SearchRepository = ReturnType<typeof createSearchRepository>;
export const searchRepository = createSearchRepository();

import { NotFoundError } from "@core/errors/index.js";
import { clampLimit } from "@core/utils/pagination.util.js";
import { PAGINATION } from "@core/constants/app.constants.js";
import { searchRepository as defaultSearchRepo } from "./search.repository.js";
import { userRepository as defaultUserRepo } from "../user/user.repository.js";
import { SearchUsersQuery } from "./search.validation.js";

export const createSearchService = (
  searchRepo = defaultSearchRepo,
  userRepo = defaultUserRepo,
) => ({
  searchUsers: async (userId: string, { search = "", page = 1, limit = 10 }: SearchUsersQuery) => {
    const user = await userRepo.findUserById(userId);
    if (!user) throw new NotFoundError("User");

    const trimmed = search.trim();
    if (!trimmed) {
      return { users: [], page };
    }

    const pageNum = Math.max(1, page);
    const limitNum = clampLimit(limit, PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (pageNum - 1) * limitNum;

    const users = await searchRepo.searchUsers({
      query: trimmed,
      excludeUserId: userId,
      take: limitNum,
      skip,
    });

    return { users, page: pageNum };
  },
});

export type SearchService = ReturnType<typeof createSearchService>;
export const searchService = createSearchService();

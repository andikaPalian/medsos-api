import { Request, Response } from "express";
import { searchService as defaultSearchService } from "./search.service.js";
import { sendSuccess } from "@infra/http/helpers/response.helper.js";

export const createSearchController = (service = defaultSearchService) => ({
  searchUsers: async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { search, page, limit } = req.query;

    const result = await service.searchUsers(userId, {
      search: typeof search === "string" ? search : "",
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });

    sendSuccess(res, result, "Users fetched successfully");
  },
});

export type SearchController = ReturnType<typeof createSearchController>;
export const searchController = createSearchController();

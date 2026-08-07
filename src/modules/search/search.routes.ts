import { Router } from "express";
import { searchController } from "./search.controller.js";
import * as searchValidator from "./search.validation.js";
import { userAuth } from "@infra/http/middlewares/auth.middleware.js";
import { validate } from "@infra/http/middlewares/validate.middleware.js";

export const searchRouter = Router();

searchRouter.use(userAuth);

searchRouter.get(
  "/users",
  validate(searchValidator.searchUsersSchema),
  searchController.searchUsers,
);

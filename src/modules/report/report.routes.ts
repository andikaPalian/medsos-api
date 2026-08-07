import { Router } from "express";
import { reportController } from "./report.controller.js";
import * as reportValidator from "./report.validation.js";
import { userAuth } from "@infra/http/middlewares/auth.middleware.js";
import { validate } from "@infra/http/middlewares/validate.middleware.js";

export const reportRouter = Router();

reportRouter.use(userAuth);

reportRouter.post(
  "/:postId/report",
  validate(reportValidator.reportPostSchema),
  reportController.reportPost,
);

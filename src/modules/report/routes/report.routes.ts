import { Router } from "express";
import * as reportController from "../controllers/report.controller.js";
import * as reportValidator from "../validations/report.validator.js";
import { userAuth } from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validator.js";

export const reportRouter = Router();

reportRouter.use(userAuth);

reportRouter.post(
  "/:postId/report",
  validate(reportValidator.reportPostSchema),
  reportController.reportPost,
);

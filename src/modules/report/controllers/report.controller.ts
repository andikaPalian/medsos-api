import { Response } from "express";
import * as reportService from "../services/report.service.js";
import { authHandler } from "../../../common/utils/authHandler.js";
import { AuthenticatedRequest } from "../../../common/types/authenticated-request.js";
import { ReportPostBody, ReportPostParams } from "../validations/report.validator.js";

export const reportPost = authHandler(
  async (
    req: AuthenticatedRequest<ReportPostParams, any, ReportPostBody, any, any>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user.id;
    const { postId } = req.params;
    const { reason } = req.body;

    await reportService.reportPost({ reporterId: userId, postId, reason });

    res.status(200).json({
      success: true,
      message: "Post reported successfully",
    });
  },
);

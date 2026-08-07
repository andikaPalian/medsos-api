import { Request, Response } from "express";
import { reportService as defaultReportService } from "./report.service.js";
import { sendEmptySuccess } from "@infra/http/helpers/response.helper.js";
import { ReportPostBody, ReportPostParams } from "./report.validation.js";

export const createReportController = (service = defaultReportService) => ({
  reportPost: async (
    req: Request<ReportPostParams, unknown, ReportPostBody>,
    res: Response,
  ): Promise<void> => {
    const userId = req.user!.id;
    const { postId } = req.params;
    const { reason } = req.body;

    await service.reportPost({ reporterId: userId, postId, reason });
    sendEmptySuccess(res, "Post reported successfully");
  },
});

export type ReportController = ReturnType<typeof createReportController>;
export const reportController = createReportController();

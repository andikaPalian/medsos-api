import { handlePrismaError } from "../../../common/utils/prismaErrorHandler.js";
import { prisma } from "../../../config/client.js";

interface CreateReportArgs {
  reporterId: string;
  postId: string;
  reason: string;
}

export const createReport = async ({
  reporterId,
  postId,
  reason,
}: CreateReportArgs): Promise<void> => {
  try {
    await prisma.report.create({
      data: {
        reporterId,
        postId,
        reason,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
};

import { z } from "zod";
import { postIdParamSchema } from "../../../common/validation/shared.validation.js";

export const likeActionSchema = z.object({
  params: postIdParamSchema,
});

export type LikeActionParams = z.infer<typeof likeActionSchema>["params"];

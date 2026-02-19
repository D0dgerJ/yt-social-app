import { z } from "zod";

export const modReviewReportSchema = z.object({
  reason: z.string().trim().min(2, "Reason is required").max(200, "Reason is too long"),
});

export const modHideCommentSchema = z.object({
  reason: z.string().trim().min(2, "Reason is required").max(200, "Reason is too long"),
});

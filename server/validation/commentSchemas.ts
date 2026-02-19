import { z } from "zod";

export const createCommentSchema = z.object({
  postId: z.number({ invalid_type_error: "postId must be a number" }),
  content: z.string().min(1, "Comment content is required"),
});
export const reportCommentSchema = z.object({
  reason: z.string().trim().min(2, "Reason is required").max(64, "Reason is too long"),
  details: z
    .string()
    .trim()
    .max(500, "Details is too long")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type ReportCommentDto = z.infer<typeof reportCommentSchema>;
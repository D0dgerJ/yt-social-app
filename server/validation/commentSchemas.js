import { z } from "zod";

export const createCommentSchema = z.object({
  postId: z.number({ invalid_type_error: "postId must be a number" }),
  content: z.string().min(1, "Comment content is required"),
});
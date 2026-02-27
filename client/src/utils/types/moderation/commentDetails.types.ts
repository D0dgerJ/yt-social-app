import type { ReportStatus } from "@/utils/api/mod.api";

export type ModerationUserRef = { id: number; username: string };

export type ModerationCommentView = {
  id: number;
  postId: number;
  userId: number;
  content: string;

  images: string[];
  videos: string[];
  files: string[];

  status: "ACTIVE" | "HIDDEN" | "DELETED" | string;

  visibility?: "PUBLIC" | "SHADOW_HIDDEN" | string;
  shadowHiddenAt?: string | null;
  shadowHiddenReason?: string | null;
  shadowHiddenById?: number | null;
  shadowHiddenBy?: ModerationUserRef | null;

  createdAt: string;

  user?: ModerationUserRef | null;
};

export type ModerationCommentReportLite = {
  id: number;
  commentId: number;
  reason: string;
  details?: string | null;
  status: ReportStatus;
  createdAt: string;
  reporter?: ModerationUserRef | null;
};

export type ModerationCommentReportFull = {
  id: number;
  commentId: number;
  reason: string;
  details?: string | null;

  status: ReportStatus;
  createdAt: string;

  reporter?: ModerationUserRef | null;
  reviewedBy?: ModerationUserRef | null;

  comment: ModerationCommentView;
};

export type CommentCaseCounts = Record<ReportStatus, number>;
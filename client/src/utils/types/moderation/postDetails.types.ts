import type { ReportStatus } from "@/utils/api/mod.api";

export type ModerationPostView = {
  id: number;
  userId: number;
  desc: string | null;
  status: string;
  createdAt: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  tags?: string[];
  location?: string | null;
};

export type ReportItem = {
  id: number;
  postId: number;
  reporterId: number;
  reason: string;
  message: string | null;
  status: ReportStatus;
  createdAt: string;
  reviewedAt: string | null;
  reporter?: { id: number; username: string };
  reviewedBy?: { id: number; username: string };
  post?: ModerationPostView;
};

export type FullReport = {
  id: number;
  postId: number;
  reporterId: number;
  reason: string;
  message: string | null;
  status: ReportStatus;
  createdAt: string;
  reviewedAt: string | null;
  reporter?: { id: number; username: string };
  reviewedBy?: { id: number; username: string };
  post?: ModerationPostView;
};

export type DraftDecision = "VIOLATION" | "NO_VIOLATION" | "";

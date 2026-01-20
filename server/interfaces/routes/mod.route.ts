import { Router } from "express";
import { ModerationActionType, ModerationTargetType } from "@prisma/client";

import {
  hidePost,
  softDeletePost,
  unhidePost,
} from "../../application/services/moderation/moderatePost.ts";

import { hardDeletePost } from "../../application/services/moderation/hardDeletePost.ts";

import { logModerationAction } from "../../application/services/moderation/logModerationAction.ts";
import { authMiddleware } from "../../infrastructure/middleware/authMiddleware.ts";
import { requireModerator, requireAdmin } from "../../infrastructure/middleware/requireRole.ts";

const router = Router();

router.get("/ping", authMiddleware, requireModerator, (req, res) => {
  res.status(200).json({
    ok: true,
    message: "mod pong",
    user: { id: req.user?.id, role: req.user?.role },
  });
});

router.post("/log-test", authMiddleware, requireModerator, async (req, res) => {
  const entry = await logModerationAction({
    actorId: req.user?.id ?? null,
    actionType: ModerationActionType.NOTE,
    targetType: ModerationTargetType.OTHER,
    targetId: "mod.log-test",
    reason: "Step 3 smoke test",
    metadata: { ip: req.ip, ua: req.get("user-agent") },
  });

  res.status(201).json({ ok: true, entry });
});

router.post("/posts/:id/hide", authMiddleware, requireModerator, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!Number.isFinite(postId) || postId <= 0) {
      res.status(400).json({ message: "Invalid post id" });
      return;
    }

    const reason = typeof req.body?.reason === "string" ? req.body.reason : undefined;

    const post = await hidePost({ actorId: req.user!.id, postId, reason });
    res.status(200).json({ ok: true, post });
  } catch (err: any) {
    if (err?.code === "P2025") {
      res.status(404).json({ message: "Post not found" });
      return;
    }
    console.error("[mod.posts.hide] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/posts/:id/unhide", authMiddleware, requireModerator, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!Number.isFinite(postId) || postId <= 0) {
      res.status(400).json({ message: "Invalid post id" });
      return;
    }

    const reason = typeof req.body?.reason === "string" ? req.body.reason : undefined;

    const post = await unhidePost({ actorId: req.user!.id, postId, reason });
    res.status(200).json({ ok: true, post });
  } catch (err: any) {
    if (err?.code === "P2025") {
      res.status(404).json({ message: "Post not found" });
      return;
    }
    console.error("[mod.posts.unhide] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * SOFT DELETE: ADMIN+
 * Явно называем soft-delete, чтобы не путаться с hard-delete.
 */
router.post("/posts/:id/soft-delete", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!Number.isFinite(postId) || postId <= 0) {
      res.status(400).json({ message: "Invalid post id" });
      return;
    }

    const reason = typeof req.body?.reason === "string" ? req.body.reason : undefined;

    const post = await softDeletePost({ actorId: req.user!.id, postId, reason });
    res.status(200).json({ ok: true, post });
  } catch (err: any) {
    if (err?.code === "P2025") {
      res.status(404).json({ message: "Post not found" });
      return;
    }
    console.error("[mod.posts.soft-delete] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * HARD DELETE: ADMIN+
 * Полностью удаляем пост + зависимости, и пишем снапшот в ModerationOutbox.
 */
router.delete("/posts/:id/hard-delete", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const postId = Number(req.params.id);
    if (!Number.isFinite(postId) || postId <= 0) {
      res.status(400).json({ message: "Invalid post id" });
      return;
    }

    const reason = typeof req.body?.reason === "string" ? req.body.reason : undefined;

    const result = await hardDeletePost({ actorId: req.user!.id, postId, reason });
    res.status(200).json({ ok: true, ...result });
  } catch (err: any) {
    if (err?.code === "P2025") {
      res.status(404).json({ message: "Post not found" });
      return;
    } 
    console.error("[mod.posts.hard-delete] error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
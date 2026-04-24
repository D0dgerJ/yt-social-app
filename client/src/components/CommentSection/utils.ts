import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPostComments,
  createComment,
  toggleCommentLike,
  deleteComment,
  updateComment,
} from "../../utils/api/comment.api";
import { Comment } from "./types";

function isNestedResponse(res: any): res is Comment[] {
  return Array.isArray(res) && (res.length === 0 || Array.isArray(res[0]?.replies));
}

function getApiErrorMessage(err: any, fallback: string) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}

function buildCommentTree(flat: Comment[], parentId: number | null = null): Comment[] {
  return flat
    .filter((c) => c.parentId === parentId)
    .map((comment) => ({
      ...comment,
      replies: buildCommentTree(flat, comment.id),
    }));
}

function normalizeComments(res: any): Comment[] {
  // Сервер уже вернул дерево
  if (isNestedResponse(res)) return res as Comment[];

  // Старый/плоский формат -> собираем дерево любой глубины
  const flat = (Array.isArray(res) ? res : []) as Comment[];
  return buildCommentTree(flat, null);
}

function flattenCommentTree(nodes: Comment[]): Comment[] {
  const all: Comment[] = [];

  const walk = (list: Comment[]) => {
    for (const item of list) {
      all.push(item);
      if (item.replies?.length) {
        walk(item.replies);
      }
    }
  };

  walk(nodes);
  return all;
}

function mapCommentTree(
  nodes: Comment[],
  updater: (comment: Comment) => Comment
): Comment[] {
  return nodes.map((comment) => {
    const next = updater(comment);

    if (next.replies?.length) {
      return {
        ...next,
        replies: mapCommentTree(next.replies, updater),
      };
    }

    return next;
  });
}

function removeCommentFromTree(nodes: Comment[], commentId: number): Comment[] {
  return nodes
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: comment.replies?.length
        ? removeCommentFromTree(comment.replies, commentId)
        : [],
    }));
}

export const useComments = (postId: number) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatAll = useMemo(() => flattenCommentTree(comments ?? []), [comments]);

  const fetchComments = useCallback(async () => {
    if (!Number.isFinite(postId) || postId <= 0) return;

    try {
      setLoading(true);
      setError(null);

      const res = await getPostComments(postId);
      setComments(normalizeComments(res));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to fetch comments"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string, imageFile?: File | null) => {
    try {
      await createComment({
        postId,
        content,
        images: [],
      });

      fetchComments();
    } catch (err) {
      console.error("Failed to post comment", err);
      setError(getApiErrorMessage(err, "Failed to post comment"));
    }
  };

  const addReply = async (parentId: number, content: string) => {
    try {
      await createComment({ postId, content, parentId });
      fetchComments();
    } catch (err) {
      console.error("Failed to reply", err);
      setError(getApiErrorMessage(err, "Failed to reply"));
    }
  };

  const likeComment = async (commentId: number) => {
    const before = flatAll.find((c) => c.id === commentId);

    if (before) {
      setComments((prev) =>
        mapCommentTree(prev, (comment) => {
          if (comment.id !== commentId) return comment;

          const likes = (comment._count?.likes ?? 0) + 1;
          return {
            ...comment,
            _count: { ...(comment._count ?? {}), likes },
          };
        })
      );
    }

    try {
      const result = await toggleCommentLike(commentId);

      if (typeof result?.liked === "boolean" && before) {
        setComments((prev) =>
          mapCommentTree(prev, (comment) => {
            if (comment.id !== commentId) return comment;

            const base = comment._count?.likes ?? 0;
            const likes = result.liked ? base : Math.max(0, base - 1);

            return {
              ...comment,
              _count: { ...(comment._count ?? {}), likes },
            };
          })
        );
      }

      fetchComments();
    } catch (err) {
      console.error("Failed to like comment", err);
      setError(getApiErrorMessage(err, "Failed to like comment"));
      fetchComments();
    }
  };

  const deleteCommentById = async (commentId: number) => {
    setComments((prev) => removeCommentFromTree(prev, commentId));

    try {
      await deleteComment(commentId);
      fetchComments();
    } catch (err) {
      console.error("Failed to delete comment", err);
      setError(getApiErrorMessage(err, "Failed to delete comment"));
      fetchComments();
    }
  };

  const updateCommentById = async (commentId: number, content: string) => {
    setComments((prev) =>
      mapCommentTree(prev, (comment) =>
        comment.id === commentId ? { ...comment, content } : comment
      )
    );

    try {
      await updateComment({ commentId, content });
      fetchComments();
    } catch (err) {
      console.error("Failed to update comment", err);
      setError(getApiErrorMessage(err, "Failed to update comment"));
      fetchComments();
    }
  };

  return {
    comments,
    loading,
    error,
    fetchComments,
    addComment,
    addReply,
    likeComment,
    deleteCommentById,
    updateCommentById,
  };
};
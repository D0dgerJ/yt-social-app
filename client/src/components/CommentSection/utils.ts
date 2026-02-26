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

function normalizeComments(res: any): Comment[] {
  // ✅ Новый формат: сервер уже возвращает корневые с вложенными replies
  if (isNestedResponse(res)) return res as Comment[];

  // ✅ Старый формат: плоский список — собираем replies вручную
  const flat = (Array.isArray(res) ? res : []) as Comment[];
  const topLevel = flat.filter((c) => c.parentId === null);
  const replies = flat.filter((c) => c.parentId !== null);

  return topLevel.map((parent) => ({
    ...parent,
    replies: replies.filter((r) => r.parentId === parent.id),
  }));
}

export const useComments = (postId: number) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatAll = useMemo(() => {
    const roots = comments ?? [];
    const all: Comment[] = [];
    for (const c of roots) {
      all.push(c);
      if (c.replies?.length) all.push(...c.replies);
    }
    return all;
  }, [comments]);

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
      // ⚠️ ВАЖНО:
      // Нельзя отправлять URL.createObjectURL(file) на сервер — это локальный blob: URL.
      // Здесь пока игнорируем imageFile, пока не подключим upload и не получим реальный URL.
      await createComment({
        postId,
        content,
        images: [],
      });

      // после успешного — синкаемся
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
    // ✅ оптимистично увеличим/уменьшим лайк (если есть поле liked — можно будет точнее)
    const before = flatAll.find((c) => c.id === commentId);
    if (before) {
      setComments((prev) =>
        prev.map((root) => {
          if (root.id === commentId) {
            const likes = (root._count?.likes ?? 0) + 1;
            return { ...root, _count: { ...(root._count ?? {}), likes } };
          }
          if (root.replies?.length) {
            const replies = root.replies.map((r) => {
              if (r.id !== commentId) return r;
              const likes = (r._count?.likes ?? 0) + 1;
              return { ...r, _count: { ...(r._count ?? {}), likes } };
            });
            return { ...root, replies };
          }
          return root;
        })
      );
    }

    try {
      const result = await toggleCommentLike(commentId);

      // если бек возвращает liked:boolean — поправим оптимистику
      if (typeof result?.liked === "boolean" && before) {
        setComments((prev) =>
          prev.map((root) => {
            const patch = (c: Comment) => {
              if (c.id !== commentId) return c;
              const base = c._count?.likes ?? 0;
              // мы уже +1 сделали, поэтому если liked=false — вернём обратно
              const likes = result.liked ? base : Math.max(0, base - 1);
              return { ...c, _count: { ...(c._count ?? {}), likes } };
            };

            if (root.id === commentId) return patch(root);
            if (root.replies?.length) return { ...root, replies: root.replies.map(patch) };
            return root;
          })
        );
      }

      // досинкаемся на всякий (особенно если лайк снят)
      fetchComments();
    } catch (err) {
      console.error("Failed to like comment", err);
      setError(getApiErrorMessage(err, "Failed to like comment"));

      // откатим оптимистику
      fetchComments();
    }
  };

  const deleteCommentById = async (commentId: number) => {
    // ✅ оптимистично уберём из UI
    setComments((prev) =>
      prev
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: (c.replies ?? []).filter((r) => r.id !== commentId),
        }))
    );

    try {
      await deleteComment(commentId);
      // синк после удаления
      fetchComments();
    } catch (err) {
      console.error("Failed to delete comment", err);
      setError(getApiErrorMessage(err, "Failed to delete comment"));
      // откат/синк
      fetchComments();
    }
  };

  const updateCommentById = async (commentId: number, content: string) => {
    // ✅ оптимистично обновим текст
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) return { ...c, content };
        if (c.replies?.length) {
          return {
            ...c,
            replies: c.replies.map((r) => (r.id === commentId ? { ...r, content } : r)),
          };
        }
        return c;
      })
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
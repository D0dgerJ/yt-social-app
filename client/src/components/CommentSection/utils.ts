import { useCallback, useState, useEffect } from "react";
import {
  getPostComments,
  createComment,
  toggleCommentLike,
  deleteComment,
  updateComment,
} from "../../utils/api/comment.api";
import { Comment } from "./types";

export const useComments = (postId: number) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getPostComments(postId);
      const topLevel = res.filter((c: Comment) => c.parentId === null);
      const replies = res.filter((c: Comment) => c.parentId !== null);

      const commentsWithReplies = topLevel.map((parent: Comment) => ({
        ...parent,
        replies: replies.filter((r: Comment) => r.parentId === parent.id),
      }));

      setComments(commentsWithReplies);
    } catch (err) {
      setError("Failed to fetch comments");
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
        images: imageFile ? [URL.createObjectURL(imageFile)] : [],
      });
      fetchComments();
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  };

  const addReply = async (parentId: number, content: string) => {
    try {
      await createComment({ postId, content, parentId });
      fetchComments();
    } catch (err) {
      console.error("Failed to reply", err);
    }
  };

  const likeComment = async (commentId: number) => {
    try {
      await toggleCommentLike(commentId);
      fetchComments();
    } catch (err) {
      console.error("Failed to like comment", err);
    }
  };

  const deleteCommentById = async (commentId: number) => {
    try {
      await deleteComment(commentId);
      fetchComments();
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };

  const updateCommentById = async (commentId: number, content: string) => {
    try {
      await updateComment({ commentId, content });
      fetchComments();
    } catch (err) {
      console.error("Failed to update comment", err);
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

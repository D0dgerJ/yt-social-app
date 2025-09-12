import { useCallback, useEffect, useMemo, useState } from "react";
import { toggleLike } from "../utils/api/post.api";

export type LikeEntity = number | string | { userId: number | string };

export type UsePostLikesOptions = {
  postId: number;
  likes?: LikeEntity[];
  initialCount?: number;
  currentUserId?: number;
  onAfterToggle?: (liked: boolean) => void;
};

export type UsePostLikesReturn = {
  count: number;
  isLiked: boolean;
  loading: boolean;
  toggle: () => Promise<boolean | void>;
};

function normalizeLikes(likes?: LikeEntity[]): number[] {
  if (!Array.isArray(likes)) return [];
  return likes
    .map((l) => {
      if (typeof l === "number" || typeof l === "string") return Number(l);
      if (l && typeof l === "object" && "userId" in l) return Number((l as any).userId);
      return NaN;
    })
    .filter((n) => Number.isFinite(n)) as number[];
}

export default function usePostLikes(opts: UsePostLikesOptions): UsePostLikesReturn {
  const { postId, likes, initialCount, currentUserId, onAfterToggle } = opts;

  const baseCount = useMemo(() => {
    if (typeof initialCount === "number") return initialCount;
    const ids = normalizeLikes(likes);
    return ids.length;
  }, [initialCount, likes]);

  const [count, setCount] = useState<number>(baseCount);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const ids = normalizeLikes(likes);
    const uid = Number(currentUserId);
    setIsLiked(uid > 0 && ids.includes(uid));
  }, [likes, currentUserId]);

  useEffect(() => {
    setCount(baseCount);
  }, [baseCount, postId]);

  const toggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await toggleLike(postId) as any;
      const liked: boolean = typeof res === "boolean" ? res : !!res?.liked;

      setIsLiked(liked);
      setCount((prev) => (liked ? prev + 1 : Math.max(prev - 1, 0)));
      onAfterToggle?.(liked);
      return liked;
    } finally {
      setLoading(false);
    }
  }, [postId, loading, onAfterToggle]);

  return { count, isLiked, loading, toggle };
}

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getUserFriends } from "../utils/api/user.api";

export interface Friend {
  id: number;
  username: string;
  profilePicture: string;
}

type UseFriendsOptions = {
  enabled?: boolean;
  initialData?: Friend[];
  ttlMs?: number;
};

type CacheEntry = { data: Friend[]; ts: number };
const friendsCache = new Map<number, CacheEntry>();

export function useFriends(userId?: number, opts: UseFriendsOptions = {}) {
  const { enabled = true, initialData, ttlMs = 30_000 } = opts;

  const [data, setData] = useState<Friend[]>(() => initialData ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const hasValidCache = useCallback((id: number) => {
    const e = friendsCache.get(id);
    return !!e && Date.now() - e.ts < ttlMs && Array.isArray(e.data);
  }, [ttlMs]);

  const readCache  = useCallback((id: number) => friendsCache.get(id)?.data ?? null, []);
  const writeCache = useCallback((id: number, v: Friend[]) => {
    friendsCache.set(id, { data: v, ts: Date.now() });
  }, []);

  const fetchFriends = useCallback(async (id: number) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    try {
      const result = await getUserFriends(id);
      if (!ctrl.signal.aborted) {
        const normalized: Friend[] = (result ?? []).map((f: any) => ({
          id: Number(f.id),
          username: String(f.username ?? ""),
          profilePicture: typeof f.profilePicture === "string" ? f.profilePicture : "",
        }));
        setData(normalized);
        writeCache(id, normalized);
      }
    } catch (e) {
      if (!ctrl.signal.aborted) setError(e as Error);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [writeCache]);

  const refetch = useCallback(() => {
    if (typeof userId !== "number") return;
    return fetchFriends(userId);
  }, [userId, fetchFriends]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof userId !== "number") return;

    if (hasValidCache(userId)) {
      const cached = readCache(userId)!;
      setData(cached);
      setLoading(false);
      setError(null);
      return;
    }
    fetchFriends(userId);

    return () => abortRef.current?.abort();
  }, [userId, enabled, hasValidCache, readCache, fetchFriends]);

  return useMemo(() => ({ data, loading, error, refetch }), [data, loading, error, refetch]);
}

export default useFriends;

import { useCallback, useEffect, useMemo, useState } from "react";
import { getModerationUsers } from "@/utils/api/mod.api";
import type {
  GetModerationUsersResponse,
  ModerationUsersOrder,
  ModerationUsersSortBy,
  ModerationUsersStatusFilter,
  ModerationUsersListItem,
  ModerationUsersPagination,
} from "@/utils/types/moderation/moderationUsers.types";
import { useDebouncedValue } from "./useDebouncedValue";

type UseModerationUsersState = {
  items: ModerationUsersListItem[];
  pagination: ModerationUsersPagination;

  q: string;
  status: ModerationUsersStatusFilter;
  sortBy: ModerationUsersSortBy;
  order: ModerationUsersOrder;

  isLoading: boolean;
  error: string | null;
};

const DEFAULT_PAGINATION: ModerationUsersPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

export function useModerationUsers(initial?: {
  page?: number;
  limit?: number;
  status?: ModerationUsersStatusFilter;
  sortBy?: ModerationUsersSortBy;
  order?: ModerationUsersOrder;
}) {
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q.trim(), 350);

  const [status, setStatus] = useState<ModerationUsersStatusFilter>(initial?.status ?? "ALL");
  const [sortBy, setSortBy] = useState<ModerationUsersSortBy>(initial?.sortBy ?? "id");
  const [order, setOrder] = useState<ModerationUsersOrder>(initial?.order ?? "desc");

  const [page, setPage] = useState<number>(initial?.page ?? 1);
  const [limit, setLimit] = useState<number>(initial?.limit ?? 20);

  const [items, setItems] = useState<ModerationUsersListItem[]>([]);
  const [pagination, setPagination] = useState<ModerationUsersPagination>({
    ...DEFAULT_PAGINATION,
    page,
    limit,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // чтобы запросы не перезапускались от случайных inline объектов
  const queryKey = useMemo(
    () => ({
      q: debouncedQ || undefined,
      status,
      sortBy,
      order,
      page,
      limit,
    }),
    [debouncedQ, status, sortBy, order, page, limit]
  );

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = (await getModerationUsers(queryKey)) as GetModerationUsersResponse;

      setItems(data.items ?? []);
      setPagination(data.pagination ?? { ...DEFAULT_PAGINATION, page, limit });
    } catch (e: any) {
      const message =
        typeof e?.response?.data?.message === "string"
          ? e.response.data.message
          : typeof e?.message === "string"
            ? e.message
            : "Failed to load moderation users";

      setError(message);
      setItems([]);
      setPagination({ ...DEFAULT_PAGINATION, page, limit });
    } finally {
      setIsLoading(false);
    }
  }, [queryKey, page, limit]);

  // reset page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, status, sortBy, order]);

  // fetch on any query change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const actions = useMemo(() => {
    return {
      setQ: (value: string) => setQ(value),
      clearQ: () => setQ(""),

      setStatus: (v: ModerationUsersStatusFilter) => setStatus(v),
      setSortBy: (v: ModerationUsersSortBy) => setSortBy(v),
      setOrder: (v: ModerationUsersOrder) => setOrder(v),

      setPage: (p: number) => setPage(Math.max(1, Math.floor(p))),
      nextPage: () => setPage((p) => Math.max(1, p + 1)),
      prevPage: () => setPage((p) => Math.max(1, p - 1)),

      setLimit: (l: number) => setLimit(Math.min(100, Math.max(1, Math.floor(l)))),

      refetch: fetchUsers,
      reset: () => {
        setQ("");
        setStatus(initial?.status ?? "ALL");
        setSortBy(initial?.sortBy ?? "id");
        setOrder(initial?.order ?? "desc");
        setPage(initial?.page ?? 1);
        setLimit(initial?.limit ?? 20);
      },
    };
  }, [fetchUsers, initial?.limit, initial?.order, initial?.page, initial?.sortBy, initial?.status]);

  const state: UseModerationUsersState = {
    items,
    pagination,

    q,
    status,
    sortBy,
    order,

    isLoading,
    error,
  };

  return { state, actions };
}

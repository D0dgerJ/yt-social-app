import { useContext, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar/Navbar";
import Sidebar from "@/components/Sidebar/Sidebar";
import { AuthContext } from "@/context/AuthContext";

import { useModerationUsers } from "@/hooks/moderation/useModerationUsers";
import type {
  ModerationUsersOrder,
  ModerationUsersSortBy,
  ModerationUsersStatusFilter,
} from "@/utils/types/moderation/moderationUsers.types";
import UserModerationModal from "@/components/Moderation/Users/UserModerationModal/UserModerationModal";

import styles from "./ModerationUsers.module.scss";

const ALLOWED = new Set(["MODERATOR", "ADMIN", "OWNER"]);

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function statusLabel(
  isBanned: boolean,
  isRestricted: boolean
): { text: string; tone: "danger" | "warn" | "ok" } {
  if (isBanned) return { text: "BANNED", tone: "danger" };
  if (isRestricted) return { text: "RESTRICTED", tone: "warn" };
  return { text: "OK", tone: "ok" };
}

export default function ModerationUsers() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const role = (user as any)?.role;
    if (!user || !ALLOWED.has(role)) navigate("/");
  }, [user, navigate]);

  const { state, actions } = useModerationUsers({ limit: 20 });

  const onChangeStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    actions.setStatus(e.target.value as ModerationUsersStatusFilter);
  };

  const onChangeSortBy = (e: React.ChangeEvent<HTMLSelectElement>) => {
    actions.setSortBy(e.target.value as ModerationUsersSortBy);
  };

  const onChangeOrder = (e: React.ChangeEvent<HTMLSelectElement>) => {
    actions.setOrder(e.target.value as ModerationUsersOrder);
  };

  const canPrev = state.pagination.page > 1;
  const canNext = state.pagination.page < state.pagination.totalPages;

  const [params, setParams] = useSearchParams();
  const openId = Number(params.get("open"));

  // --- Auto refetch after closing modal ---
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const isOpen = Number.isFinite(openId) && openId > 0;

    if (isOpen) {
      wasOpenRef.current = true;
      return;
    }

    // if it was open and now closed -> refetch list
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      actions.refetch();
    }
  }, [openId, actions]);

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <Sidebar />

        <div className={styles.main}>
          <div className={styles.top}>
            <div className={styles.titleRow}>
              <h2 className={styles.title}>Moderation · Users</h2>

              <div className={styles.right}>
                <button
                  className={styles.btn}
                  type="button"
                  onClick={() => navigate("/moderation")}
                >
                  ← Back
                </button>
              </div>
            </div>

            <div className={styles.controls}>
              <div className={styles.search}>
                <input
                  className={styles.input}
                  value={state.q}
                  onChange={(e) => actions.setQ(e.target.value)}
                  placeholder="Search by ID / username / email..."
                />
                {state.q.length > 0 && (
                  <button
                    className={styles.clearBtn}
                    type="button"
                    onClick={() => actions.clearQ()}
                    aria-label="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className={styles.filters}>
                <label className={styles.label}>
                  Status
                  <select
                    className={styles.select}
                    value={state.status}
                    onChange={onChangeStatus}
                  >
                    <option value="ALL">All</option>
                    <option value="BANNED">Banned</option>
                    <option value="RESTRICTED">Restricted</option>
                    <option value="SANCTIONED">Has sanctions</option>
                    <option value="CLEAN">Clean</option>
                  </select>
                </label>

                <label className={styles.label}>
                  Sort
                  <select
                    className={styles.select}
                    value={state.sortBy}
                    onChange={onChangeSortBy}
                  >
                    <option value="id">ID</option>
                    <option value="username">Username</option>
                    <option value="email">Email</option>
                    <option value="role">Role</option>
                  </select>
                </label>

                <label className={styles.label}>
                  Order
                  <select
                    className={styles.select}
                    value={state.order}
                    onChange={onChangeOrder}
                  >
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                  </select>
                </label>

                <label className={styles.label}>
                  Per page
                  <select
                    className={styles.select}
                    value={state.pagination.limit}
                    onChange={(e) => actions.setLimit(Number(e.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>

                <button
                  className={styles.btnSecondary}
                  type="button"
                  onClick={() => actions.refetch()}
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                Users
                <span className={styles.count}>
                  ({state.pagination.total})
                </span>
              </div>

              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  type="button"
                  disabled={!canPrev}
                  onClick={() => actions.prevPage()}
                >
                  Prev
                </button>
                <div className={styles.pageInfo}>
                  Page <b>{state.pagination.page}</b> /{" "}
                  {state.pagination.totalPages}
                </div>
                <button
                  className={styles.pageBtn}
                  type="button"
                  disabled={!canNext}
                  onClick={() => actions.nextPage()}
                >
                  Next
                </button>
              </div>
            </div>

            {state.error && (
              <div className={styles.error}>Error: {state.error}</div>
            )}

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thId}>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th className={styles.thRole}>Role</th>
                    <th className={styles.thStatus}>Status</th>
                    <th className={styles.thSanctions}>Active sanctions</th>
                    <th className={styles.thLast}>Last sanction</th>
                  </tr>
                </thead>

                <tbody>
                  {state.isLoading ? (
                    <tr>
                      <td className={styles.loading} colSpan={7}>
                        Loading...
                      </td>
                    </tr>
                  ) : state.items.length === 0 ? (
                    <tr>
                      <td className={styles.empty} colSpan={7}>
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    state.items.map((u) => {
                      const s = statusLabel(u.isBanned, u.isRestricted);

                      return (
                        <tr
                          key={u.id}
                          className={styles.row}
                          onClick={() =>
                            navigate(`/moderation/users?open=${u.id}`)
                          }
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              navigate(`/moderation/users?open=${u.id}`);
                          }}
                        >
                          <td className={styles.mono}>#{u.id}</td>
                          <td className={styles.userCell}>
                            <div className={styles.userName}>{u.username}</div>
                          </td>
                          <td className={styles.muted}>{u.email}</td>
                          <td className={styles.mono}>{u.role}</td>
                          <td>
                            <span
                              className={`${styles.badge} ${
                                styles[`badge_${s.tone}`]
                              }`}
                            >
                              {s.text}
                            </span>
                          </td>
                          <td className={styles.mono}>
                            {u.activeSanctions.length
                              ? u.activeSanctions
                                  .map((x) => x.type)
                                  .join(", ")
                              : "—"}
                          </td>
                          <td className={styles.muted}>
                            {formatDate(u.lastSanctionAt)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.footer}>
              <div className={styles.footerLeft}>
                Showing <b>{state.items.length}</b> of{" "}
                <b>{state.pagination.total}</b>
              </div>

              <div className={styles.footerRight}>
                <button
                  className={styles.pageBtn}
                  type="button"
                  disabled={!canPrev}
                  onClick={() => actions.prevPage()}
                >
                  Prev
                </button>
                <button
                  className={styles.pageBtn}
                  type="button"
                  disabled={!canNext}
                  onClick={() => actions.nextPage()}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className={styles.hint}>
            Tip: you can paste a numeric ID to jump quickly (example:{" "}
            <span className={styles.mono}>123</span>).
          </div>
        </div>
      </div>

      {Number.isFinite(openId) && openId > 0 && (
        <UserModerationModal
          userId={openId}
          onClose={() => {
            setParams((prev) => {
              const p = new URLSearchParams(prev);
              p.delete("open");
              return p;
            });
          }}
        />
      )}
    </>
  );
}

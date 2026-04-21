import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar/Navbar";
import Sidebar from "@/components/Sidebar/Sidebar";
import { AuthContext } from "@/context/AuthContext";
import {
  getModerationUsers,
  updateModerationUserRole,
  type AssignableUserRole,
} from "@/utils/api/mod.api";
import styles from "./ModerationUsers.module.scss";

type UserRole = "USER" | "MODERATOR" | "ADMIN" | "OWNER";

type ModerationRoleUser = {
  id: number;
  username: string;
  email: string;
  role: UserRole;
};

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as any).response === "object" &&
    (error as any).response !== null &&
    "data" in (error as any).response &&
    typeof (error as any).response.data === "object" &&
    (error as any).response.data !== null &&
    "message" in (error as any).response.data &&
    typeof (error as any).response.data.message === "string"
  ) {
    return (error as any).response.data.message;
  }

  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export default function ModerationRoles() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [items, setItems] = useState<ModerationRoleUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [q, setQ] = useState("");

  const currentUserId = Number((user as any)?.id ?? 0);
  const currentRole = (user as any)?.role;
  const isOwner = currentRole === "OWNER";

  useEffect(() => {
    if (!user || currentRole !== "OWNER") {
      navigate("/");
    }
  }, [user, currentRole, navigate]);

  const loadUsers = async (silent = false) => {
    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError("");
      setSuccess("");

      const response = await getModerationUsers({
        page: 1,
        limit: 100,
        sortBy: "id",
        order: "desc",
        status: "ALL",
      });

      const mapped = (response.items ?? []).map((item: any) => ({
        id: item.id,
        username: item.username,
        email: item.email,
        role: item.role as UserRole,
      }));

      setItems(mapped);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      void loadUsers();
    }
  }, [isOwner]);

  const filteredItems = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;

    return items.filter((item) => {
      return (
        String(item.id).includes(query) ||
        item.username.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.role.toLowerCase().includes(query)
      );
    });
  }, [items, q]);

  const handleChangeRole = async (targetUserId: number, role: AssignableUserRole) => {
    try {
      setUpdatingUserId(targetUserId);
      setError("");
      setSuccess("");

      const response = await updateModerationUserRole(targetUserId, role);

      setItems((prev) =>
        prev.map((item) =>
          item.id === targetUserId
            ? {
                ...item,
                role: response.user.role,
              }
            : item
        )
      );

      setSuccess(`Role updated: user #${targetUserId} -> ${response.user.role}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <>
      <Navbar />

      <div className={styles.layout}>
        <div className={styles.sidebarWrapper}>
          <Sidebar />
        </div>

        <main className={styles.main}>
          <section className={styles.hero}>
            <div className={styles.heroText}>
              <h1 className={styles.title}>Role management</h1>
              <p className={styles.subtitle}>
                Only the owner can manually assign the USER,
                MODERATOR, and ADMIN roles.
              </p>
            </div>

            <div className={styles.heroActions}>
              <button
                className={styles.secondaryBtn}
                type="button"
                onClick={() => navigate("/moderation")}
              >
                Posts
              </button>

              <button
                className={styles.secondaryBtn}
                type="button"
                onClick={() => navigate("/moderation/users")}
              >
                Users
              </button>

              <button
                className={styles.secondaryBtn}
                type="button"
                onClick={() => navigate("/moderation/comments")}
              >
                Comments
              </button>

              <button
                className={styles.primaryBtn}
                type="button"
                onClick={() => navigate("/moderation/history")}
              >
                Open history
              </button>
            </div>
          </section>

          <section className={styles.filtersCard}>
            <div className={styles.topRow}>
              <div className={styles.search}>
                <input
                  className={styles.input}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by ID / username / email / role..."
                />
                {q.length > 0 && (
                  <button
                    className={styles.clearBtn}
                    type="button"
                    onClick={() => setQ("")}
                    aria-label="Clear"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                className={styles.secondaryBtn}
                type="button"
                onClick={() => void loadUsers(true)}
                disabled={isRefreshing || isLoading}
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                Users with roles access target
                <span className={styles.count}>({filteredItems.length})</span>
              </div>
            </div>

            {error && <div className={styles.error}>Error: {error}</div>}
            {success && <div className={styles.hint}>{success}</div>}

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thId}>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th className={styles.thRole}>Current role</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr>
                      <td className={styles.loading} colSpan={5}>
                        Loading...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td className={styles.empty} colSpan={5}>
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isSelf = item.id === currentUserId;
                      const isTargetOwner = item.role === "OWNER";
                      const isBusy = updatingUserId === item.id;
                      const isLocked = isSelf || isTargetOwner;

                      return (
                        <tr key={item.id}>
                          <td className={styles.mono}>#{item.id}</td>
                          <td className={styles.userCell}>
                            <div className={styles.userName}>{item.username}</div>
                          </td>
                          <td className={styles.muted}>{item.email}</td>
                          <td className={styles.mono}>{item.role}</td>
                          <td>
                            {isLocked ? (
                              <span className={styles.muted}>
                                {isSelf ? "You cannot change yourself" : "OWNER is locked"}
                              </span>
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  flexWrap: "wrap",
                                }}
                              >
                                <button
                                  className={styles.pageBtn}
                                  type="button"
                                  disabled={isBusy || item.role === "USER"}
                                  onClick={() => void handleChangeRole(item.id, "USER")}
                                >
                                  {isBusy ? "Updating..." : "Make USER"}
                                </button>

                                <button
                                  className={styles.pageBtn}
                                  type="button"
                                  disabled={isBusy || item.role === "MODERATOR"}
                                  onClick={() => void handleChangeRole(item.id, "MODERATOR")}
                                >
                                  {isBusy ? "Updating..." : "Make MODERATOR"}
                                </button>

                                <button
                                  className={styles.pageBtn}
                                  type="button"
                                  disabled={isBusy || item.role === "ADMIN"}
                                  onClick={() => void handleChangeRole(item.id, "ADMIN")}
                                >
                                  {isBusy ? "Updating..." : "Make ADMIN"}
                                </button>
                              </div>
                            )}
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
                Showing <b>{filteredItems.length}</b> users
              </div>

              <div className={styles.footerRight}>
                <button
                  className={styles.pageBtn}
                  type="button"
                  onClick={() => navigate("/moderation")}
                >
                  Back to moderation
                </button>
              </div>
            </div>
          </section>

          <div className={styles.hint}>
            The owner can assign the <span className={styles.mono}>USER</span>,{" "}
            <span className={styles.mono}>MODERATOR</span> and{" "}
            <span className={styles.mono}>ADMIN</span>. roles{" "}
            <span className={styles.mono}>OWNER</span> role cannot be assigned here.
          </div>
        </main>
      </div>
    </>
  );
}
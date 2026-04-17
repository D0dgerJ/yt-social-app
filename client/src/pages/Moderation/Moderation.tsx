import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import Navbar from "@/components/Navbar/Navbar";
import Sidebar from "@/components/Sidebar/Sidebar";
import ModerationTable from "@/components/Moderation/List/ModerationTable/ModerationTable";
import styles from "./Moderation.module.scss";

const ALLOWED = new Set(["MODERATOR", "ADMIN", "OWNER"]);

export default function Moderation() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isOwner = (user as any)?.role === "OWNER";

  useEffect(() => {
    const role = (user as any)?.role;
    if (!user || !ALLOWED.has(role)) navigate("/");
  }, [user, navigate]);

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
              <h1 className={styles.title}>Moderation</h1>
              <p className={styles.subtitle}>
                Управляй жалобами, комментариями, пользователями и историей действий
                модерации в одном месте.
              </p>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.secondaryBtn}
                type="button"
                onClick={() => navigate("/moderation/comments")}
              >
                Comments
              </button>

              <button
                className={styles.secondaryBtn}
                type="button"
                onClick={() => navigate("/moderation/users")}
              >
                Users
              </button>

              {isOwner && (
                <button
                  className={styles.secondaryBtn}
                  type="button"
                  onClick={() => navigate("/moderation/roles")}
                >
                  Roles
                </button>
              )}

              <button
                className={styles.primaryBtn}
                type="button"
                onClick={() => navigate("/moderation/history")}
              >
                Open history
              </button>
            </div>
          </section>

          <section className={styles.contentCard}>
            <ModerationTable />
          </section>
        </main>
      </div>
    </>
  );
}
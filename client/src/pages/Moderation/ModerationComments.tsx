import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import Navbar from "@/components/Navbar/Navbar";
import Sidebar from "@/components/Sidebar/Sidebar";
import ModerationCommentsTable from "@/components/Moderation/List/ModerationCommentsTable/ModerationCommentsTable";
import styles from "./Moderation.module.scss";

const ALLOWED = new Set(["MODERATOR", "ADMIN", "OWNER"]);

export default function ModerationComments() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

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
              <h1 className={styles.title}>Comments moderation</h1>
              <p className={styles.subtitle}>
                Просматривай жалобы на комментарии, оценивай контекст и переходи
                к детальному разбору каждого кейса.
              </p>
            </div>

            <div className={styles.actions}>
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
                className={styles.primaryBtn}
                type="button"
                onClick={() => navigate("/moderation/history")}
              >
                Open history
              </button>
            </div>
          </section>

          <section className={styles.contentCard}>
            <ModerationCommentsTable />
          </section>
        </main>
      </div>
    </>
  );
}
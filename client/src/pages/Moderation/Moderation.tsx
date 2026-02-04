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

  useEffect(() => {
    const role = (user as any)?.role;
    if (!user || !ALLOWED.has(role)) navigate("/");
  }, [user, navigate]);

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <Sidebar />

        <div className={styles.main}>
          <div className={styles.header}>
            <h2 className={styles.title}>Moderation</h2>

            <button
              className={styles.historyBtn}
              type="button"
              onClick={() => navigate("/moderation/history")}
            >
              Open history
            </button>
          </div>

          <ModerationTable />
        </div>
      </div>
    </>
  );
}
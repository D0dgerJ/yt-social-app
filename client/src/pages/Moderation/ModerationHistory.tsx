import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar/Navbar";
import Sidebar from "@/components/Sidebar/Sidebar";
import { AuthContext } from "@/context/AuthContext";
import {
  getModerationActions,
  type ModerationActionItem,
  type ModerationActionType,
  type ModerationTargetType,
} from "@/utils/api/mod.api";
import ModerationActionModal from "@/components/Moderation/Modals/ModerationActionModal";
import styles from "./ModerationHistory.module.scss";

const ALLOWED = new Set(["MODERATOR", "ADMIN", "OWNER"]);

const ACTION_TYPES: ModerationActionType[] = [
  "NOTE",
  "CONTENT_HIDDEN",
  "CONTENT_UNHIDDEN",
  "CONTENT_DELETED",
  "USER_RESTRICTED",
  "USER_UNRESTRICTED",
  "USER_BANNED",
  "USER_UNBANNED",
  "REPORT_CREATED",
  "BOT_AUTO_ACTION",
];

const TARGET_TYPES: ModerationTargetType[] = ["POST", "COMMENT", "USER", "STORY", "MESSAGE", "OTHER"];

function clip(text: string, max = 80) {
  const t = (text ?? "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function toPositiveInt(raw: unknown): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  if (i <= 0) return null;
  return i;
}

export default function ModerationHistory() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const role = (user as any)?.role;
    if (!user || !ALLOWED.has(role)) navigate("/");
  }, [user, navigate]);

  const [items, setItems] = useState<ModerationActionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [take, setTake] = useState(20);
  const [skip, setSkip] = useState(0);

  const [q, setQ] = useState("");
  const [actionType, setActionType] = useState<ModerationActionType | "">("");
  const [targetType, setTargetType] = useState<ModerationTargetType | "">("");

  const [selectedActionId, setSelectedActionId] = useState<number | null>(null);

  const page = useMemo(() => Math.floor(skip / take) + 1, [skip, take]);
  const pages = useMemo(() => Math.max(1, Math.ceil(total / take)), [total, take]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getModerationActions({
        take,
        skip,
        q: q.trim() || undefined,
        actionType: actionType || undefined,
        targetType: targetType || undefined,
      });

      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [take, skip, actionType, targetType]);

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <Sidebar />

        <div className={styles.main}>
          <div className={styles.top}>
            <h2 className={styles.title}>Moderation History</h2>

            <button className={styles.btn} type="button" onClick={() => navigate("/moderation")}>
              ← Back
            </button>

            <div className={styles.meta}>
              {loading ? "Loading..." : `Total: ${total} · Page ${page}/${pages}`}
            </div>
          </div>

          <div className={styles.filters}>
            <input
              className={styles.input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search in reason / targetId..."
            />

            <button
              className={styles.btn}
              type="button"
              onClick={() => {
                setSkip(0);
                void load();
              }}
            >
              Search
            </button>

            <select
              className={styles.select}
              value={actionType}
              onChange={(e) => {
                setSkip(0);
                setActionType(e.target.value as any);
              }}
            >
              <option value="">All action types</option>
              {ACTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              className={styles.select}
              value={targetType}
              onChange={(e) => {
                setSkip(0);
                setTargetType(e.target.value as any);
              }}
            >
              <option value="">All target types</option>
              {TARGET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              className={styles.select}
              value={take}
              onChange={(e) => {
                setSkip(0);
                setTake(Number(e.target.value));
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Reason</th>
                </tr>
              </thead>

              <tbody>
                {items.map((a) => {
                  const userId = a.targetType === "USER" ? toPositiveInt(a.targetId) : null;

                  return (
                    <tr
                      key={a.id}
                      className={styles.rowClickable}
                      onClick={() => setSelectedActionId(a.id)}
                      title="Open evidence"
                    >
                      <td className={styles.nowrap}>{new Date(a.createdAt).toLocaleString()}</td>

                      <td>{a.actor?.username ? `@${a.actor.username}` : a.actorId ? `#${a.actorId}` : "system"}</td>

                      <td>
                        <b>{a.actionType}</b>
                      </td>

                      <td>
                        {userId ? (
                          <button
                            type="button"
                            className={styles.userLink}
                            title="Open user moderation"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(`/moderation/users?open=${userId}`);
                            }}
                          >
                            USER #{userId}
                          </button>
                        ) : (
                          <span>
                            {a.targetType} #{a.targetId}
                          </span>
                        )}
                      </td>

                      <td className={styles.reason}>
                        {a.reason ? clip(a.reason, 120) : <span className={styles.muted}>—</span>}
                      </td>
                    </tr>
                  );
                })}

                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.empty}>
                      No actions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.pager}>
            <button className={styles.btn} onClick={() => setSkip(Math.max(0, skip - take))} disabled={skip === 0}>
              Prev
            </button>
            <button className={styles.btn} onClick={() => setSkip(skip + take)} disabled={skip + take >= total}>
              Next
            </button>
          </div>
        </div>
      </div>

      <ModerationActionModal
        open={selectedActionId !== null}
        actionId={selectedActionId}
        onClose={() => setSelectedActionId(null)}
      />
    </>
  );
}
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getReportedCommentsTable,
  type ReportStatus,
  type ModerationCommentsTableItem,
} from "@/utils/api/mod.api";

import "./ModerationCommentsTable.module.scss";

type Row = ModerationCommentsTableItem;

const reasonLabel: Record<string, string> = {
  spam: "Spam",
  abuse: "Abuse",
  harassment: "Harassment",
  hate: "Hate",
  violence: "Violence",
  nudity: "Nudity",
  scam: "Scam",
  other: "Other",
};

function clip(text: string, max = 160) {
  const t = (text ?? "").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export default function ModerationCommentsTable() {
  const navigate = useNavigate();

  const [status, setStatus] = useState<ReportStatus>("PENDING");
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(20);

  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getReportedCommentsTable({ status, skip, take });
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, skip, take]);

  const page = useMemo(() => Math.floor(skip / take) + 1, [skip, take]);
  const pages = useMemo(() => Math.max(1, Math.ceil(total / take)), [total, take]);

  return (
    <div className="mod-comments-table">
      <div className="mod-comments-table__top">
        <div className="mod-comments-table__toolbar">
          <select
            className="mod-comments-table__select"
            value={status}
            onChange={(e) => {
              setSkip(0);
              setStatus(e.target.value as ReportStatus);
            }}
          >
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <select
            className="mod-comments-table__select"
            value={take}
            onChange={(e) => {
              setSkip(0);
              setTake(Number(e.target.value));
            }}
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>

        <div className="mod-comments-table__meta">
          {loading ? "Loading..." : `Total: ${total} · Page ${page}/${pages}`}
        </div>
      </div>

      <div className="mod-comments-table__scroll">
        <table className="mod-comments-table__table">
          <thead>
            <tr>
              <th>Comment</th>
              <th>Reports</th>
              <th>Last report</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {items.map((row) => {
              const c = row.comment;

              return (
                <tr
                  key={row.commentId}
                  className="mod-comments-table__row"
                  onClick={() => navigate(`/moderation/comments/${row.commentId}`)}
                  role="button"
                >
                  <td
                    className="mod-comments-table__cell mod-comments-table__cell--clickable"
                    title="Open case"
                  >
                    <div className="mod-comments-table__comment">
                      <div className="mod-comments-table__content">
                        <div className="mod-comments-table__contentTop">
                          <b>@{c?.user?.username ?? "unknown"}</b>
                          <span className="mod-comments-table__time">
                            {c?.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                          </span>
                        </div>

                        {c?.content ? (
                          <div className="mod-comments-table__desc">
                            {clip(c.content, 220)}
                          </div>
                        ) : (
                          <div className="mod-comments-table__desc mod-comments-table__desc--muted">
                            (no text)
                          </div>
                        )}

                        <div className="mod-comments-table__badges">
                          {c?.postId ? <span>🧾 post #{c.postId}</span> : null}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="mod-comments-table__cell">
                    <span className="mod-comments-table__count">
                      {row.reportCount}
                    </span>
                  </td>

                  <td className="mod-comments-table__cell">
                    {row.lastReport ? (
                      <div className="mod-comments-table__last">
                        <div className="mod-comments-table__lastTop">
                          <b>
                            {reasonLabel[row.lastReport.reason] ?? row.lastReport.reason}
                          </b>
                          <span className="mod-comments-table__lastBy">
                            by @{row.lastReport.reporter?.username ?? "unknown"}
                          </span>
                        </div>

                        {row.lastReport.details ? (
                          <div className="mod-comments-table__lastMsg">
                            {clip(row.lastReport.details, 220)}
                          </div>
                        ) : (
                          <div className="mod-comments-table__lastMsg mod-comments-table__lastMsg--muted">
                            (no details)
                          </div>
                        )}

                        <div className="mod-comments-table__lastTime">
                          {new Date(row.lastReport.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <span className="mod-comments-table__muted">—</span>
                    )}
                  </td>

                  <td className="mod-comments-table__cell">
                    <span className="mod-comments-table__status">
                      {c?.status ?? "—"}
                    </span>
                  </td>
                </tr>
              );
            })}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="mod-comments-table__empty">
                  No items
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mod-comments-table__pager">
        <button
          className="mod-comments-table__btn"
          onClick={() => setSkip(Math.max(0, skip - take))}
          disabled={skip === 0}
        >
          Prev
        </button>

        <button
          className="mod-comments-table__btn"
          onClick={() => setSkip(skip + take)}
          disabled={skip + take >= total}
        >
          Next
        </button>
      </div>
    </div>
  );
}
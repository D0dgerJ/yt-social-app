import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReportedCommentsTable, type ReportStatus, type ModerationCommentsTableItem } from "@/utils/api/mod.api";

import "./ModerationCommentsTable.module.scss";

type Row = ModerationCommentsTableItem;

const reasonLabel: Record<string, string> = {
  spam: "Спам",
  abuse: "Оскорбления",
  harassment: "Травля",
  hate: "Ненависть",
  violence: "Насилие",
  nudity: "Нагота",
  scam: "Мошенничество",
  other: "Другое",
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
    <div className="mod-table">
      <div className="mod-table__top">
        <h2 className="mod-table__title">Comments moderation</h2>

        <select
          className="mod-table__select"
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

        <div className="mod-table__meta">
          {loading ? "Loading..." : `Total: ${total} · Page ${page}/${pages}`}
        </div>
      </div>

      <div className="mod-table__scroll">
        <table className="mod-table__table">
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
                  className="mod-table__row"
                  onClick={() => navigate(`/moderation/comments/${row.commentId}`)}
                  role="button"
                >
                  <td className="mod-table__cell mod-table__cell--clickable" title="Open case">
                    <div className="mod-table__post">
                      <div className="mod-table__content">
                        <div className="mod-table__contentTop">
                          <b>@{c?.user?.username ?? "unknown"}</b>
                          <span className="mod-table__time">
                            {c?.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                          </span>
                        </div>

                        {c?.content ? (
                          <div className="mod-table__desc">{clip(c.content, 220)}</div>
                        ) : (
                          <div className="mod-table__desc mod-table__desc--muted">(no text)</div>
                        )}

                        <div className="mod-table__badges">
                          {c?.postId ? <span>🧾 post #{c.postId}</span> : null}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="mod-table__cell">{row.reportCount}</td>

                  <td className="mod-table__cell">
                    {row.lastReport ? (
                      <div className="mod-table__last">
                        <div className="mod-table__lastTop">
                          <b>{reasonLabel[row.lastReport.reason] ?? row.lastReport.reason}</b>
                          <span className="mod-table__lastBy">
                            by @{row.lastReport.reporter?.username ?? "unknown"}
                          </span>
                        </div>

                        {row.lastReport.details ? (
                          <div className="mod-table__lastMsg">
                            {clip(row.lastReport.details, 220)}
                          </div>
                        ) : (
                          <div className="mod-table__lastMsg mod-table__lastMsg--muted">(no details)</div>
                        )}

                        <div className="mod-table__lastTime">
                          {new Date(row.lastReport.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <span className="mod-table__muted">—</span>
                    )}
                  </td>

                  <td className="mod-table__cell">{c?.status ?? "—"}</td>
                </tr>
              );
            })}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="mod-table__empty">
                  No items
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mod-table__pager">
        <button
          className="mod-table__btn"
          onClick={() => setSkip(Math.max(0, skip - take))}
          disabled={skip === 0}
        >
          Prev
        </button>

        <button
          className="mod-table__btn"
          onClick={() => setSkip(skip + take)}
          disabled={skip + take >= total}
        >
          Next
        </button>

        <select
          className="mod-table__select"
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
    </div>
  );
}

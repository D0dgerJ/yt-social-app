import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReportedPostsTable, type ReportStatus } from "@/utils/api/mod.api";

import "./ModerationTable.module.scss";

type Row = {
  postId: number;
  reportCount: number;
  lastReport: null | {
    id: number;
    reason: string;
    message: string | null;
    createdAt: string;
    reporter?: { id: number; username: string };
  };
  post: null | {
    id: number;
    userId: number;
    status: string;
    desc: string | null;
    createdAt: string;
    location?: string | null;
    images?: string[];
    videos?: string[];
    files?: string[];
    tags?: string[];
    user?: { id: number; username: string };
  };
};

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

export default function ModerationTable() {
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
      const data = await getReportedPostsTable({ status, skip, take });
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
        <h2 className="mod-table__title">Moderation</h2>

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
              <th>Post</th>
              <th>Reports</th>
              <th>Last report</th>
              <th>Post status</th>
            </tr>
          </thead>

          <tbody>
            {items.map((row) => {
              const p = row.post;
              const img = p?.images?.[0];
              const video = p?.videos?.[0];
              const filesCount = p?.files?.length ?? 0;

              return (
                <tr
                  key={row.postId}
                  className="mod-table__row"
                  onClick={() => navigate(`/moderation/posts/${row.postId}`)}
                  role="button"
                >
                  <td className="mod-table__cell mod-table__cell--clickable" title="Open case">
                    <div className="mod-table__post">
                      <div className="mod-table__preview">
                        {img ? (
                          <img className="mod-table__previewImg" src={img} alt="post preview" />
                        ) : video ? (
                          <div className="mod-table__previewFallback">🎬 video</div>
                        ) : (
                          <div className="mod-table__previewFallback mod-table__previewFallback--muted">
                            no media
                          </div>
                        )}
                      </div>

                      <div className="mod-table__content">
                        <div className="mod-table__contentTop">
                          <b>@{p?.user?.username ?? "unknown"}</b>
                          <span className="mod-table__time">
                            {p?.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                          </span>
                        </div>

                        {p?.desc ? (
                          <div className="mod-table__desc">{clip(p.desc, 180)}</div>
                        ) : (
                          <div className="mod-table__desc mod-table__desc--muted">(no text)</div>
                        )}

                        <div className="mod-table__badges">
                          {p?.location ? <span>📍 {p.location}</span> : null}
                          {filesCount > 0 ? <span>📎 {filesCount} files</span> : null}
                          {p?.tags?.length ? (
                            <span>
                              🏷 {p.tags.slice(0, 3).join(", ")}
                              {p.tags.length > 3 ? "…" : ""}
                            </span>
                          ) : null}
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

                        {row.lastReport.message ? (
                          <div className="mod-table__lastMsg">
                            {clip(row.lastReport.message, 220)}
                          </div>
                        ) : (
                          <div className="mod-table__lastMsg mod-table__lastMsg--muted">
                            (no message)
                          </div>
                        )}

                        <div className="mod-table__lastTime">
                          {new Date(row.lastReport.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <span className="mod-table__muted">—</span>
                    )}
                  </td>

                  <td className="mod-table__cell">{p?.status ?? "—"}</td>
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
import { useEffect, useMemo, useState } from "react";
import {
  getReportedPostsTable,
  approveReport,
  rejectReport,
  hidePost,
  softDeletePost,
  hardDeletePost,
  type ReportStatus,
} from "@/utils/api/mod.api";
import ModerationPostModal from "./ModerationPostModal";
import "./ModerationPostModal.scss";

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
  const [status, setStatus] = useState<ReportStatus>("PENDING");
  const [skip, setSkip] = useState(0);
  const [take, setTake] = useState(20);

  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);

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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, skip, take]);

  const page = useMemo(() => Math.floor(skip / take) + 1, [skip, take]);
  const pages = useMemo(() => Math.max(1, Math.ceil(total / take)), [total, take]);

  const onApprove = async (row: Row) => {
    if (!row.lastReport) return;
    await approveReport(row.lastReport.id, { reason: "Approved in UI" });
    await load();
  };

  const onReject = async (row: Row) => {
    if (!row.lastReport) return;
    await rejectReport(row.lastReport.id, { reason: "Rejected in UI" });
    await load();
  };

  const onHide = async (row: Row) => {
    await hidePost(row.postId, "Hidden in UI");
    await load();
  };

  const onSoftDelete = async (row: Row) => {
    await softDeletePost(row.postId, "Soft-deleted in UI");
    await load();
  };

  const onHardDelete = async (row: Row) => {
    await hardDeletePost(row.postId, "Hard-deleted in UI");
    await load();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Moderation</h2>

        <select value={status} onChange={(e) => { setSkip(0); setStatus(e.target.value as ReportStatus); }}>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>

        <div style={{ marginLeft: "auto" }}>
          {loading ? "Loading..." : `Total: ${total} · Page ${page}/${pages}`}
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Post</th>
              <th align="left">Reports</th>
              <th align="left">Last report</th>
              <th align="left">Post status</th>
              <th align="left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((row) => {
              const p = row.post;
              const img = p?.images?.[0];
              const video = p?.videos?.[0];
              const filesCount = p?.files?.length ?? 0;

              return (
                <tr key={row.postId}>
                  {/* POST */}
                  <td style={{ padding: "10px 6px", verticalAlign: "top", cursor: "pointer" }} onClick={() => setSelected(row)} title="Open details">
                    <div style={{ display: "flex", gap: 10 }}>
                      {/* preview */}
                      <div style={{ width: 72, flex: "0 0 72px" }}>
                        {img ? (
                          <img
                            src={img}
                            alt="post preview"
                            style={{
                              width: 72,
                              height: 72,
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "1px solid #eee",
                            }}
                          />
                        ) : video ? (
                          <div
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: 8,
                              border: "1px solid #eee",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              opacity: 0.8,
                            }}
                          >
                            🎬 video
                          </div>
                        ) : (
                          <div
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: 8,
                              border: "1px solid #eee",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              opacity: 0.6,
                            }}
                          >
                            no media
                          </div>
                        )}
                      </div>

                      {/* content */}
                      <div style={{ minWidth: 260, maxWidth: 620 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                          <b>@{p?.user?.username ?? "unknown"}</b>
                          <span style={{ fontSize: 12, opacity: 0.7 }}>
                            {p?.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                          </span>
                        </div>

                        {p?.desc ? (
                          <div style={{ marginTop: 4 }}>
                            {clip(p.desc, 180)}
                          </div>
                        ) : (
                          <div style={{ marginTop: 4, opacity: 0.6 }}>(no text)</div>
                        )}

                        <div style={{ marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, opacity: 0.8 }}>
                          {p?.location ? <span>📍 {p.location}</span> : null}
                          {filesCount > 0 ? <span>📎 {filesCount} files</span> : null}
                          {p?.tags?.length ? <span>🏷 {p.tags.slice(0, 3).join(", ")}{p.tags.length > 3 ? "…" : ""}</span> : null}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* REPORTS COUNT */}
                  <td style={{ padding: "10px 6px", verticalAlign: "top" }}>{row.reportCount}</td>

                  {/* LAST REPORT */}
                  <td style={{ padding: "10px 6px", verticalAlign: "top" }}>
                    {row.lastReport ? (
                      <div style={{ maxWidth: 420 }}>
                        <div>
                          <b>{reasonLabel[row.lastReport.reason] ?? row.lastReport.reason}</b>{" "}
                          <span style={{ opacity: 0.8 }}>
                            by @{row.lastReport.reporter?.username ?? "unknown"}
                          </span>
                        </div>

                        {row.lastReport.message ? (
                          <div style={{ marginTop: 4, fontSize: 13 }}>
                            {clip(row.lastReport.message, 220)}
                          </div>
                        ) : (
                          <div style={{ marginTop: 4, fontSize: 13, opacity: 0.6 }}>(no message)</div>
                        )}

                        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                          {new Date(row.lastReport.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* POST STATUS */}
                  <td style={{ padding: "10px 6px", verticalAlign: "top" }}>{p?.status ?? "-"}</td>

                  {/* ACTIONS */}
                  <td style={{ padding: "10px 6px", verticalAlign: "top" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => onApprove(row)} disabled={!row.lastReport}>Approve</button>
                      <button onClick={() => onReject(row)} disabled={!row.lastReport}>Reject</button>
                      <button onClick={() => onHide(row)}>Hide</button>
                      <button onClick={() => onSoftDelete(row)}>Soft delete</button>
                      <button onClick={() => onHardDelete(row)}>Hard delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 16, opacity: 0.8 }}>
                  No items
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <button onClick={() => setSkip(Math.max(0, skip - take))} disabled={skip === 0}>
          Prev
        </button>
        <button onClick={() => setSkip(skip + take)} disabled={skip + take >= total}>
          Next
        </button>

        <select
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
      <ModerationPostModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        postId={selected?.postId ?? 0}
        status={status}
        post={selected?.post ?? null}
      />

    </div>
  );
}
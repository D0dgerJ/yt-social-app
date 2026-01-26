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
    status: string;
    desc: string | null;
    user?: { id: number; username: string };
    createdAt: string;
  };
};

export default function ModerationTable() {
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

        <select value={status} onChange={(e) => setStatus(e.target.value as ReportStatus)}>
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
            {items.map((row) => (
              <tr key={row.postId}>
                <td>
                  <div>
                    <b>@{row.post?.user?.username ?? "unknown"}</b>
                  </div>
                  <div style={{ maxWidth: 520, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {row.post?.desc ?? ""}
                  </div>
                </td>

                <td>{row.reportCount}</td>

                <td>
                  {row.lastReport ? (
                    <div>
                      <div>
                        <b>{row.lastReport.reason}</b> by @{row.lastReport.reporter?.username ?? "unknown"}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>
                        {new Date(row.lastReport.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>

                <td>{row.post?.status ?? "-"}</td>

                <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => onApprove(row)} disabled={!row.lastReport}>Approve</button>
                  <button onClick={() => onReject(row)} disabled={!row.lastReport}>Reject</button>
                  <button onClick={() => onHide(row)}>Hide</button>
                  <button onClick={() => onSoftDelete(row)}>Soft delete</button>
                  <button onClick={() => onHardDelete(row)}>Hard delete</button>
                </td>
              </tr>
            ))}

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

        <select value={take} onChange={(e) => { setSkip(0); setTake(Number(e.target.value)); }}>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
    </div>
  );
}

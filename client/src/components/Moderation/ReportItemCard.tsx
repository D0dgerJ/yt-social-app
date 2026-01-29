import { approveReport, rejectReport } from "@/utils/api/mod.api";

type ReportItem = {
  id: number;
  postId: number;
  reporterId: number;
  reason: string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt: string | null;
  reporter?: { id: number; username: string };
  reviewedBy?: { id: number; username: string };
};

type Props = {
  item: ReportItem;
  reasonLabel: Record<string, string>;
  busy: boolean;

  onBusyChange: (reportId: number | null) => void;
  onAfterAction: () => Promise<void> | void;
};

export default function ReportItemCard({
  item,
  reasonLabel,
  busy,
  onBusyChange,
  onAfterAction,
}: Props) {
  const onApprove = async () => {
    const reason = prompt("Approve reason:", "Approved in UI");
    if (!reason || !reason.trim()) return;

    try {
      onBusyChange(item.id);
      await approveReport(item.id, { reason: reason.trim() });
      await onAfterAction();
    } finally {
      onBusyChange(null);
    }
  };

  const onReject = async () => {
    const reason = prompt("Reject reason:", "Rejected in UI");
    if (!reason || !reason.trim()) return;

    try {
      onBusyChange(item.id);
      await rejectReport(item.id, { reason: reason.trim() });
      await onAfterAction();
    } finally {
      onBusyChange(null);
    }
  };

  return (
    <div className="mod-post-modal__reportItem">
      <div className="mod-post-modal__reportTop">
        <div>
          <b>{reasonLabel[item.reason] ?? item.reason}</b>{" "}
          <span className="mod-post-modal__muted">@{item.reporter?.username ?? "unknown"}</span>
        </div>
        <div className="mod-post-modal__muted">{new Date(item.createdAt).toLocaleString()}</div>
      </div>

      {item.message ? (
        <div className="mod-post-modal__reportMsg">{item.message}</div>
      ) : (
        <div className="mod-post-modal__muted">(без сообщения)</div>
      )}

      <div className="mod-post-modal__muted">
        Status: <b>{item.status}</b>
        {item.reviewedBy ? (
          <>
            {" · "}Reviewed by @{item.reviewedBy.username}
          </>
        ) : null}
      </div>

      <div className="mod-post-modal__reportActions">
        <button
          type="button"
          onClick={onApprove}
          disabled={busy || item.status !== "PENDING"}
          title={item.status !== "PENDING" ? "Already reviewed" : "Approve this report"}
        >
          {busy ? "..." : "Approve"}
        </button>

        <button
          type="button"
          onClick={onReject}
          disabled={busy || item.status !== "PENDING"}
          title={item.status !== "PENDING" ? "Already reviewed" : "Reject this report"}
        >
          {busy ? "..." : "Reject"}
        </button>
      </div>
    </div>
  );
}

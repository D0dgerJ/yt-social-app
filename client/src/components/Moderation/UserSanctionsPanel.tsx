import React, { useEffect, useMemo, useState } from "react";
import {
  createUserSanction,
  getUserSanctions,
  liftUserSanction,
  type CreateUserSanctionBody,
  type UserSanctionItem,
  type UserSanctionType,
} from "@/utils/api/mod.api";
import "./UserSanctionsPanel.scss";

type Props = {
  userId: number;
  username?: string;
  defaultEvidence?: any;
};

const TYPES: { value: UserSanctionType; label: string }[] = [
  { value: "WARN", label: "Warning" },
  { value: "RESTRICT", label: "Restrict (read-only)" },
  { value: "TEMP_BAN", label: "Temp ban" },
  { value: "PERM_BAN", label: "Perm ban" },
];

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function isActive(item: UserSanctionItem) {
  return item.status === "ACTIVE";
}

export default function UserSanctionsPanel({ userId, username, defaultEvidence }: Props) {
  const [items, setItems] = useState<UserSanctionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<UserSanctionType>("RESTRICT");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [tempBanHours, setTempBanHours] = useState(24);

  const active = useMemo(() => items.find(isActive) ?? null, [items]);

  async function load() {
    try {
      setError(null);
      setLoading(true);
      const res = await getUserSanctions(userId);
      setItems(res.items || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load sanctions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function buildEndsAt(): string | undefined {
    if (type !== "TEMP_BAN") return undefined;

    const now = new Date();
    const ms = tempBanHours * 60 * 60 * 1000;
    const endsAt = new Date(now.getTime() + ms);
    return endsAt.toISOString();
  }

  async function onCreate() {
    if (!reason.trim()) {
      setError("Reason is required");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const body: CreateUserSanctionBody = {
        type,
        reason: reason.trim(),
        message: message.trim() ? message.trim() : undefined,
        endsAt: buildEndsAt(),
        evidence: defaultEvidence,
      };

      await createUserSanction(userId, body);

      setReason("");
      setMessage("");
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to create sanction");
    } finally {
      setSubmitting(false);
    }
  }

  async function onLift(sanctionId: number) {
    const liftReason = prompt("Lift reason:");
    if (!liftReason || !liftReason.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      await liftUserSanction(sanctionId, { reason: liftReason.trim() });
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to lift sanction");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="usp">
      <div className="usp__header">
        <div className="usp__title">
          Sanctions{username ? <span className="usp__muted"> — @{username}</span> : null}
        </div>

        <button
          className="usp__btn usp__btn--ghost"
          type="button"
          onClick={load}
          disabled={loading || submitting}
        >
          Refresh
        </button>
      </div>

      {error ? <div className="usp__error">{error}</div> : null}

      <div className="usp__create">
        <div className="usp__row">
          <label className="usp__label">
            Type
            <select
              className="usp__select"
              value={type}
              onChange={(e) => setType(e.target.value as UserSanctionType)}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          {type === "TEMP_BAN" ? (
            <label className="usp__label">
              Duration (hours)
              <input
                className="usp__input"
                type="number"
                min={1}
                max={24 * 365}
                value={tempBanHours}
                onChange={(e) => setTempBanHours(Number(e.target.value))}
              />
            </label>
          ) : (
            <div className="usp__spacer" />
          )}
        </div>

        <label className="usp__label">
          Reason *
          <input
            className="usp__input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. spam, harassment, repeated policy violations..."
          />
        </label>

        <label className="usp__label">
          Message (optional)
          <input
            className="usp__input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Internal note or message to include in metadata"
          />
        </label>

        <div className="usp__actions">
          <button
            className="usp__btn usp__btn--primary"
            type="button"
            onClick={onCreate}
            disabled={submitting || loading}
            title={active ? "User has an active sanction (server may block duplicates)" : undefined}
          >
            Apply
          </button>

          {type === "TEMP_BAN" ? (
            <div className="usp__hint">
              Will set endsAt = now + {tempBanHours}h ({formatDate(buildEndsAt())})
            </div>
          ) : null}
        </div>
      </div>

      <div className="usp__list">
        <div className="usp__subtitle">History</div>

        {loading ? <div className="usp__muted">Loading...</div> : null}
        {!loading && items.length === 0 ? <div className="usp__muted">No sanctions</div> : null}

        {items.map((s) => (
          <div key={s.id} className={`usp__item ${s.status === "ACTIVE" ? "usp__item--active" : ""}`}>
            <div className="usp__itemTop">
              <div className="usp__badge">{s.type}</div>
              <div className="usp__status">{s.status}</div>

              {s.status === "ACTIVE" ? (
                <button
                  className="usp__btn usp__btn--danger"
                  type="button"
                  onClick={() => onLift(s.id)}
                  disabled={submitting}
                >
                  Lift
                </button>
              ) : null}
            </div>

            <div className="usp__reason">{s.reason}</div>

            <div className="usp__meta">
              <div>Starts: {formatDate(s.startsAt)}</div>
              <div>Ends: {formatDate(s.endsAt)}</div>
              <div>
                By:{" "}
                {s.createdBy?.username
                  ? `@${s.createdBy.username}`
                  : s.createdBy?.id
                    ? `#${s.createdBy.id}`
                    : "—"}
              </div>
              {s.liftedAt ? <div>Lifted: {formatDate(s.liftedAt)}</div> : null}
              {s.liftReason ? <div>Lift reason: {s.liftReason}</div> : null}
            </div>

            {s.message ? <div className="usp__note">Note: {s.message}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
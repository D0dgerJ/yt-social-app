import { useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "@/components/Navbar/Navbar";
import Sidebar from "@/components/Sidebar/Sidebar";
import { AuthContext } from "@/context/AuthContext";

import {
  CaseHeader,
  AlreadyHandledBanner,
  TopStats,
  DecisionDraftCard,
  ActionsHistory,
} from "@/components/Moderation/PostDetails";

import {
  CommentPreviewCard,
  CommentReportsCard,
  CommentActionsCard,
} from "@/components/Moderation/CommentDetails";

import { ALLOWED, reasonLabel } from "@/utils/moderation/commentDetails.constants";
import { fmt, clip } from "@/utils/moderation/postDetails.utils";

import { useModerationCommentReports } from "@/hooks/moderation/useModerationCommentReports";
import { useActiveCommentReport } from "@/hooks/moderation/useActiveCommentReport";
import { useCommentDecisionDraft } from "@/hooks/moderation/useCommentDecisionDraft";
import { useCommentActions } from "@/hooks/moderation/useCommentActions";
import { useModerationActionsForTarget } from "@/hooks/moderation/useModerationActionsForTarget";

import type { ModerationCommentView } from "@/utils/types/moderation/commentDetails.types";
import styles from "./ModerationCommentDetails.module.scss";

export default function ModerationCommentDetails() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const params = useParams();
  const commentId = Number(params.commentId);

  const role = (user as any)?.role as string | undefined;

  useEffect(() => {
    if (!user || !role || !ALLOWED.has(role)) navigate("/");
  }, [user, role, navigate]);

  const {
    isLoadingReports: isLoading,
    error,
    reports,
    activeReportId,
    setActiveReportId,
    counts,
    activeLite,
    refreshCase,
  } = useModerationCommentReports(commentId);

  const { activeFullReport, isLoadingActive, reloadActiveReport } =
    useActiveCommentReport(activeReportId);

  const {
    actions: modActions,
    isLoadingActions,
    alreadyHandled,
    refreshActions,
    setAlreadyHandled,
  } = useModerationActionsForTarget("COMMENT", String(commentId));

  const decision = useCommentDecisionDraft({
    activeLite,
    onAfterDecision: async () => {
      await refreshCase();
      await refreshActions();
    },
  });

  const comment: ModerationCommentView | null =
    (activeFullReport?.comment as any) ?? (activeLite as any)?.comment ?? null;

  const hasApprovedReport = (counts?.APPROVED ?? 0) > 0;

  const commentActions = useCommentActions({
    commentId,
    hasApprovedReport,
    comment,
    onAfterAction: async () => {
      await refreshActions();
      await reloadActiveReport();
      await refreshCase();
      setAlreadyHandled(null);
    },
  });

  return (
    <>
      <Navbar />

      <div className={styles.layout}>
        <div className={styles.sidebarWrapper}>
          <Sidebar />
        </div>

        <main className={styles.main}>
          <CaseHeader postId={commentId} navigate={navigate} styles={styles} />

          {error ? <div className={styles.error}>{error}</div> : null}

          <AlreadyHandledBanner data={alreadyHandled} styles={styles} fmt={fmt} />

          <TopStats counts={counts as any} styles={styles} />

          <div className={styles.grid}>
            <CommentPreviewCard
              styles={styles}
              isLoading={isLoading}
              isLoadingActive={isLoadingActive}
              comment={comment}
              fmt={fmt}
            />

            <CommentReportsCard
              styles={styles}
              isLoading={isLoading}
              reports={reports}
              activeLite={activeLite}
              activeReportId={activeReportId}
              setActiveReportId={(id) => setActiveReportId(id)}
              reasonLabel={reasonLabel}
              fmt={fmt}
              clip={clip}
            />
          </div>

          <div className={styles.nextBlocks}>
            <DecisionDraftCard
              styles={styles}
              isPendingActive={decision.isPendingActive}
              decisionError={decision.decisionError}
              decisionHint={decision.decisionHint}
              draftDecision={decision.draftDecision as any}
              setDraftDecision={decision.setDraftDecision as any}
              draftCategory={decision.draftCategory}
              setDraftCategory={decision.setDraftCategory}
              draftNote={decision.draftNote}
              setDraftNote={decision.setDraftNote}
              noteLen={decision.noteLen}
              isSubmittingDecision={decision.isSubmittingDecision}
              canApprove={decision.canApprove}
              canReject={decision.canReject}
              onApprove={decision.onApprove}
              onReject={decision.onReject}
            />

            <CommentActionsCard
              styles={styles}
              hasApprovedReport={hasApprovedReport}
              state={commentActions.state}
              visibility={commentActions.visibility}
              actionError={commentActions.actionError}
              actionNote={commentActions.actionNote}
              setActionNote={commentActions.setActionNote}
              isSubmittingAction={commentActions.isSubmittingAction}
              actionNoteLen={commentActions.actionNoteLen}
              commentActionsHint={commentActions.commentActionsHint}
              canHide={commentActions.canHide}
              canUnhide={commentActions.canUnhide}
              canDelete={commentActions.canDelete}
              canRestore={commentActions.canRestore}
              canShadowHide={commentActions.canShadowHide}
              canShadowUnhide={commentActions.canShadowUnhide}
              onCommentAction={(k) => void commentActions.onCommentAction(k)}
              onRefreshActions={() => void refreshActions()}
            />
          </div>

          <ActionsHistory
            styles={styles}
            items={modActions as any}
            isLoading={isLoadingActions}
            fmt={fmt}
          />
        </main>
      </div>
    </>
  );
}
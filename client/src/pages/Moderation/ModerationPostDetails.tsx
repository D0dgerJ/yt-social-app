import { useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CaseHeader,
  AlreadyHandledBanner,
  TopStats,
  PostPreviewCard,
  ReportsCard,
  DecisionDraftCard,
  PostActionsCard,
  ActionsHistory,
} from "@/components/Moderation/PostDetails";

import Navbar from "@/components/Navbar/Navbar";
import Sidebar from "@/components/Sidebar/Sidebar";
import { AuthContext } from "@/context/AuthContext";

import { ALLOWED, ADMIN_PLUS, reasonLabel } from "@/utils/moderation/postDetails.constants";
import { fmt, clip } from "@/utils/moderation/postDetails.utils";
import type { ModerationPostView } from "@/utils/types/moderation/postDetails.types";

import { useModerationActions } from "@/hooks/moderation/useModerationActions";
import { useModerationReports } from "@/hooks/moderation/useModerationReports";
import { useActiveReport } from "@/hooks/moderation/useActiveReport";
import { useDecisionDraft } from "@/hooks/moderation/useDecisionDraft";
import { usePostActions } from "@/hooks/moderation/usePostActions";

import styles from "./ModerationPostDetails.module.scss";

export default function ModerationPostDetails() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const params = useParams();
  const postId = Number(params.postId);

  const role = (user as any)?.role as string | undefined;
  const isAdminPlus = Boolean(role && ADMIN_PLUS.has(role));

  const {
    isLoadingReports: isLoading,
    error,
    reports,
    activeReportId,
    setActiveReportId,
    counts,
    activeLite,
    refreshCase,
  } = useModerationReports(postId);

  const { activeFullReport, isLoadingActive, reloadActiveReport } =
    useActiveReport(activeReportId);

  const {
    actions: modActions,
    isLoadingActions,
    alreadyHandled,
    refreshActions,
    setAlreadyHandled,
  } = useModerationActions(postId);

  // --- access guard ---
  useEffect(() => {
    if (!user || !role || !ALLOWED.has(role)) navigate("/");
  }, [user, role, navigate]);

  const decision = useDecisionDraft({
    activeLite,
    onAfterDecision: async () => {
      await refreshCase();
      await refreshActions();
    },
  });

  const post: ModerationPostView | null =
    activeFullReport?.post ?? activeLite?.post ?? null;

  const images: string[] = post?.images ?? [];
  const videos: string[] = post?.videos ?? [];
  const files: string[] = post?.files ?? [];
  const tags: string[] = post?.tags ?? [];
  const location: string | null = post?.location ?? null;

  const hasApprovedReport = counts.APPROVED > 0;

  const postActions = usePostActions({
    postId,
    activeReportId,
    hasApprovedReport,
    isAdminPlus,

    modActions,
    refreshActions,
    setAlreadyHandled,
    reloadActiveReport,

    isLoadingActions,
  });

  return (
    <>
      <Navbar />

      <div className={styles.container}>
        <Sidebar />

        <div className={styles.main}>
          <CaseHeader postId={postId} navigate={navigate} styles={styles} />

          {error ? <div className={styles.error}>{error}</div> : null}

          <AlreadyHandledBanner data={alreadyHandled} styles={styles} fmt={fmt} />

          <TopStats counts={counts} styles={styles} />

          <div className={styles.grid}>
            {/* LEFT: Post preview */}
            <PostPreviewCard
              styles={styles}
              isLoading={isLoading}
              isLoadingActive={isLoadingActive}
              post={post}
              location={location}
              tags={tags}
              images={images}
              videos={videos}
              files={files}
              fmt={fmt}
            />

            {/* RIGHT: Reports list + details */}
            <ReportsCard
              styles={styles}
              isLoading={isLoading}
              reports={reports}
              activeLite={activeLite}
              activeReportId={activeReportId}
              setActiveReportId={setActiveReportId}
              reasonLabel={reasonLabel}
              fmt={fmt}
              clip={clip}
            />
          </div>

          {/* Block 4 + Block 5 */}
          <div className={styles.nextBlocks}>
            <DecisionDraftCard
              styles={styles}
              isPendingActive={decision.isPendingActive}
              decisionError={decision.decisionError}
              decisionHint={decision.decisionHint}
              draftDecision={decision.draftDecision}
              setDraftDecision={decision.setDraftDecision}
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

            <PostActionsCard
              styles={styles}
              hasApprovedReport={hasApprovedReport}
              lastState={postActions.lastState}
              isLoadingActions={isLoadingActions}
              actionError={postActions.actionError}
              actionNote={postActions.actionNote}
              setActionNote={postActions.setActionNote}
              isSubmittingAction={postActions.isSubmittingAction}
              actionNoteLen={postActions.actionNoteLen}
              postActionsHint={postActions.postActionsHint}
              canHide={postActions.canHide}
              canUnhide={postActions.canUnhide}
              canSoftDelete={postActions.canSoftDelete}
              canHardDelete={postActions.canHardDelete}
              isAdminPlus={isAdminPlus}
              onPostAction={postActions.onPostAction}
              onRefreshActions={() => void refreshActions()}
            />
          </div>

          <ActionsHistory
            styles={styles}
            items={modActions}
            isLoading={isLoadingActions}
            fmt={fmt}
          />
        </div>
      </div>
    </>
  );
}

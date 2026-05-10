import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AuthContext } from "../../context/AuthContext";
import usePostLikes from "../../hooks/usePostLike";

import CommentSection from "../CommentSection/CommentSection";
import PostGallery from "../Post/parts/PostGallery";
import PostMeta from "../Post/parts/PostMeta";
import PostTags from "../Post/parts/PostTags";

import "./PostModal.scss";

type LikeEntity = number | string | { userId: number | string };
type SheetSnap = "peek" | "mid" | "full";

interface PostModalProps {
  post: {
    id: number;
    createdAt: string;
    desc?: string;
    images?: string[];
    tags?: string[];
    likes?: LikeEntity[];
    _count?: { likes?: number; comments?: number };
    user?: { username: string };
  };
  onClose: () => void;
  targetCommentId?: number;
}

const MOBILE_BREAKPOINT = 700;

const PostModal: React.FC<PostModalProps> = ({
  post,
  onClose,
  targetCommentId,
}) => {
  const { user: currentUser } = useContext(AuthContext);

  const {
    count: likeCount,
    isLiked,
    loading: isLiking,
    toggle: toggleLike,
  } = usePostLikes({
    postId: post.id,
    likes: post.likes,
    initialCount: post._count?.likes,
    currentUserId: currentUser?.id,
  });

  const [isMobile, setIsMobile] = useState(false);
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("mid");
  const [dragTop, setDragTop] = useState<number | null>(null);

  const dragStateRef = useRef<{
    startY: number;
    startTop: number;
    dragging: boolean;
  }>({
    startY: 0,
    startTop: 0,
    dragging: false,
  });

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    document.addEventListener("keydown", onEsc);

    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);

    const apply = () => {
      const mobile = media.matches;
      setIsMobile(mobile);
      setSheetSnap(mobile ? "mid" : "full");
      setDragTop(null);
    };

    apply();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }

    media.addListener(apply);
    return () => media.removeListener(apply);
  }, []);

  const snapTops = useMemo(() => {
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;

    return {
      full: 88,
      mid: Math.round(vh * 0.42),
      peek: Math.round(vh * 0.68),
    };
  }, [isMobile]);

  const activeTop = dragTop ?? snapTops[sheetSnap];

  const clampTop = (value: number) => {
    const min = snapTops.full;
    const max = snapTops.peek;
    return Math.max(min, Math.min(value, max));
  };

  const nearestSnap = (top: number): SheetSnap => {
    const points: Array<{ key: SheetSnap; value: number }> = [
      { key: "full", value: snapTops.full },
      { key: "mid", value: snapTops.mid },
      { key: "peek", value: snapTops.peek },
    ];

    let nearest = points[0];

    for (const point of points) {
      if (Math.abs(point.value - top) < Math.abs(nearest.value - top)) {
        nearest = point;
      }
    }

    return nearest.key;
  };

  const startDrag = (clientY: number) => {
    dragStateRef.current = {
      startY: clientY,
      startTop: activeTop,
      dragging: true,
    };
  };

  const updateDrag = (clientY: number) => {
    if (!dragStateRef.current.dragging) return;

    const delta = clientY - dragStateRef.current.startY;
    const next = clampTop(dragStateRef.current.startTop + delta);
    setDragTop(next);
  };

  const endDrag = () => {
    if (!dragStateRef.current.dragging) return;

    dragStateRef.current.dragging = false;
    const finalTop = dragTop ?? activeTop;
    setDragTop(null);
    setSheetSnap(nearestSnap(finalTop));
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    startDrag(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    const touch = e.touches[0];
    updateDrag(touch.clientY);
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    endDrag();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMobile) return;

    e.preventDefault();
    startDrag(e.clientY);

    const onMove = (moveEvent: MouseEvent) => {
      updateDrag(moveEvent.clientY);
    };

    const onUp = () => {
      endDrag();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const desktopModalNode = (
    <div
      className="post-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Post details"
      onClick={onClose}
    >
      <div className="post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="post-modal-left">
          <PostGallery
            images={post.images}
            gridClassName="modal-image-grid"
            imgClassName="modal-image"
            emptyClassName="modal-no-image"
            emptyText="No images"
            showEmpty={true}
          />
        </div>

        <div className="post-modal-right">
          <div className="modal-header">
            <span className="modal-username">{post.user?.username}</span>

            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {post.desc && <div className="modal-description">{post.desc}</div>}

          <PostTags tags={post.tags} className="modal-tags" />

          <PostMeta
            createdAt={post.createdAt}
            isLiked={isLiked}
            likes={likeCount}
            onToggle={toggleLike}
            loading={isLiking}
            rootClassName="modal-meta"
            timeClassName="modal-time"
            likesClassName="modal-likes"
            showTime={true}
            asButton={true}
          />

          <div className="modal-comments">
            <CommentSection
              postId={post.id}
              targetCommentId={targetCommentId}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const mobileModalNode = (
    <div
      className="post-modal-overlay post-modal-overlay--mobile"
      role="dialog"
      aria-modal="true"
      aria-label="Post details"
      onClick={onClose}
    >
      <div
        className="post-modal post-modal--mobile"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="post-modal-mobile-topbar">
          <span className="post-modal-mobile-topbar__username">
            {post.user?.username}
          </span>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="post-modal-mobile-post">
          <div className="post-modal-left post-modal-left--mobile">
            <PostGallery
              images={post.images}
              gridClassName="modal-image-grid"
              imgClassName="modal-image"
              emptyClassName="modal-no-image"
              emptyText="No images"
              showEmpty={true}
            />
          </div>

          <div className="post-modal-right post-modal-right--mobile">
            {post.desc && <div className="modal-description">{post.desc}</div>}

            <PostTags tags={post.tags} className="modal-tags" />

            <PostMeta
              createdAt={post.createdAt}
              isLiked={isLiked}
              likes={likeCount}
              onToggle={toggleLike}
              loading={isLiking}
              rootClassName="modal-meta"
              timeClassName="modal-time"
              likesClassName="modal-likes"
              showTime={true}
              asButton={true}
            />
          </div>
        </div>

        <div
          className={`post-comments-sheet post-comments-sheet--${sheetSnap} ${
            dragTop !== null ? "post-comments-sheet--dragging" : ""
          }`}
          style={{ top: `${activeTop}px` }}
        >
          <div
            className="post-comments-sheet__handle-zone"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            <div className="post-comments-sheet__grabber" />
            <div className="post-comments-sheet__header">
              <span className="post-comments-sheet__title">Comments</span>
              <span className="post-comments-sheet__count">
                {post._count?.comments ?? 0}
              </span>
            </div>
          </div>

          <div className="post-comments-sheet__body">
            <CommentSection
              postId={post.id}
              targetCommentId={targetCommentId}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(
    isMobile ? mobileModalNode : desktopModalNode,
    document.body
  );
};

export default PostModal;
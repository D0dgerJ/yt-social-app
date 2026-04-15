import React, { useCallback } from "react";
import { toast } from "react-toastify";
import { MdLabel, MdEmojiEmotions, MdLocationPin } from "react-icons/md";

import useUploadPost from "../../hooks/useUploadPost";
import { createPost } from "../../utils/api/post.api";

import MediaPicker from "./parts/MediaPicker";
import MediaPreviewList from "./parts/MediaPreviewList";
import TagInput from "./parts/TagInput";
import EmojiPickerWrapper from "./parts/EmojiPickerWrapper";

import {
  IMAGE_MIME,
  VIDEO_MIME,
  FILE_MIME,
  MAX_TOTAL_FILES,
} from "../../constants/mime";

import "./UploadPost.scss";

const UploadPost: React.FC = () => {
  const {
    text,
    tags,
    location,
    previews,
    showTags,
    showEmoji,
    showLocation,
    isSubmitting,
    errors,

    setText,
    setLocation,
    addTag,
    removeTag,
    toggleTags,
    toggleEmoji,
    toggleLocation,

    addFiles,
    removeFile,
    clearFiles,

    submit,
  } = useUploadPost();

  const accept = [...IMAGE_MIME, ...VIDEO_MIME, ...FILE_MIME].join(",");

  const handleSubmit = useCallback(async () => {
    if (!text.trim() && previews.length === 0) {
      toast.error("Нельзя отправить пустой пост");
      return;
    }

    const payload = await submit();
    if (!payload) {
      errors.forEach((e) => toast.error(e));
      return;
    }

    try {
      await createPost({
        desc: payload.desc,
        images: payload.images,
        videos: payload.videos,
        files: payload.files,
        tags: payload.tags,
        location: payload.location,
      });

      toast.success("Post created");
      setText("");
      clearFiles();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "Failed to create post";
      toast.error(msg);
    }
  }, [text, previews.length, submit, errors, setText, clearFiles]);

  return (
    <section className="upload-post">
      <div className="upload-post__wrapper">
        <div className="upload-post__top">
          <textarea
            className="upload-post__input"
            placeholder="Что у тебя нового?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
          />
        </div>

        {previews.length > 0 && (
          <div className="upload-post__preview-list">
            <MediaPreviewList previews={previews} onRemove={removeFile} />
          </div>
        )}

        {showTags && (
          <div className="upload-post__section">
            <TagInput tags={tags} onAdd={addTag} onRemove={removeTag} />
          </div>
        )}

        <div className="upload-post__section upload-post__section--emoji">
          <EmojiPickerWrapper
            open={showEmoji}
            onToggle={toggleEmoji}
            onPick={(emoji) => setText((prev) => prev + emoji)}
          />
        </div>

        {showLocation && (
          <div className="upload-post__location">
            <input
              type="text"
              placeholder="Добавить локацию"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        )}

        <div className="upload-post__divider" />

        <div className="upload-post__bottom">
          <div className="upload-post__options">
            <MediaPicker
              onPick={addFiles}
              accept={accept}
              maxCount={MAX_TOTAL_FILES}
            />

            <button
              type="button"
              className={`upload-post__option ${showTags ? "is-active" : ""}`}
              onClick={toggleTags}
            >
              <MdLabel className="upload-post__icon" />
              <span>Tags</span>
            </button>

            <button
              type="button"
              className={`upload-post__option ${showEmoji ? "is-active" : ""}`}
              onClick={toggleEmoji}
            >
              <MdEmojiEmotions className="upload-post__icon" />
              <span>Emoji</span>
            </button>

            <button
              type="button"
              className={`upload-post__option ${showLocation ? "is-active" : ""}`}
              onClick={toggleLocation}
            >
              <MdLocationPin className="upload-post__icon" />
              <span>Location</span>
            </button>
          </div>

          <button
            type="button"
            className="upload-post__button"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Uploading..." : "Publish"}
          </button>
        </div>

        {errors.length > 0 && (
          <div className="upload-errors">
            {errors.map((e, i) => (
              <div className="error" key={i}>
                {e}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default UploadPost;
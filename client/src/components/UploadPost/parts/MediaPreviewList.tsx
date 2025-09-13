import React, { useMemo } from "react";
import { PreviewItem } from "../../../hooks/useUploadPost";

type Props = {
  previews: PreviewItem[];
  onRemove(index: number): void;
};

const MediaPreviewList: React.FC<Props> = ({ previews, onRemove }) => {
  const groups = useMemo(() => {
    const images: number[] = [];
    const videos: number[] = [];
    const files: number[] = [];
    previews.forEach((p, i) => {
      if (p.kind === "image") images.push(i);
      else if (p.kind === "video") videos.push(i);
      else files.push(i);
    });
    return { images, videos, files };
  }, [previews]);

  return (
    <div className="upload-post__preview-list">
      <div className="upload-post__preview-images">
        {groups.images.map((i) => (
          <div className="upload-post__preview-wrapper" key={`img-${i}`}>
            <img src={previews[i].url} className="upload-post__preview" />
            <button
              onClick={() => onRemove(i)}
              className="upload-post__remove"
              type="button"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="upload-post__preview-videos">
        {groups.videos.map((i) => (
          <div className="upload-post__preview-wrapper" key={`vid-${i}`}>
            <video
              controls
              src={previews[i].url}
              className="upload-post__preview-video"
            />
            <button
              onClick={() => onRemove(i)}
              className="upload-post__remove"
              type="button"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="upload-post__preview-files">
        {groups.files.map((i) => (
          <div className="upload-post__file-wrapper" key={`file-${i}`}>
            <span className="upload-post__file-name">{previews[i].name}</span>
            <button
              onClick={() => onRemove(i)}
              className="upload-post__remove"
              type="button"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaPreviewList;

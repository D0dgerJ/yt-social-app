import React from "react";
import { MdPermMedia } from "react-icons/md";

type Props = {
  onPick(files: FileList | File[]): void;
  accept?: string;
  maxCount?: number;
};

const MediaPicker: React.FC<Props> = ({ onPick, accept, maxCount }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    onPick(e.target.files);
    e.target.value = "";
  };

  return (
    <label htmlFor="upload-media-input" className="upload-post__option">
      <MdPermMedia className="upload-post__icon upload-post__icon--orange" />
      <span>Photo / Video / File</span>
      <input
        type="file"
        id="upload-media-input"
        multiple
        accept={accept}
        hidden
        onChange={handleChange}
      />
    </label>
  );
};

export default MediaPicker;

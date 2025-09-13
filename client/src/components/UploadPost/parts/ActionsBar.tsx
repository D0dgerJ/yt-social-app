import React from "react";
import { MdLabel, MdEmojiEmotions, MdLocationPin } from "react-icons/md";

type Props = {
  onPickMedia(): void;  
  onToggleTags(): void;
  onToggleEmoji(): void;
  onToggleLocation(): void;
};

const ActionsBar: React.FC<Props> = ({
  onToggleTags,
  onToggleEmoji,
  onToggleLocation,
}) => {
  return (
    <div className="upload-post__options">
      <div className="upload-post__option" onClick={onToggleTags}>
        <MdLabel className="upload-post__icon upload-post__icon--blue" />
        <span>Tags</span>
      </div>
      <div className="upload-post__option" onClick={onToggleEmoji}>
        <MdEmojiEmotions className="upload-post__icon upload-post__icon--yellow" />
        <span>Emoji</span>
      </div>
      <div className="upload-post__option" onClick={onToggleLocation}>
        <MdLocationPin className="upload-post__icon upload-post__icon--green" />
        <span>Location</span>
      </div>
    </div>
  );
};

export default ActionsBar;

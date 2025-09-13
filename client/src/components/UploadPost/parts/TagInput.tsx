import React, { useState } from "react";

type Props = {
  tags: string[];
  onAdd(tag: string): void;
  onRemove(tag: string): void;
};

const TagInput: React.FC<Props> = ({ tags, onAdd, onRemove }) => {
  const [value, setValue] = useState("");

  const submit = () => {
    const clean = value.trim().replace(/^#/, "");
    if (!clean) return;
    if (tags.includes(clean)) {
      setValue("");
      return;
    }
    onAdd(clean);
    setValue("");
  };

  return (
    <div className="upload-post__tags">
      <div className="upload-post__tag-input-wrapper">
        <span className="upload-post__tag-prefix">#</span>
        <input
          className="upload-post__tag-input"
          type="text"
          placeholder="place your tag and press enter"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
      </div>

      <div className="upload-post__tag-list">
        {tags.map((tag) => (
          <span key={tag} className="upload-post__tag">
            #{tag}
            <button type="button" onClick={() => onRemove(tag)}>
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default TagInput;

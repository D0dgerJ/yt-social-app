import React from "react";

type Props = {
  disabled: boolean;
  loading: boolean;
  onSubmit(): void;
  chars?: number;
};

const SubmitBar: React.FC<Props> = ({ disabled, loading, onSubmit, chars }) => {
  return (
    <div className="submit-bar">
      {typeof chars === "number" && (
        <span className="char-count">{chars} chars</span>
      )}
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || loading}
        className="submit-btn"
      >
        {loading ? "Posting..." : "Post"}
      </button>
    </div>
  );
};

export default SubmitBar;

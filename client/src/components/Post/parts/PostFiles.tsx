import React from "react";

const PostFiles: React.FC<{ files?: string[]; listClassName?: string }> = ({
  files,
  listClassName = "post-files",
}) => {
  if (!files?.length) return null;

  return (
    <div className={listClassName}>
      {files.map((url, index) => {
        const name = url.split("/").pop() || `file-${index + 1}`;
        return (
          <div className="post-file-wrapper" key={index}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="post-file-link"
            >
              📎 {name}
            </a>
          </div>
        );
      })}
    </div>
  );
};

export default PostFiles;

import React from "react";
import { useTranslation } from "react-i18next";
import { toAbsoluteMediaUrl } from "@/utils/mediaUrl";

interface PostFilesProps {
  files?: string[];
}

const PostFiles: React.FC<PostFilesProps> = ({ files = [] }) => {
  const { t } = useTranslation();

  const getFileName = (url: string) => {
    try {
      const parsed = new URL(url);
      return decodeURIComponent(parsed.pathname.split("/").pop() || t("common.file"));
    } catch {
      return decodeURIComponent(url.split("/").pop() || t("common.file"));
    }
  };

  const normalizedFiles = files
    .filter(Boolean)
    .map((file) => toAbsoluteMediaUrl(file));

  if (!normalizedFiles.length) return null;

  return (
    <div className="post-files">
      {normalizedFiles.map((file, index) => (
        <div className="post-file-wrapper" key={`${file}-${index}`}>
          <a
            href={file}
            target="_blank"
            rel="noopener noreferrer"
            className="post-file-link"
          >
            {getFileName(file)}
          </a>
        </div>
      ))}
    </div>
  );
};

export default PostFiles;
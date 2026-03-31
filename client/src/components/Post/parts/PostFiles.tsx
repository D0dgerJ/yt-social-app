import React from 'react';
import { toAbsoluteMediaUrl } from '@/utils/mediaUrl';

interface PostFilesProps {
  files?: string[];
}

const getFileName = (url: string) => {
  try {
    const parsed = new URL(url);
    return decodeURIComponent(parsed.pathname.split('/').pop() || 'Файл');
  } catch {
    return decodeURIComponent(url.split('/').pop() || 'Файл');
  }
};

const PostFiles: React.FC<PostFilesProps> = ({ files = [] }) => {
  const normalizedFiles = files
    .filter(Boolean)
    .map((file) => toAbsoluteMediaUrl(file));

  if (!normalizedFiles.length) return null;

  return (
    <div className="post-files">
      {normalizedFiles.map((file, index) => (
        <a
          key={`${file}-${index}`}
          href={file}
          target="_blank"
          rel="noopener noreferrer"
          className="post-file-link"
        >
          {getFileName(file)}
        </a>
      ))}
    </div>
  );
};

export default PostFiles;
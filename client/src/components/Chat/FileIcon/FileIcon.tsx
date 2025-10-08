import React from 'react';
import {
  File as FileIconBase,
  FileText,
  FileJson,
  FileArchive,
  FileAudio2,
  FileVideo2,
  FileSpreadsheet,
  FileCode2,
  FileImage,
  FileType2,
  FileSymlink
} from 'lucide-react';
import './FileIcon.scss';

export type FileKind =
  | 'pdf' | 'word' | 'excel' | 'powerpoint'
  | 'txt' | 'csv' | 'json'
  | 'image' | 'audio' | 'video'
  | 'archive' | 'code'
  | 'other';

export function getExt(nameOrUrl: string): string {
  try {
    const url = new URL(nameOrUrl);
    nameOrUrl = url.pathname;
  } catch {/**/}
  const fname = nameOrUrl.split('/').pop() || '';
  const dot = fname.lastIndexOf('.');
  return dot >= 0 ? fname.slice(dot + 1).toLowerCase() : '';
}

export function detectKind(ext: string): FileKind {
  if (!ext) return 'other';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'rtf', 'odt'].includes(ext)) return 'word';
  if (['xls', 'xlsx'].includes(ext)) return 'excel';
  if (['ppt', 'pptx'].includes(ext)) return 'powerpoint';
  if (['txt', 'md', 'log'].includes(ext)) return 'txt';
  if (['csv'].includes(ext)) return 'csv';
  if (['json'].includes(ext)) return 'json';
  if (['png','jpg','jpeg','webp','gif','bmp','tiff','svg'].includes(ext)) return 'image';
  if (['mp3','wav','ogg','m4a','flac'].includes(ext)) return 'audio';
  if (['mp4','mkv','mov','avi','webm'].includes(ext)) return 'video';
  if (['zip','rar','7z','tar','gz'].includes(ext)) return 'archive';
  if (['js','ts','tsx','css','scss','html','xml','yml','yaml','sh','py','java','rb','go','c','cpp','rs','php'].includes(ext)) return 'code';
  return 'other';
}

const iconByKind: Record<FileKind, React.ElementType> = {
  pdf: FileText,
  word: FileText,
  excel: FileSpreadsheet,
  powerpoint: FileType2,
  txt: FileText,
  csv: FileSpreadsheet,
  json: FileJson,
  image: FileImage,
  audio: FileAudio2,
  video: FileVideo2,
  archive: FileArchive,
  code: FileCode2,
  other: FileIconBase,
};

interface Props {
  nameOrUrl: string;
  className?: string;
  size?: number;
  showExtBadge?: boolean;
}

const FileIcon: React.FC<Props> = ({ nameOrUrl, className, size = 18, showExtBadge = true }) => {
  const ext = getExt(nameOrUrl);
  const kind = detectKind(ext);
  const Icon = iconByKind[kind] ?? FileIconBase;

  return (
    <span className={`file-icon file-icon--${kind} ${className ?? ''}`}>
      <Icon size={size} aria-hidden />
      {showExtBadge && (
        <span className="file-icon__badge">{ext || 'file'}</span>
      )}
    </span>
  );
};

export default FileIcon;

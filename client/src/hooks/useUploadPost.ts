import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  assertAllowed,
  assertTotalCount,
  type MediaKind,
} from "../utils/fileGuards";
import { createObjectUrl, revokeMany } from "../utils/objectUrl";
import { uploadMedia } from "../services/uploadMedia";

export type PreviewItem = {
  kind: MediaKind;
  url: string;
  name: string;
  size: number;
};

export type UseUploadPostState = {
  text: string;
  tags: string[];
  location: string;
  files: File[];
  previews: PreviewItem[];
  showTags: boolean;
  showEmoji: boolean;
  showLocation: boolean;
  isSubmitting: boolean;
  errors: string[];
};

export type UseUploadPostReturn = UseUploadPostState & {
  setText: Dispatch<SetStateAction<string>>;
  setLocation: Dispatch<SetStateAction<string>>;
  addTag(tag: string): void;
  removeTag(tag: string): void;
  toggleTags(): void;
  toggleEmoji(): void;
  toggleLocation(): void;

  addFiles(incoming: FileList | File[]): void;
  removeFile(index: number): void;
  clearFiles(): void;

  submit(): Promise<{
    desc: string;
    images: string[];
    videos: string[];
    files: string[];
    tags: string[];
    location: string;
  } | null>;
};

export default function useUploadPost(
  initial?: Partial<UseUploadPostState>
): UseUploadPostReturn {
  const [text, setText] = useState(initial?.text ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [location, setLocation] = useState(initial?.location ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [showTags, setShowTags] = useState(initial?.showTags ?? false);
  const [showEmoji, setShowEmoji] = useState(initial?.showEmoji ?? false);
  const [showLocation, setShowLocation] = useState(initial?.showLocation ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    return () => revokeMany(previews.map((p) => p.url));
  }, [previews]);

  const toggleTags = useCallback(() => setShowTags((s) => !s), []);
  const toggleEmoji = useCallback(() => setShowEmoji((s) => !s), []);
  const toggleLocation = useCallback(() => setShowLocation((s) => !s), []);

  const addTag = useCallback((tag: string) => {
    const t = tag.trim().replace(/^#/, "");
    if (!t) return;
    setTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
  }, []);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((x) => x !== tag));
  }, []);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const arr = Array.from(incoming);
      const issues: string[] = [];

      const totalCheck = assertTotalCount(files.length, arr.length);
      if (!totalCheck.ok) {
        setErrors([totalCheck.reason!]);
        return;
      }

      const accepted: File[] = [];
      const newPreviews: PreviewItem[] = [];

      for (const f of arr) {
        const ok = assertAllowed(f);
        if (!ok.ok) {
          issues.push(`${f.name}: ${ok.reason}`);
          continue;
        }
        accepted.push(f);
        newPreviews.push({
          kind: ok.kind,
          url: createObjectUrl(f),
          name: f.name,
          size: f.size,
        });
      }

      if (issues.length) setErrors(issues);

      if (accepted.length) {
        setFiles((prev) => [...prev, ...accepted]);
        setPreviews((prev) => [...prev, ...newPreviews]);
      }
    },
    [files.length]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const removed = prev[index]?.url;
      if (removed) revokeMany([removed]);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const clearFiles = useCallback(() => {
    revokeMany(previews.map((p) => p.url));
    setFiles([]);
    setPreviews([]);
  }, [previews]);

  const submit = useCallback(async () => {
    if (isSubmitting) return null;
    setIsSubmitting(true);
    setErrors([]);

    try {
      const result = await uploadMedia(files);
      return {
        desc: text.trim(),
        images: result.images,
        videos: result.videos,
        files: result.files,
        tags,
        location: location.trim(),
      };
    } catch (e: any) {
      setErrors([e?.message || "Upload failed"]);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [files, text, tags, location, isSubmitting]);

  return {
    text,
    tags,
    location,
    files,
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
  };
}

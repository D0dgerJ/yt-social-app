import React, { useContext, useState, ChangeEvent } from "react";
import EmojiPicker from "emoji-picker-react";
import {
  MdLabel,
  MdPermMedia,
  MdEmojiEmotions,
  MdLocationPin,
} from "react-icons/md";
import { createPost } from "../../utils/api/index";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import userPic from "../Post/assets/user.png";
import "./UploadPost.scss";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const UploadPost: React.FC = () => {
  const [desc, setDesc] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<
    { url: string; type: string; name?: string }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useContext(AuthContext);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [showTags, setShowTags] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "video/mp4",
      "application/pdf",
      "application/zip",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    const validFiles = selectedFiles.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.warn(`Файл ${file.name} имеет неподдерживаемый формат`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.warn(`Файл ${file.name} превышает 100MB и будет отклонён`);
        return false;
      }
      return true;
    });

    if (validFiles.length + files.length > MAX_FILES) {
      toast.error(`Можно загрузить максимум ${MAX_FILES} файлов`);
      return;
    }

    setFiles((prev) => [...prev, ...validFiles]);

    const newPreviews = validFiles.map((file) => {
      let type = "file";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.startsWith("video/")) type = "video";

      return {
        url: type !== "file" ? URL.createObjectURL(file) : "",
        type,
        name: file.name,
      };
    });

    setPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const uploadToCloudinary = async (
    file: File
  ): Promise<{ url: string; type: "image" | "video" | "file" }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "yt-social-app");
    formData.append("cloud_name", "di1pka45a");

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const resourceType = isImage ? "image" : isVideo ? "video" : "raw";

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/di1pka45a/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    return {
      url: data.secure_url,
      type: isImage ? "image" : isVideo ? "video" : "file",
    };
  };

  const handlePostUpload = async () => {
    if (!user?.id) return;

    if (files.length === 0 && !desc.trim()) {
      toast.error("Нельзя отправить пустой пост");
      return;
    }

    setLoading(true);
    try {
      const imageUrls: string[] = [];
      const videoUrls: string[] = [];
      const fileUrls: string[] = [];

      for (const file of files) {
        const { url, type } = await uploadToCloudinary(file);
        if (type === "image") imageUrls.push(url);
        else if (type === "video") videoUrls.push(url);
        else fileUrls.push(url);
      }

      const payload = {
        desc,
        images: imageUrls,
        videos: videoUrls,
        files: fileUrls,
        tags,
        location,
      };

      const res = await createPost(payload);
      toast.success("Пост успешно опубликован!");
      setFiles([]);
      setPreviews([]);
      setDesc("");
      setTags([]);
      setTagInput("");
      setLocation("");
      console.log(res);
    } catch (error: any) {
      console.error(error);
      toast.error("Ошибка при публикации поста");
    } finally {
      setLoading(false);
    }
  };

  const removePreview = (index: number) => {
    setPreviews(previews.filter((_, i) => i !== index));
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    const cleanTag = tagInput.trim();
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleEmojiClick = (emojiData: any) => {
    setDesc((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="upload-post">
      <div className="upload-post__wrapper">
        <div className="upload-post__top">
          <img
            src={user?.profilePicture || userPic}
            alt="profile"
            className="upload-post__profile-pic"
          />
          <input
            type="text"
            placeholder="What is on your mind?"
            className="upload-post__input"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        {showTags && (
          <div className="upload-post__tags">
            <input
              type="text"
              placeholder="Add a tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            />
            <div className="upload-post__tag-list">
              {tags.map((tag, index) => (
                <span key={index} className="upload-post__tag">
                  #{tag}
                  <button type="button" onClick={() => handleRemoveTag(index)}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {showLocation && (
          <div className="upload-post__location">
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        )}

        {showEmojiPicker && (
          <div className="upload-post__emoji-picker">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        {previews.length > 0 && (
          <div className="upload-post__preview-list">
            <div className="upload-post__preview-images">
              {previews.map((p, idx) =>
                p.type === "image" ? (
                  <div className="upload-post__preview-wrapper" key={idx}>
                    <img src={p.url} className="upload-post__preview" />
                    <button
                      onClick={() => removePreview(idx)}
                      className="upload-post__remove"
                    >
                      ✕
                    </button>
                  </div>
                ) : null
              )}
            </div>
            <div className="upload-post__preview-videos">
              {previews.map((p, idx) =>
                p.type === "video" ? (
                  <div className="upload-post__preview-wrapper" key={idx}>
                    <video
                      controls
                      src={p.url}
                      className="upload-post__preview-video"
                    />
                    <button
                      onClick={() => removePreview(idx)}
                      className="upload-post__remove"
                    >
                      ✕
                    </button>
                  </div>
                ) : null
              )}
            </div>
            <div className="upload-post__preview-files">
              {previews.map((p, idx) =>
                p.type === "file" ? (
                  <div className="upload-post__file-wrapper" key={idx}>
                    <span className="upload-post__file-name">{p.name}</span>
                    <button
                      onClick={() => removePreview(idx)}
                      className="upload-post__remove"
                    >
                      ✕
                    </button>
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}

        <hr className="upload-post__divider" />
        <div className="upload-post__bottom">
          <div className="upload-post__options">
            <label htmlFor="file" className="upload-post__option">
              <MdPermMedia className="upload-post__icon upload-post__icon--orange" />
              <span>Photo / Video / File</span>
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                accept=".png,.jpg,.jpeg,.mp4,.pdf,.zip,.doc,.docx,.txt"
                multiple
                hidden
              />
            </label>
            <div
              className="upload-post__option"
              onClick={() => setShowTags((prev) => !prev)}
            >
              <MdLabel className="upload-post__icon upload-post__icon--blue" />
              <span>Tags</span>
            </div>
            <div
              className="upload-post__option"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
            >
              <MdEmojiEmotions className="upload-post__icon upload-post__icon--yellow" />
              <span>Emoji</span>
            </div>
            <div
              className="upload-post__option"
              onClick={() => setShowLocation((prev) => !prev)}
            >
              <MdLocationPin className="upload-post__icon upload-post__icon--green" />
              <span>Location</span>
            </div>
          </div>
          <button
            disabled={loading}
            onClick={handlePostUpload}
            className="upload-post__button"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPost;

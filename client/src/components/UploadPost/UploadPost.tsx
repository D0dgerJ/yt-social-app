import React, { useContext, useState, ChangeEvent } from "react";
import {
  MdLabel,
  MdPermMedia,
  MdEmojiEmotions,
  MdLocationPin,
} from "react-icons/md";
import { createPost } from "../../utils/api/index"
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import userPic from "../Post/assets/user.png";
import "./UploadPost.scss";

const UploadPost: React.FC = () => {
  const [desc, setDesc] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { user } = useContext(AuthContext);

  const handlePostUpload = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("desc", desc);

      if (file) {
        const type = file.type;
        if (type.startsWith("image/")) {
          formData.append("images", file);
        } else if (type.startsWith("video/")) {
          formData.append("videos", file);
        } else {
          formData.append("files", file);
        }
      }

      const res = await createPost(formData);
      toast.success("Post has been uploaded successfully!");
      setFile(null);
      setPreview(null);
      setDesc("");
      console.log(res);
    } catch (error: any) {
      console.error(error);
      toast.error("Post upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    } else {
      setPreview(null);
    }
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
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="upload-post__preview"
            />
          )}
        </div>
        <hr className="upload-post__divider" />
        <div className="upload-post__bottom">
          <div className="upload-post__options">
            <label htmlFor="file" className="upload-post__option">
              <MdPermMedia className="upload-post__icon upload-post__icon--orange" />
              <span>Photo or Video</span>
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                accept=".png, .jpg, .jpeg"
                hidden
              />
            </label>
            <div className="upload-post__option">
              <MdLabel className="upload-post__icon upload-post__icon--blue" />
              <span>Tags</span>
            </div>
            <div className="upload-post__option">
              <MdEmojiEmotions className="upload-post__icon upload-post__icon--yellow" />
              <span>Emoji</span>
            </div>
            <div className="upload-post__option">
              <MdLocationPin className="upload-post__icon upload-post__icon--green" />
              <span>Location</span>
            </div>
          </div>
          <button
            disabled={loading}
            onClick={handlePostUpload}
            className="upload-post__button"
          >
            {loading ? "Uploading" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPost;

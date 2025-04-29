import React, { useContext, useState } from "react";
import {
  MdLabel,
  MdPermMedia,
  MdEmojiEmotions,
  MdLocationPin,
} from "react-icons/md";
import { uploadPost } from "../../utils/api/api";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import userPic from "../Post/assets/user.png";
import "./UploadPost.scss";

const UploadPost = () => {
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const { user } = useContext(AuthContext);

  const handlePostUpload = async () => {
    setLoading(true);
    try {
      const res = await uploadPost(desc, file);
      toast.success("Post has been Uploaded Successfully!");
      setFile(null);
      setPreview(null);
      setDesc("");
      console.log(res);
    } catch (error) {
      console.log(error);
      toast.error("Post Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
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
            src={user.profilePicture ? user.profilePicture : userPic}
            alt="profilepic"
            className="upload-post__profile-pic"
          />
          <input
            type="text"
            placeholder="What is on your mind?"
            className="upload-post__input"
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

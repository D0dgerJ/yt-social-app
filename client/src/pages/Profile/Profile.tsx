import "./Profile.scss"; // Подключим SCSS
import React, { useContext, useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import coverImage from "./assets/coverImage.jpg";
import userImage from "./assets/userImage.jpg";
import NewsFeed from "../../components/NewsFeed/NewsFeed";
import Rightbar from "../../components/Rightbar/Rightbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import { API, getUserProfileData } from "../../utils/api/api";
import { useParams } from "react-router-dom";
import noProfilePic from "./assets/user.png";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";

const Profile = () => {
  const { username } = useParams();
  const [user, setUser] = useState({});
  const { user: currentUser } = useContext(AuthContext);
  const [editMode, setEditMode] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUserProfileInfo = async () => {
      try {
        const res = await getUserProfileData(username);
        setUser(res.data.userInfo);
      } catch (error) {
        console.log(error);
      }
    };
    getUserProfileInfo();
  }, [username]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      setProfileImage(file);
      setEditMode(true);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    if (previewImage) {
      const formData = new FormData();
      formData.append("profilePicture", profileImage);
      try {
        const res = await API.put(
          `/users/${currentUser.id}/profile-picture`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success(res.data.message);
        setLoading(false);
        setUser({ ...user, profilePicture: res.data.user.profilePicture });
        setPreviewImage(null);
        setEditMode(false);
      } catch (error) {
        setLoading(false);
        toast.error("Failed to Update Profile Picture");
        console.log(error);
      }
    } else {
      setEditMode(false);
    }
  };

  const handleCancel = () => {
    setPreviewImage(null);
    setEditMode(false);
  };

  return (
  <div className="profile-page">
    <Navbar />
    <div className="profile-wrapper">
      <Sidebar />
      <div className="profile-content">
        <div className="profile-top">
          <img
            src={user.coverPicture || coverImage}
            alt="cover"
            className="profile-cover-img"
          />
          <img
            src={previewImage || user.profilePicture || noProfilePic}
            alt="profile"
            className="profile-user-img"
          />
        </div>
        <div className="profile-info">
          <h1 className="profile-username">{user.username}</h1>
          <span className="profile-desc">{user.desc || "I am new here!"}</span>
          {username === currentUser?.username && (
            <>
              {editMode ? (
                <>
                  <button
                    onClick={handleSave}
                    className="profile-save-btn"
                  >
                    {loading ? "Saving Changes" : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="profile-cancel-btn"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <label
                    htmlFor="profilePicture"
                    className="profile-edit-btn"
                  >
                    Edit Profile
                  </label>
                  <input
                    type="file"
                    id="profilePicture"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </>
              )}
            </>
          )}
        </div>
        <div className="profile-bottom flex">
          <NewsFeed userPosts />
          <Rightbar user={user} />
        </div>
      </div>
    </div>
  </div>
);
};

export default Profile;

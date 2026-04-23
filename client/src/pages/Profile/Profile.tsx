import "./Profile.scss";
import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/Navbar/Navbar";
import coverImage from "./assets/coverImage.jpg";
import noProfilePic from "./assets/user.png";
import NewsFeed from "../../components/NewsFeed/NewsFeed";
import Rightbar from "../../components/Rightbar/Rightbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import {
  getUserByUsername,
  updateProfilePicture,
  uploadFile,
} from "../../utils/api/user.api";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import FriendButton from "../../components/FriendButton/FriendButton";

interface User {
  id: number;
  username: string;
  desc?: string;
  profilePicture?: string;
  coverPicture?: string;
}

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, dispatch } = useContext(AuthContext);
  const { t } = useTranslation();

  const [user, setUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (username) {
          const res = await getUserByUsername(username);
          setUser(res);
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }
    };

    fetchUserProfile();
  }, [username]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      setProfileImage(file);
      setEditMode(true);
    }
  };

  const handleSave = async () => {
    if (!profileImage || !user) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", profileImage);

    try {
      const uploadRes = await uploadFile(formData);

      const uploadedUrl = uploadRes?.url || uploadRes?.urls?.[0]?.url;

      if (!uploadedUrl) {
        throw new Error(t("profile.uploadReturnedNoUrl"));
      }

      const res = await updateProfilePicture(user.id, uploadedUrl);
      const nextProfilePicture = res?.profilePicture || uploadedUrl;

      toast.success(t("profile.profilePictureUpdated"));

      setUser((prev) =>
        prev
          ? { ...prev, profilePicture: nextProfilePicture }
          : prev
      );

      dispatch({
        type: "UPDATE_USER",
        payload: { profilePicture: nextProfilePicture },
      });
    } catch (error) {
      toast.error(t("profile.failedToUpdateProfilePicture"));
      console.error(error);
    } finally {
      setLoading(false);
      setEditMode(false);
      setPreviewImage(null);
      setProfileImage(null);
    }
  };

  const handleCancel = () => {
    setPreviewImage(null);
    setEditMode(false);
    setProfileImage(null);
  };

  const isOwnProfile = username === currentUser?.username;

  return (
    <>
      <Navbar />

      <div className="layout">
        <div className="sidebar-wrapper">
          <Sidebar />
        </div>

        <main className="newsfeed-wrapper">
          <section className="profile-hero">
            <div className="profile-top">
              <img
                src={user?.coverPicture || coverImage}
                alt="cover"
                className="profile-cover-img"
              />

              <img
                src={previewImage || user?.profilePicture || noProfilePic}
                alt="profile"
                className="profile-user-img"
              />
            </div>

            <div className="profile-info-card">
              <div className="profile-info">
                <h1 className="profile-username">{user?.username}</h1>
                <span className="profile-desc">
                  {user?.desc || t("profile.defaultDescription")}
                </span>

                <div className="profile-actions">
                  {isOwnProfile ? (
                    <>
                      {editMode ? (
                        <>
                          <button
                            type="button"
                            onClick={handleSave}
                            className="profile-save-btn"
                          >
                            {loading ? t("profile.saving") : t("profile.saveChanges")}
                          </button>

                          <button
                            type="button"
                            onClick={handleCancel}
                            className="profile-cancel-btn"
                          >
                            {t("common.cancel")}
                          </button>
                        </>
                      ) : (
                        <>
                          <label
                            htmlFor="profilePicture"
                            className="profile-edit-btn"
                          >
                            {t("profile.editProfile")}
                          </label>

                          <input
                            type="file"
                            id="profilePicture"
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/*"
                          />
                        </>
                      )}
                    </>
                  ) : (
                    user &&
                    currentUser?.id !== user.id && (
                      <FriendButton targetUserId={user.id} />
                    )
                  )}
                </div>
              </div>
            </div>
          </section>

          <NewsFeed mode="profile" />
        </main>

        <div className="rightbar-wrapper">
          <Rightbar user={user || undefined} />
        </div>
      </div>
    </>
  );
};

export default Profile;
import "./Profile.scss";
import React, { useContext, useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import coverImage from "./assets/coverImage.jpg";
import noProfilePic from "./assets/user.png";
import NewsFeed from "../../components/NewsFeed/NewsFeed";
import Rightbar from "../../components/Rightbar/Rightbar";
import Sidebar from "../../components/Sidebar/Sidebar";
import { getUserByUsername, updateProfilePicture } from "../../utils/api/user.api";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";

interface User {
  id: number;
  username: string;
  desc?: string;
  profilePicture?: string;
  coverPicture?: string;
}

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useContext(AuthContext);
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
          setUser(res.user);
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
    formData.append("profilePicture", profileImage);

    try {
      const res = await updateProfilePicture(formData);
      toast.success("Profile picture updated!");
      setUser({ ...user, profilePicture: res.profilePicture });
    } catch (error) {
      toast.error("Failed to update profile picture");
      console.error(error);
    } finally {
      setLoading(false);
      setEditMode(false);
      setPreviewImage(null);
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
          <div className="profile-info">
            <h1 className="profile-username">{user?.username}</h1>
            <span className="profile-desc">{user?.desc || "I am new here!"}</span>
            {username === currentUser?.username && (
              <>
                {editMode ? (
                  <>
                    <button onClick={handleSave} className="profile-save-btn">
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button onClick={handleCancel} className="profile-cancel-btn">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <label htmlFor="profilePicture" className="profile-edit-btn">
                      Edit Profile
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
            )}
          </div>
          <div className="profile-bottom flex">
            <NewsFeed userPosts />
            <Rightbar user={user || undefined} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

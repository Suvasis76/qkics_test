// src/profiles/normalProfile.jsx
import { useEffect, useState } from "react";
import { CiEdit } from "react-icons/ci";
import { MdEdit } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearPostViewState } from "../redux/slices/postViewSlice";
import { FaUser } from "react-icons/fa";


import axiosSecure from "../components/utils/axiosSecure";
import { useAlert } from "../context/AlertContext";
import { useConfirm } from "../context/ConfirmContext";


// Redux
import { loadUserPosts, removePost } from "../redux/slices/postsSlice";
import {
  fetchUserProfile,
  setActiveProfileData,
  clearActiveProfileData,
} from "../redux/slices/userSlice";


// UI Components
import UserDetails from "../profiles/basicDetails/userDetails";
import UserPosts from "../profiles/basicDetails/userPosts";
import ModalOverlay from "../components/ui/ModalOverlay";

export default function NormalProfile({
  readOnly = false,
  disableSelfFetch = false,
}) {
  const { theme, activeProfileData } = useSelector((state) => state.user);
  const profile = activeProfileData?.profile;

  const isDark = theme === "dark";
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const [showImageModal, setShowImageModal] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const postView = useSelector((state) => state.postView);


  const bg = isDark ? "bg-neutral-950" : "bg-neutral-100";
  const text = isDark ? "text-white" : "text-black";

  /* -------------------------------
      TAB HANDLING
  ------------------------------- */
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem("normalProfileTab") || "details";
  });

  useEffect(() => {
    sessionStorage.setItem("normalProfileTab", activeTab);
  }, [activeTab]);

  /* -------------------------------
      USER + EDIT FORM STATE
  ------------------------------- */
  const [profileUser, setProfileUser] = useState(profile || null);

  useEffect(() => {
    if (profile) setProfileUser(profile);
  }, [profile]);


  const [editMode, setEditMode] = useState(false);


  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);


  /* -------------------------------
      LOAD USER + DISPATCH POSTS
  ------------------------------- */
  useEffect(() => {
    if (disableSelfFetch) return;

    const loadProfile = async () => {
      try {
        const userRes = await axiosSecure.get("/v1/auth/me/");
        const user = userRes.data;

        setProfileUser(user);
        dispatch(setActiveProfileData({ role: "normal", profile: user }));

        setEditData({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          phone: user.phone || "",
        });

        dispatch(loadUserPosts(user.username));

        // ✅ ADD THIS LINE (sync Redux)
        dispatch(fetchUserProfile());
      } catch (err) {
        console.log("Profile load error:", err);
      }
    };

    loadProfile();

    return () => {
      if (!disableSelfFetch) {
        dispatch(clearActiveProfileData());
      }
    };
  }, [disableSelfFetch, dispatch]);



  /* -------------------------------
      When Redux posts load → sync locally
  ------------------------------- */
  // Removed local posts sync as UserPosts now uses Redux directly

  /* -------------------------------
      SAVE USER INFO
  ------------------------------- */
  const handleSaveUser = async () => {
    try {
      const res = await axiosSecure.patch("/v1/auth/me/update/", {
        first_name: editData.first_name,
        last_name: editData.last_name,
        ...(editData.phone ? { phone: editData.phone } : {}),
      });

      setProfileUser(res.data.user);

      // ✅ SYNC ACTIVE PROFILE DATA
      dispatch(setActiveProfileData({ role: "normal", profile: res.data.user }));

      setEditData({
        first_name: res.data.user.first_name || "",
        last_name: res.data.user.last_name || "",
        email: res.data.user.email || "",
        phone: res.data.user.phone || "",
      });

      // ✅ ADD THIS LINE
      dispatch(fetchUserProfile());

      setEditMode(false);
      showAlert("Profile updated successfully!", "success");
    } catch {
      showAlert("Failed updating profile", "error");
    }
  };


  /* -------------------------------
      UPDATE PROFILE PICTURE
  ------------------------------- */
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const res = await axiosSecure.patch("/v1/auth/me/update/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = res.data.user;
      setProfileUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // ✅ SYNC ACTIVE PROFILE DATA
      dispatch(setActiveProfileData({ role: "normal", profile: updatedUser }));

      dispatch(fetchUserProfile());

      showAlert("Profile picture updated!", "success");
    } catch (err) {
      console.log("Profile pic upload error:", err);
      showAlert("Upload failed!", "error");
    }
  };


  // Delete logic moved to UserPosts component


  // Restore tab + scroll IF coming back from comments
  useEffect(() => {
    if (postView.from === "normal-profile") {
      if (postView.tab) {
        setActiveTab(postView.tab);
      }

      setTimeout(() => {
        window.scrollTo(0, postView.scroll || 0);
      }, 50);
    }
  }, [postView]);



  useEffect(() => {
    if (!profile || !readOnly) return;

    setEditData({
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      email: profile.email || "",
      phone: profile.phone || "",
    });
  }, [profile, readOnly]);




  useEffect(() => {
    if (!profile || !readOnly) return;

    dispatch(loadUserPosts(profile.username));
  }, [profile, readOnly, dispatch]);



  /* -------------------------------
      LOADING STATE
  ------------------------------- */
  if (!profileUser) {
    return <div className={`mt-20 text-center ${text}`}>Loading...</div>;
  }

  /* -------------------------------
      MAIN UI
  ------------------------------- */
  return (
    <div className={`min-h-screen pt-20 pb-20 ${bg} ${text}`}>
      <div className="max-w-4xl mx-auto px-4">

        {/* HEADER */}
        <div
          className={`p-6 rounded-xl shadow flex flex-col md:flex-row gap-6 items-center mb-6 text-center md:text-left ${isDark ? "bg-neutral-900 text-white" : "bg-white text-black"
            }`}
        >
          <div className="relative w-28 h-28">
            {profileUser.profile_picture ? (
              <img
                src={`${profileUser.profile_picture}?t=${Date.now()}`}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover mx-auto cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowImageModal(true)}
              />
            ) : (
              <div className="w-28 h-28 bg-red-600 text-white rounded-full flex items-center justify-center text-5xl font-bold mx-auto">
                {profileUser?.first_name
                  ? profileUser.first_name.charAt(0).toUpperCase()
                  : profileUser?.username?.charAt(0).toUpperCase()}
              </div>
            )}

            {!readOnly && (
              <label className="absolute bottom-1 right-1 bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-black">
                <MdEdit />
                <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="hidden" />
              </label>
            )}
          </div>


          <div>
            <h1 className="text-3xl font-bold">
              {profileUser.first_name || profileUser.last_name
                ? `${profileUser.first_name} ${profileUser.last_name}`
                : profileUser.username}
            </h1>
            <p className="text-neutral-400 mt-2 mb-2"><span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium
                border transition-all
            
                border-blue-400 bg-blue-400/10 text-blue-500
                dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-300">@{profileUser?.username}</span> &nbsp;— &nbsp; <span
                className="
                inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium
                border transition-all
            
                border-grey-400 bg-grey-400/10 text-grey-500
                dark:border-grey-500 dark:bg-grey-500/20 dark:text-grey-300
              "
              >
                <FaUser />&nbsp;Normal
              </span>

            </p>
          </div>

          {!readOnly && (
            <button onClick={() => setShowUpgradeModal(true)}
              className="md:ml-auto px-5 py-2 rounded-md bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold shadow hover:opacity-90 w-full md:w-auto"
            >Upgrade</button>
          )}

        </div>

        {/* TABS */}
        <div className="flex justify-center gap-10 border-b pb-2">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-2 text-lg font-medium ${activeTab === "details" ? "text-red-500 border-b-2 border-red-500" : "text-neutral-500"
              }`}
          >
            About
          </button>

          <button
            onClick={() => setActiveTab("posts")}
            className={`pb-2 text-lg font-medium ${activeTab === "posts" ? "text-red-500 border-b-2 border-red-500" : "text-neutral-500"
              }`}
          >
            Posts
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="mt-6">
          {activeTab === "details" && (
            <UserDetails
              editMode={!readOnly && editMode}
              setEditMode={readOnly ? () => { } : setEditMode}
              editData={editData}
              setEditData={readOnly ? () => { } : setEditData}
              handleSave={handleSaveUser}
            />

          )}

          {activeTab === "posts" && (
            <UserPosts />
          )}
        </div>
      </div>

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <UpgradeModal
          close={() => setShowUpgradeModal(false)}
          navigate={navigate}
          isDark={isDark}
        />
      )}

      {/* PROFILE PICTURE MODAL */}
      {showImageModal && (
        <ModalOverlay close={() => setShowImageModal(false)}>
          <div className={`relative p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-center ${isDark ? "bg-neutral-900 border border-neutral-800" : "bg-white"}`}>
            <button
              onClick={() => setShowImageModal(false)}
              className={`absolute top-2 right-2 p-2 rounded-full transition-all ${isDark ? "text-neutral-400 hover:text-white hover:bg-neutral-800" : "text-neutral-500 hover:text-black hover:bg-neutral-100"
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={`${profileUser.profile_picture}?t=${Date.now()}`}
              alt="Profile Large"
              className="w-80 h-80 md:w-96 md:h-96 rounded-full object-cover shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

/* ----------------------------------------------------
   UPGRADE MODAL — Always Works
---------------------------------------------------- */
function UpgradeModal({ close, navigate, isDark }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-lg rounded-xl p-6 shadow-xl ${isDark ? "bg-neutral-900 text-white" : "bg-white text-black"
          }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Upgrade Your Account</h2>
          <button
            onClick={close}
            className="text-xl px-3 py-1 rounded-full hover:bg-neutral-200/20"
          >
            ✕
          </button>
        </div>

        <p className={`${isDark ? "text-neutral-400" : "text-neutral-600"} mb-6`}>
          Select the role you want to upgrade to.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => {
              close();
              navigate("/upgrade/expert");
            }}
            className={`cursor-pointer p-5 border rounded-xl shadow-sm transition hover:scale-105 hover:shadow-md ${isDark
              ? "bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
              : "bg-neutral-100 border-neutral-300 hover:bg-neutral-200"
              }`}
          >
            <div className="text-4xl mb-3">🎓</div>
            <h3 className="text-lg font-semibold">Become an Expert</h3>
            <p>Share your skills and offer expert-level guidance.</p>
          </div>

          <div
            onClick={() => {
              close();
              navigate("/upgrade/entrepreneur");
            }}
            className={`cursor-pointer p-5 border rounded-xl shadow-sm transition hover:scale-105 hover:shadow-md ${isDark
              ? "bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
              : "bg-neutral-100 border-neutral-300 hover:bg-neutral-200"
              }`}
          >
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-lg font-semibold">Become an Entrepreneur</h3>
            <p>Build your business profile and promote your services.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

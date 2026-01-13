// src/profiles/entrepreneur/EntrepreneurProfile.jsx

import { useEffect, useState, useRef } from "react";
import { CiEdit } from "react-icons/ci";
import { MdEdit } from "react-icons/md";
import axiosSecure from "../components/utils/axiosSecure";

import { useAlert } from "../context/AlertContext";
import { useConfirm } from "../context/ConfirmContext";
import { IoIosRocket } from "react-icons/io";

import { useDispatch, useSelector } from "react-redux";
import { loadUserPosts, removePost } from "../redux/slices/postsSlice";
import { fetchUserProfile, setActiveProfileData, clearActiveProfileData } from "../redux/slices/userSlice";


import UserDetails from "./basicDetails/userDetails";
import UserPosts from "./basicDetails/userPosts";
import EntrepreneurDetails from "./entrepreneurDetails/entrepreneurDetails";
import ModalOverlay from "../components/ui/ModalOverlay";

import { MdOutlineManageAccounts } from "react-icons/md";
import { RiAdvertisementLine } from "react-icons/ri";

import useLike from "../components/hooks/useLike";
import { getAccessToken } from "../redux/store/tokenManager";

export default function EntrepreneurProfile({
  profile: propProfile,
  readOnly = false,
  disableSelfFetch = false,
}) {
  const { theme, activeProfileData, data: loggedUser } = useSelector((state) => state.user);
  const profile = activeProfileData?.profile || propProfile;

  const isDark = theme === "dark";

  const dispatch = useDispatch();
  const postsRedux = useSelector((state) => state.posts.items);
  const postView = useSelector((state) => state.postView);

  // 🔑 auth user
  const reduxUser = useSelector((state) => state.user.data);

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  /* --------------------------
      USER + ENTREPRENEUR DATA
  --------------------------- */
  const [entreData, setEntreData] = useState(profile || null);
  const user = entreData?.user || null;
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (profile) setEntreData(profile);
  }, [profile]);

  /* --------------------------
      POSTS STATE
  --------------------------- */
  // Removed local posts sync as UserPosts now uses Redux directly

  // 🔑 LOAD POSTS FOR OWN PROFILE
  useEffect(() => {
    if (!readOnly && user?.username) {
      dispatch(loadUserPosts(user.username));
    }
  }, [readOnly, user?.username, dispatch]);

  // Load posts when viewing other user's profile
  useEffect(() => {
    if (!profile || !readOnly) return;
    dispatch(loadUserPosts(profile.user.username));
  }, [profile, readOnly, dispatch]);

  /* --------------------------
      TAB STATE
  --------------------------- */
  const [activeTab, setActiveTab] = useState(
    sessionStorage.getItem("entrepreneurActiveTab") || "about"
  );

  useEffect(() => {
    sessionStorage.setItem("entrepreneurActiveTab", activeTab);
  }, [activeTab]);

  const [leftActive, setLeftActive] = useState("user-details");

  /* --------------------------
      EDIT USER STATE
  --------------------------- */
  const [editUser, setEditUser] = useState(false);
  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  useEffect(() => {
    if (!editUser || !user) return;

    setEditData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
    });
  }, [editUser, user]);


  /* --------------------------
      FETCH SELF PROFILE  ✅ FIXED
  --------------------------- */
  useEffect(() => {
    if (!disableSelfFetch) {
      axiosSecure.get("/v1/entrepreneurs/me/profile/").then((res) => {
        setEntreData(res.data);
        dispatch(setActiveProfileData({ role: "entrepreneur", profile: res.data }));

        // ✅ ADD THIS LINE
        dispatch(fetchUserProfile());
      });
    }

    return () => {
      if (!disableSelfFetch) {
        dispatch(clearActiveProfileData());
      }
    };
  }, [disableSelfFetch, dispatch]);


  /* --------------------------
      SAVE USER  ✅ FIXED
  --------------------------- */
  const handleSaveUser = async () => {
    try {
      await axiosSecure.patch("/v1/auth/me/update/", {
        first_name: editData.first_name,
        last_name: editData.last_name,
        ...(editData.phone ? { phone: editData.phone } : {}),
      });

      // ✅ update profile state
      setEntreData((prev) => {
        const updated = {
          ...prev,
          user: {
            ...prev.user,
            first_name: editData.first_name,
            last_name: editData.last_name,
            phone: editData.phone ?? prev.user.phone,
          },
        };
        // ✅ SYNC ACTIVE PROFILE DATA
        dispatch(setActiveProfileData({ role: "entrepreneur", profile: updated }));
        return updated;
      });

      // ✅ CRITICAL FIX: sync editData AFTER save
      setEditData({
        first_name: editData.first_name,
        last_name: editData.last_name,
        phone: editData.phone,
      });

      dispatch(fetchUserProfile());


      setEditUser(false);
      showAlert("User details updated!", "success");
    } catch (error) {
      console.error("UPDATE ERROR:", error.response?.data || error);
      showAlert("Failed to update user details", "error");
    }
  };

  /* --------------------------
      PROFILE PIC UPLOAD
  --------------------------- */
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const res = await axiosSecure.patch(
        "/v1/auth/me/update/",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // ✅ update local entrepreneur user
      const updated = {
        ...entreData,
        user: res.data.user,
      };
      setEntreData(updated);

      // ✅ SYNC ACTIVE PROFILE DATA
      dispatch(setActiveProfileData({ role: "entrepreneur", profile: updated }));

      // ✅ sync redux auth user
      dispatch(fetchUserProfile());

      showAlert("Profile picture updated!", "success");
    } catch (error) {
      console.error("PROFILE PIC ERROR:", error.response?.data || error);
      showAlert("Failed to upload profile picture", "error");
    }
  };




  /* --------------------------
      LIKE HANDLER
  --------------------------- */
  const token = getAccessToken();
  // Like handler moved to UserPosts component

  /* --------------------------
      DELETE POST
  --------------------------- */
  // Delete logic moved to UserPosts component

  /* --------------------------
      SCROLL HANDLING
  --------------------------- */
  const userRef = useRef(null);
  const entreRef = useRef(null);
  const isUserScrolling = useRef(true);

  const scrollToSection = (ref, key) => {
    setLeftActive(key);
    isUserScrolling.current = false;

    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    setTimeout(() => {
      isUserScrolling.current = true;
    }, 700);
  };

  /* ---------- SCROLL SPY (MATCHES EXPERT PROFILE) ---------- */
  useEffect(() => {
    const NAV_HEIGHT = 60; // same value used in ExpertProfile

    const handleScroll = () => {
      if (!isUserScrolling.current) return;

      const offset = NAV_HEIGHT + 40;

      const sections = [
        { key: "user-details", el: userRef.current },
        { key: "entre-details", el: entreRef.current },
      ];

      let closest = "user-details";
      let minDistance = Infinity;

      sections.forEach((sec) => {
        if (!sec.el) return;
        const rect = sec.el.getBoundingClientRect();
        const distance = Math.abs(rect.top - offset);

        if (distance < minDistance) {
          minDistance = distance;
          closest = sec.key;
        }
      });

      setLeftActive(closest);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // run once on mount

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  /* --------------------------
      LOADING
  --------------------------- */
  if (!user || !entreData) {
    return (
      <div className={`mt-20 text-center ${isDark ? "text-white" : "text-black"}`}>
        Loading...
      </div>
    );
  }

  /* ===============================
      UI — UNCHANGED
  =============================== */

  return (
    <div
      className={`min-h-screen pt-20 px-4 pb-20 md:pb-0 ${isDark ? "bg-neutral-950 text-white" : "bg-neutral-100 text-black"
        }`}
    >
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div
          className={`p-6 rounded-xl shadow flex flex-col md:flex-row gap-6 items-center mb-6 text-center md:text-left ${isDark ? "bg-neutral-900 text-white" : "bg-white text-black"
            }`}
        >
          <div className="relative w-28 h-28 mx-auto md:mx-0">
            {user.profile_picture ? (
              <img
                src={`${user.profile_picture}?t=${Date.now()}`}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowImageModal(true)}
              />
            ) : (
              <div className="w-28 h-28 bg-red-500 text-white rounded-full flex items-center justify-center text-4xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}

            {!readOnly && (
              <label className="absolute bottom-1 right-1 bg-black/70 text-white w-8 h-8 flex items-center justify-center rounded-full cursor-pointer hover:bg-black">
                <MdEdit />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicUpload}
                  className="hidden"
                />

              </label>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              {user.first_name || user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.username}
            </h1>

            <p className="text-neutral-400 mt-2 mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium border border-blue-400 bg-blue-400/10 text-blue-500">
                @{user?.username}
              </span>
              &nbsp;—&nbsp;
              <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium border border-orange-400 bg-orange-400/10 text-orange-500">
                <IoIosRocket /> &nbsp;Entrepreneur
              </span>
            </p>

            {entreData.verified_by_admin && (
              <div className="mt-1 text-green-500 text-sm font-semibold">
                Verified Entrepreneur
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="flex justify-center gap-10 border-b pb-2">
          <button
            onClick={() => setActiveTab("about")}
            className={`pb-2 text-lg font-medium ${activeTab === "about"
              ? "text-red-500 border-b-2 border-red-500"
              : "text-neutral-500"
              }`}
          >
            About
          </button>

          <button
            onClick={() => setActiveTab("posts")}
            className={`pb-2 text-lg font-medium ${activeTab === "posts"
              ? "text-red-500 border-b-2 border-red-500"
              : "text-neutral-500"
              }`}
          >
            Posts
          </button>
        </div>

        {/* CONTENT */}
        <div className="mt-6">
          {activeTab === "about" && (
            <div className="flex flex-col md:flex-row gap-6 relative">
              {/* LEFT */}
              <div
                className={`hidden md:block w-full md:w-1/4 sticky top-24 h-[17vh] pt-5 px-3 rounded-xl shadow ${isDark ? "bg-neutral-900" : "bg-white"
                  }`}
              >
                <button
                  onClick={() => scrollToSection(userRef, "user-details")}
                  className={`flex items-center gap-2 w-full text-left mb-2 py-2 px-3 rounded-lg mb-1 transition-all ${leftActive === "user-details"
                    ? "bg-red-600 text-white shadow"
                    : isDark
                      ? "text-neutral-400 hover:bg-neutral-800"
                      : "text-neutral-600 hover:bg-neutral-200"
                    }`}
                >
                  <MdOutlineManageAccounts /> User Details
                </button>

                <button
                  onClick={() => scrollToSection(entreRef, "entre-details")}
                  className={`flex items-center gap-2 w-full text-left py-2 px-3 rounded-lg mb-1 transition-all ${leftActive === "entre-details"
                    ? "bg-red-600 text-white shadow"
                    : isDark
                      ? "text-neutral-400 hover:bg-neutral-800"
                      : "text-neutral-600 hover:bg-neutral-200"
                    }`}
                >
                  <RiAdvertisementLine /> Entrepreneur Details
                </button>
              </div>

              {/* RIGHT */}
              <div className="w-full md:w-3/4 min-w-0 space-y-10">
                <div ref={userRef} className="scroll-mt-24">
                  <UserDetails
                    editMode={!readOnly && editUser}
                    setEditMode={readOnly ? () => { } : setEditUser}
                    editData={editData}
                    setEditData={readOnly ? () => { } : setEditData}
                    handleSave={handleSaveUser}
                  />
                </div>

                <div ref={entreRef} className="scroll-mt-24">
                  <EntrepreneurDetails
                    entreData={entreData}
                    setEntreData={setEntreData}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "posts" && (
            <UserPosts />
          )}
        </div>
      </div>

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
              src={`${user.profile_picture}?t=${Date.now()}`}
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

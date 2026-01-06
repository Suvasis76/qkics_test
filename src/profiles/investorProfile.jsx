// src/profiles/investor/InvestorProfile.jsx

import { useEffect, useState, useRef } from "react";
import { CiEdit } from "react-icons/ci";
import { MdEdit } from "react-icons/md";
import axiosSecure from "../components/utils/axiosSecure";

import { useAlert } from "../context/AlertContext";
import { useConfirm } from "../context/ConfirmContext";
import { FaBriefcase } from "react-icons/fa";

import { useDispatch, useSelector } from "react-redux";
import { loadUserPosts, removePost } from "../redux/slices/postsSlice";
import { fetchUserProfile } from "../redux/slices/userSlice";

import UserDetails from "./basicDetails/userDetails";
import UserPosts from "./basicDetails/userPosts";
import InvestorDetails from "./investorDetails/InvestorDetails";
import ModalOverlay from "../components/ui/ModalOverlay";

import { MdOutlineManageAccounts } from "react-icons/md";
import { RiFundsLine } from "react-icons/ri";

import useLike from "../components/hooks/useLike";
import { getAccessToken } from "../redux/store/tokenManager";

export default function InvestorProfile({
  theme,
  profile,
  readOnly = false,
  disableSelfFetch = false,
}) {
  const isDark = theme === "dark";

  const dispatch = useDispatch();
  const postsRedux = useSelector((state) => state.posts.items);

  const reduxUser = useSelector((state) => state.user.data);

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  /* --------------------------
      USER + INVESTOR DATA
  --------------------------- */
  const [investorData, setInvestorData] = useState(profile || null);
  const user = investorData?.user || null;
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (profile) setInvestorData(profile);
  }, [profile]);

  /* --------------------------
      POSTS STATE
  --------------------------- */
  const [posts, setPosts] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => setPosts(postsRedux), [postsRedux]);

  useEffect(() => {
    if (!readOnly && user?.username) {
      dispatch(loadUserPosts(user.username));
    }
  }, [readOnly, user?.username, dispatch]);

  useEffect(() => {
    if (!profile || !readOnly) return;
    dispatch(loadUserPosts(profile.user.username));
  }, [profile, readOnly, dispatch]);

  /* --------------------------
      TAB STATE
  --------------------------- */
  const [activeTab, setActiveTab] = useState(
    sessionStorage.getItem("investorActiveTab") || "about"
  );

  useEffect(() => {
    sessionStorage.setItem("investorActiveTab", activeTab);
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
      FETCH SELF PROFILE
  --------------------------- */
  useEffect(() => {
    if (!profile && !disableSelfFetch) {
      axiosSecure.get("/v1/investors/me/profile/").then((res) => {
        setInvestorData(res.data);
        dispatch(fetchUserProfile());
      });
    }
  }, [profile, disableSelfFetch, dispatch]);

  /* --------------------------
      SAVE USER
  --------------------------- */
  const handleSaveUser = async () => {
    try {
      await axiosSecure.patch("/v1/auth/me/update/", {
        first_name: editData.first_name,
        last_name: editData.last_name,
        ...(editData.phone ? { phone: editData.phone } : {}),
      });

      setInvestorData((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          first_name: editData.first_name,
          last_name: editData.last_name,
          phone: editData.phone ?? prev.user.phone,
        },
      }));

      setEditData({ ...editData });
      dispatch(fetchUserProfile());

      setEditUser(false);
      showAlert("User details updated!", "success");
    } catch (error) {
      console.error(error);
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
      const res = await axiosSecure.patch("/v1/auth/me/update/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setInvestorData((prev) => ({
        ...prev,
        user: res.data.user,
      }));

      dispatch(fetchUserProfile());
      showAlert("Profile picture updated!", "success");
    } catch (error) {
      console.error(error);
      showAlert("Failed to upload profile picture", "error");
    }
  };

  /* --------------------------
      LIKE / DELETE
  --------------------------- */
  const token = getAccessToken();
  const { handleLike } = useLike(setPosts, token, () => { });

  const handleDelete = async (postId) => {
    showConfirm({
      title: "Delete Post?",
      message: "This cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        await axiosSecure.delete(`/v1/community/posts/${postId}/`);
        dispatch(removePost(postId));
        showAlert("Post deleted!", "success");
      },
    });
  };

  /* --------------------------
      SCROLL HANDLING
  --------------------------- */
  const userRef = useRef(null);
  const investorRef = useRef(null);
  const isUserScrolling = useRef(true);

  const scrollToSection = (ref, key) => {
    setLeftActive(key);
    isUserScrolling.current = false;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    setTimeout(() => {
      isUserScrolling.current = true;
    }, 700);
  };

  useEffect(() => {
    const NAV_HEIGHT = 60;

    const handleScroll = () => {
      if (!isUserScrolling.current) return;

      const offset = NAV_HEIGHT + 40;
      const sections = [
        { key: "user-details", el: userRef.current },
        { key: "investor-details", el: investorRef.current },
      ];

      let closest = "user-details";
      let min = Infinity;

      sections.forEach((s) => {
        if (!s.el) return;
        const d = Math.abs(s.el.getBoundingClientRect().top - offset);
        if (d < min) {
          min = d;
          closest = s.key;
        }
      });

      setLeftActive(closest);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* --------------------------
      LOADING
  --------------------------- */
  if (!user || !investorData) {
    return (
      <div className={`mt-20 text-center ${isDark ? "text-white" : "text-black"}`}>
        Loading...
      </div>
    );
  }

  /* ===============================
      UI
  =============================== */

  return (
    <div className={`min-h-screen pt-20 px-4 pb-20 md:pb-0 ${isDark ? "bg-neutral-950 text-white" : "bg-neutral-100 text-black"}`}>
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className={`p-6 rounded-xl shadow flex flex-col md:flex-row gap-6 items-center mb-6 text-center md:text-left ${isDark ? "bg-neutral-900" : "bg-white"}`}>
          <div className="relative w-28 h-28 mx-auto md:mx-0">
            {user.profile_picture ? (
              <img
                src={`${user.profile_picture}?t=${Date.now()}`}
                className="w-28 h-28 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setShowImageModal(true)}
              />
            ) : (
              <div className="w-28 h-28 bg-blue-600 rounded-full flex items-center justify-center text-4xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}

            {!readOnly && (
              <label className="absolute bottom-1 right-1 text-white bg-black/70 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer">
                <MdEdit />
                <input type="file" className="hidden" accept="image/*" onChange={handleProfilePicUpload} />
              </label>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              {user.first_name || user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.username}
            </h1>

            <p className="text-neutral-400 mt-2">
              <span className="inline-flex px-2 py-1 rounded-xl text-xs border border-blue-400 bg-blue-400/10 text-blue-500">
                @{user.username}
              </span>
              &nbsp;—&nbsp;
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs border border-red-400 bg-red-400/10 text-red-500">
                <FaBriefcase />
                Investor
              </span>

            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex justify-center gap-10 border-b pb-2">
          {["about", "posts"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-lg font-medium ${activeTab === tab
                ? "text-red-500 border-b-2 border-red-500"
                : "text-neutral-500"
                }`}
            >
              {tab === "about" ? "About" : "Posts"}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="mt-6">
          {activeTab === "about" && (
            <div className="flex flex-col md:flex-row gap-6 relative">

              {/* LEFT */}
              <div className={`hidden md:block w-full md:w-1/4 sticky top-24 h-[17vh] pt-5 px-3 rounded-xl shadow ${isDark ? "bg-neutral-900" : "bg-white"}`}>
                <button
                  onClick={() => scrollToSection(userRef, "user-details")}
                  className={`flex items-center gap-2 w-full mb-2 py-2 px-3 rounded-lg ${leftActive === "user-details"
                    ? "bg-red-600 text-white"
                    : isDark
                      ? "text-neutral-400 hover:bg-neutral-800"
                      : "text-neutral-600 hover:bg-neutral-200"
                    }`}
                >
                  <MdOutlineManageAccounts /> User Details
                </button>

                <button
                  onClick={() => scrollToSection(investorRef, "investor-details")}
                  className={`flex items-center gap-2 w-full py-2 px-3  rounded-lg ${leftActive === "investor-details"
                    ? "bg-red-600 text-white"
                    : isDark
                      ? "text-neutral-400 hover:bg-neutral-800"
                      : "text-neutral-600 hover:bg-neutral-200"
                    }`}
                >
                  <RiFundsLine className="text-lg" />
                  <span>Investor Details</span>
                </button>
              </div>

              {/* RIGHT */}
              <div className="w-full md:w-3/4 space-y-10">
                <div ref={userRef} className="scroll-mt-24">
                  <UserDetails
                    user={user}
                    editMode={!readOnly && editUser}
                    setEditMode={readOnly ? () => { } : setEditUser}
                    editData={editData}
                    setEditData={readOnly ? () => { } : setEditData}
                    handleSave={handleSaveUser}
                    isDark={isDark}
                    readOnly={readOnly}
                  />
                </div>

                <div ref={investorRef} className="scroll-mt-24">
                  <InvestorDetails
                    investorData={investorData}
                    setInvestorData={setInvestorData}
                    isDark={isDark}
                    readOnly={readOnly}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "posts" && (
            <UserPosts
              posts={posts}
              setPosts={setPosts}
              isDark={isDark}
              openCreate={!readOnly && openCreate}
              setOpenCreate={readOnly ? () => { } : setOpenCreate}
              editingPost={editingPost}
              setEditingPost={setEditingPost}
              handleDelete={readOnly ? () => { } : handleDelete}
              handleLike={handleLike}
              readOnly={readOnly}
            />
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

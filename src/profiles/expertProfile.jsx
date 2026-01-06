import { useEffect, useState, useRef } from "react";
import { CiEdit } from "react-icons/ci";
import { MdEdit } from "react-icons/md";
import axiosSecure from "../components/utils/axiosSecure";
import { useAlert } from "../context/AlertContext";
import { useConfirm } from "../context/ConfirmContext";
import { FaGraduationCap } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { MdOutlineEventAvailable } from "react-icons/md";


import { useDispatch, useSelector } from "react-redux";
import { loadUserPosts, removePost } from "../redux/slices/postsSlice";
import { fetchUserProfile } from "../redux/slices/userSlice";


// Shared Components
import UserDetails from "./basicDetails/userDetails";
import UserPosts from "./basicDetails/userPosts";


import ModalOverlay from "../components/ui/ModalOverlay";

// Expert Components
import ExpertDetails from "./expertDetails/expertDetails";
import ExperiencePage from "./expertDetails/expertExperience";
import EducationPage from "./expertDetails/expertEducation";
import CertificationPage from "./expertDetails/expertCertification";
import HonorsPage from "./expertDetails/expertHonors";

// Sidebar Icons
import { MdOutlineManageAccounts } from "react-icons/md";
import { HiOutlineIdentification } from "react-icons/hi";
import { MdWorkOutline } from "react-icons/md";
import {
  PiBookOpenTextLight,
  PiCertificateLight,
  PiMedalLight,
} from "react-icons/pi";

export default function ExpertProfile({
  theme,
  profile,
  readOnly = false,
  disableSelfFetch = false,
}) {
  const isDark = theme === "dark";
  const dispatch = useDispatch();
  const postView = useSelector((state) => state.postView);

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const navigate = useNavigate();


  /* --------------------------
      USER + EXPERT STATE
  --------------------------- */
  const [expertData, setExpertData] = useState(profile || null);
  const user = expertData?.user || null;
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (profile) setExpertData(profile);
  }, [profile]);

  /* --------------------------
      EDIT FORM STATE
  --------------------------- */
  const [editUser, setEditUser] = useState(false);
  const [editExp, setEditExp] = useState(false);

  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    email: "",
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
      POSTS STATE
  --------------------------- */
  const postsState = useSelector((state) => state.posts.items);
  const [posts, setPosts] = useState([]);

  const [openCreate, setOpenCreate] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => {
    setPosts(postsState);
  }, [postsState]);

  // Load posts for viewed profile
  useEffect(() => {
    if (!expertData || !readOnly) return;
    dispatch(loadUserPosts(expertData.user.username));
  }, [expertData, readOnly, dispatch]);

  // 🔑 LOAD POSTS FOR OWN EXPERT PROFILE
  useEffect(() => {
    if (readOnly || !expertData?.user?.username) return;
    dispatch(loadUserPosts(expertData.user.username));
  }, [readOnly, expertData?.user?.username, dispatch]);


  /* --------------------------
      TAB HANDLING
  --------------------------- */
  const [activeTab, setActiveTab] = useState(
    sessionStorage.getItem("expertActiveTab") || "about"
  );

  useEffect(() => {
    sessionStorage.setItem("expertActiveTab", activeTab);
  }, [activeTab]);

  /* ---------- SECTION REFS ---------- */
  const userRef = useRef(null);
  const expertRef = useRef(null);
  const experienceRef = useRef(null);
  const educationRef = useRef(null);
  const certRef = useRef(null);
  const honorRef = useRef(null);

  const [leftActive, setLeftActive] = useState("user-details");
  const isUserScrolling = useRef(true);

  const scrollToSection = (ref, key) => {
    setLeftActive(key);
    isUserScrolling.current = false;

    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    setTimeout(() => {
      isUserScrolling.current = true;
    }, 700);
  };

  /* ---------- SCROLL SPY ---------- */
  useEffect(() => {
    const NAV_HEIGHT = 60;

    const handleScroll = () => {
      if (!isUserScrolling.current) return;

      const offset = NAV_HEIGHT + 40;

      const sections = [
        { key: "user-details", el: userRef.current },
        { key: "expert-details", el: expertRef.current },
        { key: "experience", el: experienceRef.current },
        { key: "education", el: educationRef.current },
        { key: "certification", el: certRef.current },
        { key: "honors", el: honorRef.current },
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
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ---------- RESTORE SCROLL ---------- */
  useEffect(() => {
    if (postView.from === "expert-profile") {
      if (postView.tab) setActiveTab(postView.tab);
      setTimeout(() => window.scrollTo(0, postView.scroll || 0), 50);
    }
  }, [postView]);

  useEffect(() => {
    if (!profile && !disableSelfFetch) {
      axiosSecure.get("/v1/experts/me/profile/").then((res) => {
        setExpertData(res.data);

        // ✅ ADD THIS LINE
        dispatch(fetchUserProfile());
      });
    }
  }, [profile, disableSelfFetch, dispatch]);



  /* ---------- SAVE USER ---------- */
  const handleSaveUser = async () => {
    try {
      await axiosSecure.patch("/v1/auth/me/update/", {
        first_name: editData.first_name,
        last_name: editData.last_name,
        ...(editData.phone ? { phone: editData.phone } : {}),
      });

      // ✅ update local expertData.user
      setExpertData((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          first_name: editData.first_name,
          last_name: editData.last_name,
          phone: editData.phone ?? prev.user.phone,
        },
      }));

      setEditData({
        first_name: editData.first_name,
        last_name: editData.last_name,
        phone: editData.phone,
      });

      dispatch(fetchUserProfile());

      setEditUser(false);
      showAlert("User details updated!", "success");
    } catch {
      showAlert("Update failed!", "error");
    }
  };





  /* ---------- SAVE EXPERT ---------- */
  const handleSaveExpert = async () => {
    try {
      const res = await axiosSecure.patch("/v1/experts/me/profile/", {
        headline: expertData.headline,
        primary_expertise: expertData.primary_expertise,
        other_expertise: expertData.other_expertise,
        hourly_rate: expertData.hourly_rate,
      });

      setExpertData((prev) => ({
        ...res.data,
        user: prev.user, // ✅ DO NOT overwrite auth user
      }));

      setEditExp(false);
      showAlert("Expert profile updated!", "success");
    } catch {
      showAlert("Failed!", "error");
    }
  };


  /* ---------- PROFILE PIC ---------- */
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const res = await axiosSecure.patch("/v1/auth/me/update/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setExpertData({
        ...expertData,
        user: res.data.user,
      });

      dispatch(fetchUserProfile());

      showAlert("Profile picture updated!", "success");
    } catch {
      showAlert("Upload failed!", "error");
    }
  };

  /* ---------- DELETE POST ---------- */
  const handleDelete = async (postId) => {
    showConfirm({
      title: "Delete Post?",
      message: "Are you sure?",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          await axiosSecure.delete(`/v1/community/posts/${postId}/`);
          dispatch(removePost(postId));
          showAlert("Post deleted successfully!", "success");
        } catch {
          showAlert("Delete failed!", "error");
        }
      },
    });
  };

  /* ---------- LOADING ---------- */
  if (!expertData || !user) {
    return (
      <div className={`mt-20 text-center ${isDark ? "text-white" : "text-black"}`}>
        Loading...
      </div>
    );
  }

  /* ===============================
      UI — UNCHANGED BELOW
  =============================== */

  return (
    <div
      className={`min-h-screen pt-20 px-4 pb-20 md:pb-0 ${isDark ? "bg-neutral-950 text-white" : "bg-neutral-100 text-black"
        }`}
    >
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div
          className={`p-6 rounded-xl shadow flex flex-col md:flex-row items-center justify-between gap-4 mb-6 ${isDark ? "bg-neutral-900 text-white" : "bg-white text-black"
            }`}
        >
          {/* LEFT — PROFILE INFO */}
          <div className="flex flex-col md:flex-row gap-6 items-center text-center md:text-left w-full">
            <div className="relative w-28 h-28 mx-auto md:mx-0">
              {user.profile_picture ? (
                <img
                  src={`${user.profile_picture}?t=${Date.now()}`}
                  alt="Profile"
                  className="w-28 h-28 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setShowImageModal(true)}
                />
              ) : (
                <div className="w-28 h-28 bg-red-600 text-white rounded-full flex items-center justify-center text-5xl font-bold">
                  {user.username.charAt(0)}
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
                  @{user.username}
                </span>
                &nbsp;—&nbsp;
                <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium border border-purple-400 bg-purple-400/10 text-purple-500">
                  <FaGraduationCap /> &nbsp;Expert
                </span>
              </p>

              {expertData.verified_by_admin && (
                <div className="mt-1 text-green-500 text-sm font-semibold">
                  Verified Expert
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — ACTION BUTTON */}
          {readOnly ? (
            // 👤 Public / Readonly Profile → Book Slots
            <button
              onClick={() => navigate(`/book-session/${user.uuid}`)}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold
             bg-red-600 text-white hover:bg-red-700 transition
             whitespace-nowrap"
            >
              <MdOutlineEventAvailable size={20} />
              Book Slots
            </button>

          ) : (
            // 👨‍⚕️ Own Profile → Manage Slots
            <button
              onClick={() => navigate("/expert/slots")}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold
             bg-red-600 text-white hover:bg-red-700 transition
             whitespace-nowrap"
            >
              <MdOutlineEventAvailable size={20} />
              Manage Slots
            </button>

          )}

        </div>


        {/* TOP NAV */}
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
                className={`hidden md:block w-full md:w-1/4 md:sticky md:top-24 h-auto md:h-[39vh] pt-5 px-3 rounded-xl shadow overflow-x-auto md:overflow-y-auto ${isDark ? "bg-neutral-900" : "bg-white"
                  }`}
              >
                {[
                  { key: "user-details", label: "User Details", icon: <MdOutlineManageAccounts />, ref: userRef },
                  { key: "expert-details", label: "Expert Details", icon: <HiOutlineIdentification />, ref: expertRef },
                  { key: "experience", label: "Experience", icon: <MdWorkOutline />, ref: experienceRef },
                  { key: "education", label: "Education", icon: <PiBookOpenTextLight />, ref: educationRef },
                  { key: "certification", label: "Certification", icon: <PiCertificateLight />, ref: certRef },
                  { key: "honors", label: "Honors & Awards", icon: <PiMedalLight />, ref: honorRef },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => scrollToSection(item.ref, item.key)}
                    className={`flex-shrink-0 md:flex-shrink flex items-center gap-2 w-auto md:w-full text-left py-2 px-3 rounded-lg mb-1 transition-all whitespace-nowrap ${leftActive === item.key
                      ? "bg-red-600 text-white shadow"
                      : isDark
                        ? "text-neutral-400 hover:bg-neutral-800"
                        : "text-neutral-600 hover:bg-neutral-200"
                      }`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>

              {/* RIGHT */}
              <div className="w-full md:w-3/4 min-w-0 space-y-10 ">
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

                <div ref={expertRef} className="scroll-mt-24">
                  <ExpertDetails
                    expertData={expertData}
                    setExpertData={setExpertData}
                    editExp={!readOnly && editExp}
                    setEditExp={readOnly ? () => { } : setEditExp}
                    handleSaveExpert={handleSaveExpert}
                    isDark={isDark}
                    readOnly={readOnly}
                  />
                </div>

                <div ref={experienceRef} className="scroll-mt-24">
                  <ExperiencePage
                    experiences={expertData.experiences || []}
                    setExpertData={setExpertData}
                    isDark={isDark}
                    readOnly={readOnly}
                  />
                </div>

                <div ref={educationRef} className="scroll-mt-24">
                  <EducationPage
                    education={expertData.educations || []}
                    setExpertData={setExpertData}
                    isDark={isDark}
                    readOnly={readOnly}
                  />
                </div>

                <div ref={certRef} className="scroll-mt-24">
                  <CertificationPage
                    certifications={expertData.certifications || []}
                    setExpertData={setExpertData}
                    isDark={isDark}
                    readOnly={readOnly}
                  />
                </div>

                <div ref={honorRef} className="scroll-mt-24">
                  <HonorsPage
                    honors_awards={expertData.honors_awards || []}
                    setExpertData={setExpertData}
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
              openCreate={openCreate}
              setOpenCreate={setOpenCreate}
              editingPost={editingPost}
              setEditingPost={setEditingPost}
              handleDelete={handleDelete}
              setShowLogin={() => { }}
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

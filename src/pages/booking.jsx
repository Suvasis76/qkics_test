import { useEffect, useState } from "react";
import axiosSecure from "../components/utils/axiosSecure";

import ExpertCard from "../components/profileFetch/expertBooking/ExpertCard";
import ExpertModal from "../components/profileFetch/expertBooking/ExpertModal";
import EntrepreneurCard from "../components/profileFetch/entreprenuerFetch/EntrepreneurCard";
import InvestorCard from "../components/profileFetch/investorFetch/InvestorCard";


import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";



export default function Booking() {
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const isDark = theme === "dark";

  const navigate = useNavigate();


  /* ----------------------------
      TABS
  ----------------------------- */
  const TABS = {
    EXPERTS: "experts",
    ENTREPRENEURS: "entrepreneurs",
    INVESTORS: "investors",
  };

  const [activeTab, setActiveTab] = useState(TABS.EXPERTS);

  /* ----------------------------
      STATE
  ----------------------------- */
  const [items, setItems] = useState([]); // experts / entrepreneurs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedExpert, setSelectedExpert] = useState(null);

  /* ----------------------------
      EFFECT
  ----------------------------- */
  useEffect(() => {
    if (activeTab === TABS.EXPERTS) {
      fetchExperts();
    } else if (activeTab === TABS.ENTREPRENEURS) {
      fetchEntrepreneurs();
    } else if (activeTab === TABS.INVESTORS) {
      fetchInvestors();
    } else {
      setItems([]);
    }
  }, [activeTab]);


  /* ----------------------------
      API CALLS
  ----------------------------- */
  const fetchExperts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosSecure.get("/v1/experts/");
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load experts");
    } finally {
      setLoading(false);
    }
  };

  const fetchEntrepreneurs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosSecure.get("/v1/entrepreneurs/");
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load entrepreneurs");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosSecure.get("/v1/investors/");
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load investors");
    } finally {
      setLoading(false);
    }
  };


  /* ----------------------------
      IMAGE HANDLER (EXPERTS)
  ----------------------------- */
  const resolveProfileImage = (expert) => {
    const url =
      expert.profile_picture ||
      expert.user?.profile_picture;

    const name =
      expert.user?.first_name ||
      expert.user?.username ||
      "User";

    if (!url) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name
      )}&background=random&length=1`;
    }

    return `${url}?t=${Date.now()}`;
  };


  const goToUserProfile = (user) => {
    // Not logged in → public read-only profile
    if (!loggedUser) {
      navigate(`/profile/${user.username}`);
      return;
    }

    // Clicking own profile
    if (loggedUser.username === user.username) {
      switch (loggedUser.user_type) {
        case "expert":
          navigate("/expert");
          break;
        case "entrepreneur":
          navigate("/entrepreneur");
          break;
        case "investor":
          navigate("/investor");
          break;
        case "admin":
          navigate("/admin");
          break;
        case "superadmin":
          navigate("/superadmin");
          break;
        default:
          navigate("/normal");
      }
      return;
    }

    // Someone else's profile → read-only
    navigate(`/profile/${user.username}`);
  };


  /* ----------------------------
      LOADING / ERROR
  ----------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm opacity-70">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  /* ----------------------------
      RENDER
  ----------------------------- */
  return (
    <div className="min-h-screen pt-20 px-4 max-w-6xl mx-auto pb-20 md:pb-0">
      {/* ---------------- TABS ---------------- */}
      <div className="flex gap-2 mb-6">
        {Object.values(TABS).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition
              ${activeTab === tab
                ? "bg-red-600 text-white"
                : "bg-neutral-200 text-black hover:bg-neutral-300"
              }
            `}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <h1 className="text-xl font-semibold mb-6">
        {activeTab === TABS.EXPERTS && "Experts"}
        {activeTab === TABS.ENTREPRENEURS && "Entrepreneurs"}
        {activeTab === TABS.INVESTORS && "Investors"}
      </h1>

      {/* ---------------- LIST ---------------- */}
      {items.length === 0 ? (
        <p className="opacity-60">
          No {activeTab} available at the moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* -------- EXPERTS -------- */}
          {activeTab === TABS.EXPERTS &&
            items.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                isDark={isDark}
                onClick={() => setSelectedExpert(expert)}
                resolveProfileImage={resolveProfileImage}
              />
            ))}

          {/* -------- ENTREPRENEURS -------- */}
          {activeTab === TABS.ENTREPRENEURS &&
            items.map((item) => (
              <EntrepreneurCard
                key={item.id}
                entrepreneur={item}
                isDark={isDark}
                onClick={(entrepreneur) => goToUserProfile(entrepreneur.user)}
              />
            ))}



          {/* -------- INVESTORS (PLACEHOLDER) -------- */}
          {activeTab === TABS.INVESTORS &&
            items.map((item) => (
              <InvestorCard
                key={item.id}
                investor={item}
                isDark={isDark}
                onClick={(investor) => goToUserProfile(investor.user)}
              />
            ))}

        </div>
      )}

      {/* ---------------- MODAL (EXPERT ONLY) ---------------- */}
      {activeTab === TABS.EXPERTS && selectedExpert && (
        <ExpertModal
          expert={selectedExpert}
          onClose={() => setSelectedExpert(null)}
          resolveProfileImage={resolveProfileImage}
          isDark={isDark}
        />
      )}
    </div>
  );
}

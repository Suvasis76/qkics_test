// src/profiles/expert/ExpertWizard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import { useConfirm } from "../../context/ConfirmContext";

// Step UIs and modal UIs (Option C: split files)
import Steps from "./ExpertWizardSteps";
import {
    AddExperienceModal,
    AddEducationModal,
    AddCertificationModal,
    AddHonorModal,
    SubmitNoteModal,
    ModalOverlay,
} from "./ExpertWizardModals";


/**
 * ExpertWizard (Main)
 * - Keeps API calls, state, and derived flags
 * - Passes handlers + state down to Steps and Modals
 *
 * Assumptions:
 * - axiosSecure works and provides auth headers
 * - Steps and Modals are provided in sibling files:
 *    ./ExpertWizardSteps.jsx
 *    ./ExpertWizardModals.jsx
 *
 * The Steps component handles rendering Step 1/2/3 UI.
 * The Modals component renders add-item modals + submit-note modal.
 */

export default function ExpertWizard({ theme }) {
    const isDark = theme === "dark";
    const navigate = useNavigate();

    const { showAlert } = useAlert();
    const { showConfirm } = useConfirm();

    // Page state
    const [step, setStep] = useState(1);

    // Profile form state (editable fields)
    const [profile, setProfile] = useState({
        first_name: "",
        last_name: "",
        headline: "",
        primary_expertise: "",
        other_expertise: "",
        hourly_rate: 1000,
        is_available: true,
    });

    // Full server response for meta & lists
    const [profileMeta, setProfileMeta] = useState(null);

    // credential lists (kept in local state and appended as created)
    const [experiences, setExperiences] = useState([]);
    const [educations, setEducations] = useState([]);
    const [certifications, setCertifications] = useState([]);
    const [honors, setHonors] = useState([]);

    // UI states
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Which modal is open (in Modals file)
    // showAddModal: "experience" | "education" | "cert" | "honor" | null
    const [showAddModal, setShowAddModal] = useState(null);
    // Show the submit-note modal
    const [showSubmitNoteModal, setShowSubmitNoteModal] = useState(false);

    const [hideBanner, setHideBanner] = useState(false);


    // Fetch profile on mount
    useEffect(() => {
        let mounted = true;

        const fetchProfile = async () => {
            setLoading(true);
            try {
                const res = await axiosSecure.get("/v1/experts/me/profile/");
                if (!mounted) return;
                const data = res.data;

                setProfileMeta(data);

                setProfile({
                    first_name: data.first_name || "",
                    last_name: data.last_name || "",
                    headline: data.headline || "",
                    primary_expertise: data.primary_expertise || "",
                    other_expertise: data.other_expertise || "",
                    hourly_rate: data.hourly_rate ? Number(data.hourly_rate) : 1000,
                    is_available: data.is_available ?? true,
                });

                setExperiences(data.experiences || []);
                setEducations(data.educations || []);
                setCertifications(data.certifications || []);
                setHonors(data.honors_awards || []);
            } catch (err) {
                // It's OK if there's no profile yet; user will create it.
                console.debug("Expert profile not found or fetch error:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchProfile();
        return () => {
            mounted = false;
        };
    }, []);

    /* -------------------------
       Derived flags & helpers
    ------------------------- */
    const applicationStatus = profileMeta?.application_status || "draft";
    const isVerified = profileMeta?.verified_by_admin === true;

    // Editable when draft or explicitly rejected
    const isEditable = applicationStatus === "draft" || applicationStatus === "rejected";

    // Banner text / tone derived from status
    const banner = (() => {
        if (!profileMeta) return null;
        const note = profileMeta.admin_review_note || "";
        const status = profileMeta.application_status;
        if (status === "approved" && isVerified) {
            return { text: "🎉 Your expert profile has been approved! Please logout and login again to activate expert features.", tone: "success" };
        }
        if (status === "pending") {
            return { text: "⏳ Your application is under review. Editing is disabled.", tone: "info" };
        }
        if (status === "rejected") {
            return { text: `❌ Your application was rejected. ${note ? "Admin note: " + note : ""}`, tone: "error" };
        }
        return null;
    })();

    /* -------------------------
       Validation
    ------------------------- */
    const validateProfile = () => {
        const errors = [];
        if (!profile.first_name?.trim()) errors.push("First name is required");
        if (!profile.headline?.trim()) errors.push("Headline is required");
        if (!profile.primary_expertise?.trim()) errors.push("Primary expertise is required");
        if (!profile.hourly_rate || Number(profile.hourly_rate) <= 0) errors.push("Hourly rate must be a positive number");
        return errors;
    };

    /* -------------------------
       Save profile (POST or PUT)
    ------------------------- */
    const handleSaveProfile = async () => {
        if (!isEditable) {
            showAlert("Profile is not editable while application is pending/approved.", "error");
            return;
        }

        const errors = validateProfile();
        if (errors.length) {
            showAlert(errors.join(". "), "error");
            return;
        }

        setSaving(true);
        try {
            if (profileMeta?.id) {
                const res = await axiosSecure.put("/v1/experts/me/profile/", { ...profile });
                setProfileMeta(res.data);
                showAlert("Profile updated (draft).", "success");
            } else {
                const res = await axiosSecure.post("/v1/experts/me/profile/", { ...profile });
                setProfileMeta(res.data);
                showAlert("Profile saved (draft).", "success");
            }
        } catch (err) {
            console.error("Save profile error:", err);
            showAlert("Failed to save profile. Try again.", "error");
        } finally {
            setSaving(false);
        }
    };

    /* -------------------------
       Submit for review (API)
       The note is provided by SubmitNote modal.
    ------------------------- */
    const handleSubmitForReview = async (note = "") => {
        if (!profileMeta?.id) {
            showAlert("Please complete and save your profile before submitting.", "error");
            setStep(1);
            setShowSubmitNoteModal(false);
            return;
        }

        const errors = validateProfile();
        if (errors.length) {
            showAlert(errors.join(". "), "error");
            setStep(1);
            setShowSubmitNoteModal(false);
            return;
        }

        setSubmitting(true);
        try {
            await axiosSecure.post("/v1/experts/me/submit/", { note });

            // Update local meta to pending
            setProfileMeta((p) => ({ ...(p || {}), application_status: "pending", admin_review_note: note }));
            showAlert("Application submitted for review.", "success");
            setShowSubmitNoteModal(false);
            setStep(3);
        } catch (err) {
            console.error("Submit for review error:", err);
            showAlert("Submission failed. Try again.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    /* -------------------------
       Create item helpers (add-only)
       Each returns the created item appended locally.
    ------------------------- */
    const createExperience = async (payload) => {
        const res = await axiosSecure.post("/v1/experts/experience/", payload);
        setExperiences((prev) => [res.data, ...prev]);
        showAlert("Experience added", "success");
    };

    const createEducation = async (payload) => {
        const res = await axiosSecure.post("/v1/experts/education/", payload);
        setEducations((prev) => [res.data, ...prev]);
        showAlert("Education added", "success");
    };

    const createCertification = async (payload) => {
        const res = await axiosSecure.post("/v1/experts/certifications/", payload);
        setCertifications((prev) => [res.data, ...prev]);
        showAlert("Certification added", "success");
    };

    const createHonor = async (payload) => {
        const res = await axiosSecure.post("/v1/experts/honors/", payload);
        setHonors((prev) => [res.data, ...prev]);
        showAlert("Honor/Award added", "success");
    };

    /* -------------------------
       Optional helper: confirm submission (if you prefer confirm before modal)
       (Kept for future use — not used because we open SubmitNote modal)
    ------------------------- */
    const confirmThenSubmit = (note) => {
        showConfirm({
            title: "Submit for review?",
            message: "Once submitted, you cannot edit your profile until admin responds.",
            confirmText: "Submit",
            cancelText: "Cancel",
            onConfirm: async () => {
                await handleSubmitForReview(note);
            },
        });
    };

    /* -------------------------
       Wizard navigation helpers
    ------------------------- */
    const next = () => setStep((s) => Math.min(3, s + 1));
    const prev = () => setStep((s) => Math.max(1, s - 1));
    const goTo = (s) => setStep(s);

    /* -------------------------
       Render
    ------------------------- */
    return (
        <div className={`min-h-screen ${isDark ? "bg-[#0f0f0f]" : "bg-[#f5f5f5]"} pb-16`}>
            <div className="max-w-5xl mx-auto px-4 pt-12">
                {/* Header */}
                <div className={`p-6 rounded-xl shadow mb-6 ${isDark ? "bg-neutral-900 text-white" : "bg-white text-black"}`}>
                    <div className="flex items-start gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">Expert Setup Wizard</h1>
                            <p className="text-sm opacity-70 mt-1">Build your expert profile, add credentials, and submit for admin verification.</p>
                        </div>

                        <div className="ml-auto text-right">
                            <div className="text-sm opacity-80">Step {step} of 3</div>
                            <div className="mt-2 flex gap-2">
                                <button onClick={() => navigate(-1)} className="px-3 py-1 rounded-md border">Back</button>
                                <button
                                    onClick={() => {
                                        if (profileMeta?.id && profileMeta.application_status === "pending") {
                                            showAlert("Your application is pending. You can view but not edit.", "info");
                                        } else {
                                            setStep(1);
                                        }
                                    }}
                                    className="px-3 py-1 rounded-md border"
                                >
                                    Start Over
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner (status) */}
                {banner && !hideBanner && (
                    <div className="mb-6 relative">
                        <div
                            className={`p-3 rounded-md pr-10 ${banner.tone === "info"
                                    ? "bg-blue-50 text-blue-800"
                                    : banner.tone === "success"
                                        ? "bg-green-50 text-green-800"
                                        : "bg-red-50 text-red-800"
                                }`}
                        >
                            {banner.text}

                            {/* Close Button */}
                            <button
                                onClick={() => setHideBanner(true)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-bold opacity-60 hover:opacity-100"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}


                {/* Steps area (left nav + main steps) */}
                <Steps
                    // step navigation
                    step={step}
                    setStep={setStep}
                    next={next}
                    prev={prev}
                    goTo={goTo}

                    // profile form
                    profile={profile}
                    setProfile={setProfile}
                    profileMeta={profileMeta}
                    isEditable={isEditable}
                    isVerified={isVerified}
                    applicationStatus={applicationStatus}

                    // lists
                    experiences={experiences}
                    educations={educations}
                    certifications={certifications}
                    honors={honors}

                    // actions
                    handleSaveProfile={handleSaveProfile}
                    setShowAddModal={setShowAddModal}
                    setShowSubmitNoteModal={setShowSubmitNoteModal}

                    // status / ui
                    saving={saving}
                    submitting={submitting}
                    isDark={isDark}
                />

                {/* Modals: add item / submit note */}
                {/* ADD EXPERIENCE MODAL */}
                {showAddModal === "experience" && (
                    <ModalOverlay isDark={isDark} onClose={() => setShowAddModal(null)}>
                        <AddExperienceModal
                            onClose={() => setShowAddModal(null)}
                            onCreate={createExperience}
                        />
                    </ModalOverlay>
                )}

                {/* ADD EDUCATION MODAL */}
                {showAddModal === "education" && (
                    <ModalOverlay isDark={isDark} onClose={() => setShowAddModal(null)}>
                        <AddEducationModal
                            onClose={() => setShowAddModal(null)}
                            onCreate={createEducation}
                        />
                    </ModalOverlay>
                )}

                {/* ADD CERTIFICATION MODAL */}
                {showAddModal === "cert" && (
                    <ModalOverlay isDark={isDark} onClose={() => setShowAddModal(null)}>
                        <AddCertificationModal
                            onClose={() => setShowAddModal(null)}
                            onCreate={createCertification}
                        />
                    </ModalOverlay>
                )}

                {/* ADD HONOR MODAL */}
                {showAddModal === "honor" && (
                    <ModalOverlay isDark={isDark} onClose={() => setShowAddModal(null)}>
                        <AddHonorModal
                            onClose={() => setShowAddModal(null)}
                            onCreate={createHonor}
                        />
                    </ModalOverlay>
                )}

                {/* SUBMIT NOTE MODAL */}
                {showSubmitNoteModal && (
                    <ModalOverlay isDark={isDark} onClose={() => setShowSubmitNoteModal(false)}>
                        <SubmitNoteModal
                            onClose={() => setShowSubmitNoteModal(false)}
                            onSubmit={handleSubmitForReview}
                        />
                    </ModalOverlay>
                )}

            </div>
        </div>
    );
}

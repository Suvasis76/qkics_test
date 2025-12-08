// src/profiles/entrepreneur/EntrepreneurWizard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";
import { useConfirm } from "../../context/ConfirmContext";

/* ===========================================================
   ENTREPRENEUR WIZARD — Expert-wizard parity + modal submit
   - 3-step layout (sidebar + main)
   - banner/status handling
   - save draft (POST/PUT), submit for review (modal)
=========================================================== */

export default function EntrepreneurWizard({ theme }) {
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  // steps
  const [step, setStep] = useState(1);
  const next = () => setStep((s) => Math.min(3, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));
  const goTo = (s) => setStep(s);

  // ui state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hideBanner, setHideBanner] = useState(false);

  // profile meta + form
  const [profileMeta, setProfileMeta] = useState(null);
  const [form, setForm] = useState({
    startup_name: "",
    one_liner: "",
    description: "",
    website: "",
    industry: "",
    location: "",
    funding_stage: "",
  });

  // modal for submit note
  const [showSubmitNoteModal, setShowSubmitNoteModal] = useState(false);

  // derived flags
  const applicationStatus = profileMeta?.application_status || "draft";
  const isVerified = profileMeta?.verified_by_admin === true;
  const isEditable = applicationStatus === "draft" || applicationStatus === "rejected";

  // banner same as expert wizard
  const banner = (() => {
    if (!profileMeta) return null;
    const note = profileMeta.admin_review_note || "";
    const status = profileMeta.application_status;
    if (status === "approved" && isVerified) {
      return {
        text:
          "🎉 Your entrepreneur profile has been approved! Please logout and login again to activate entrepreneur features.",
        tone: "success",
      };
    }
    if (status === "pending") {
      return {
        text:
          "⏳ Your application is under review. Editing is disabled until admin completes the review.",
        tone: "info",
      };
    }
    if (status === "rejected") {
      return {
        text: `❌ Your application was rejected. ${note ? "Admin note: " + note : ""}`,
        tone: "error",
      };
    }
    return null;
  })();

  // change handler
  const onChange = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
  };

  /* ----------------------
     Load existing draft
  -----------------------*/
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosSecure.get("/v1/entrepreneurs/me/profile/");
        if (!mounted) return;
        const data = res.data;
        setProfileMeta(data);
        setForm({
          startup_name: data.startup_name || "",
          one_liner: data.one_liner || "",
          description: data.description || "",
          website: data.website || "",
          industry: data.industry || "",
          location: data.location || "",
          funding_stage: data.funding_stage || "",
        });
      } catch (err) {
        // no draft — fine
        console.debug("No entrepreneur profile found", err?.response?.data || err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  /* ----------------------
     Validation
  -----------------------*/
  const validate = () => {
    const errors = [];
    if (!form.startup_name?.trim()) errors.push("Startup name is required");
    if (!form.one_liner?.trim()) errors.push("One liner is required");
    if (!form.description?.trim()) errors.push("Description is required");
    if (!form.industry?.trim()) errors.push("Industry is required");
    if (!form.location?.trim()) errors.push("Location is required");
    if (!form.funding_stage?.trim()) errors.push("Funding stage is required");
    return errors;
  };

  /* ----------------------
     Save draft (POST or PUT)
  -----------------------*/
  const handleSaveDraft = async () => {
    if (!isEditable) {
      showAlert("Profile is not editable while application is pending/approved.", "error");
      return;
    }

    const errors = validate();
    if (errors.length) {
      showAlert(errors.join(". "), "error");
      return;
    }

    setSaving(true);
    try {
      let res;
      // if server returned id for existing resource -> use PUT
      if (profileMeta?.id) {
        res = await axiosSecure.put("/v1/entrepreneurs/me/profile/", form);
      } else {
        res = await axiosSecure.post("/v1/entrepreneurs/me/profile/", form);
      }
      setProfileMeta(res.data);
      showAlert("Draft saved.", "success");
    } catch (err) {
      console.error("Save draft error:", err?.response?.data || err);
      showAlert("Failed to save draft. Check console.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ----------------------
     Submit for review (via modal)
     Expecting note param from modal
  -----------------------*/
  const handleSubmitForReview = async (note = "") => {
    if (!profileMeta?.id) {
      showAlert("Please save a draft before submitting.", "error");
      setStep(1);
      setShowSubmitNoteModal(false);
      return;
    }

    const errors = validate();
    if (errors.length) {
      showAlert(errors.join(". "), "error");
      setStep(1);
      setShowSubmitNoteModal(false);
      return;
    }

    // confirm (optional) — keep parity with expert flow (they used modal + can confirm)
    showConfirm({
      title: "Submit for review?",
      message: "Once submitted, you cannot edit your profile until admin responds.",
      confirmText: "Submit",
      cancelText: "Cancel",
      async onConfirm() {
        setSubmitting(true);
        try {
          await axiosSecure.post("/v1/entrepreneurs/me/submit/", { note });
          // update local meta
          setProfileMeta((p) => ({ ...(p || {}), application_status: "pending", admin_review_note: note }));
          showAlert("Application submitted for review.", "success");
          setShowSubmitNoteModal(false);
          setStep(3);
        } catch (err) {
          console.error("Submit error:", err?.response?.data || err);
          showAlert("Submission failed. Try again.", "error");
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  /* ----------------------
     Quick helpers for header controls
  -----------------------*/
  const handleStartOver = () => {
    if (profileMeta?.id && profileMeta.application_status === "pending") {
      showAlert("Your application is pending. You can view but not edit.", "info");
      return;
    }
    setStep(1);
  };

  /* ----------------------
     Render
  -----------------------*/
  const card = isDark ? "bg-neutral-900 text-white" : "bg-white text-black";

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0f0f0f]" : "bg-[#f5f5f5]"} pb-16`}>
      <div className="max-w-5xl mx-auto px-4 pt-12">
        {/* Header */}
        <div className={`p-6 rounded-xl shadow mb-6 ${isDark ? "bg-neutral-900 text-white" : card}`}>
          <div className="flex items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold">Entrepreneur Setup Wizard</h1>
              <p className="text-sm opacity-70 mt-1">Build your startup profile, save a draft, and submit for admin verification.</p>
            </div>

            <div className="ml-auto text-right">
              <div className="text-sm opacity-80">Step {step} of 3</div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => navigate(-1)} className="px-3 py-1 rounded-md border">Back</button>
                <button onClick={handleStartOver} className="px-3 py-1 rounded-md border">Start Over</button>
              </div>
            </div>
          </div>
        </div>

        {/* Banner */}
        {banner && !hideBanner && (
          <div className="mb-6 relative">
            <div className={`p-3 rounded-md pr-10 ${banner.tone === "info" ? "bg-blue-50 text-blue-800" : banner.tone === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              <div className="pr-10">{banner.text}</div>
              <button onClick={() => setHideBanner(true)} className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-bold opacity-60 hover:opacity-100">✕</button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className={`${isDark ? "text-white" : "text-black"} space-y-2 sticky top-28`}>
            <NavItem title="Startup Basics" stepNum={1} active={step === 1} onClick={() => goTo(1)} />
            <NavItem title="Business Details" stepNum={2} active={step === 2} onClick={() => goTo(2)} />
            <NavItem title="Review & Submit" stepNum={3} active={step === 3} onClick={() => goTo(3)} />
          </div>

          {/* Content */}
          <div className="md:col-span-3 space-y-6">
            {step === 1 && (
              <Step1
                form={form}
                onChange={onChange}
                isEditable={isEditable}
                saving={saving}
                next={next}
                save={handleSaveDraft}
                card={card}
              />
            )}

            {step === 2 && (
              <Step2
                form={form}
                onChange={onChange}
                isEditable={isEditable}
                saving={saving}
                prev={prev}
                next={next}
                save={handleSaveDraft}
                card={card}
              />
            )}

            {step === 3 && (
              <Step3
                form={form}
                note={profileMeta?.admin_review_note || ""}
                setNote={(v) => { /* not storing locally here; modal will provide note */ }}
                isEditable={isEditable}
                submitting={submitting}
                prev={prev}
                submit={() => setShowSubmitNoteModal(true)}
                save={handleSaveDraft}
                card={card}
                applicationStatus={applicationStatus}
                isVerified={isVerified}
              />
            )}
          </div>
        </div>
      </div>

      {/* Submit Note Modal */}
      {showSubmitNoteModal && (
        <ModalOverlay isDark={isDark} onClose={() => setShowSubmitNoteModal(false)}>
          <SubmitNoteModal
            onClose={() => setShowSubmitNoteModal(false)}
            onSubmit={async (note) => {
              await handleSubmitForReview(note);
            }}
          />
        </ModalOverlay>
      )}
    </div>
  );
}

/* ============================
   Small subcomponents
   (Sidebar / Steps / Inputs / Modal)
   Match Expert Wizard style
   ============================ */

function NavItem({ title, stepNum, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full text-left p-3 rounded-md ${active ? "bg-blue-600 text-white" : "border"}`}>
      <div className="font-semibold">{title}</div>
      <div className="text-xs opacity-70">Step {stepNum}</div>
    </button>
  );
}

/* ---------------- Step 1 ---------------- */
function Step1({ form, onChange, isEditable, saving, next, save, card }) {
  return (
    <div className={`p-6 rounded-xl shadow ${card}`}>
      <h2 className="text-xl font-semibold mb-4">Startup Basics</h2>

      <Field label="Startup Name" value={form.startup_name} onChange={(v) => onChange("startup_name", v)} disabled={!isEditable} />
      <Field label="One Liner" value={form.one_liner} onChange={(v) => onChange("one_liner", v)} disabled={!isEditable} />
      <Field label="Website" value={form.website} onChange={(v) => onChange("website", v)} disabled={!isEditable} />
      <Textarea label="Description" value={form.description} onChange={(v) => onChange("description", v)} disabled={!isEditable} />

      <div className="mt-6 flex items-center gap-3">
        <button onClick={save} disabled={saving || !isEditable} className={`px-4 py-2 rounded-md ${isEditable ? "bg-green-600 text-white" : "bg-neutral-600 text-white/80 cursor-not-allowed"}`}>
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button onClick={next} className="px-4 py-2 rounded-md border">Next</button>
      </div>
    </div>
  );
}

/* ---------------- Step 2 ---------------- */
/* ---------------- Step 2 ---------------- */
function Step2({ form, onChange, isEditable, saving, prev, next, save, card }) {
  return (
    <div className={`p-6 rounded-xl shadow ${card}`}>
      <h2 className="text-xl font-semibold mb-4">Business Details</h2>

      <Field label="Industry" value={form.industry} onChange={(v) => onChange("industry", v)} disabled={!isEditable} />
      <Field label="Location" value={form.location} onChange={(v) => onChange("location", v)} disabled={!isEditable} />

      {/* FIXED FUNDING STAGE (Dropdown) */}
      <label className="block mb-4">
        <div className="font-medium mb-1">Funding Stage</div>

        <select
          disabled={!isEditable}
          value={form.funding_stage}
          onChange={(e) => onChange("funding_stage", e.target.value)}
          className={`w-full p-2 border rounded ${!isEditable ? " cursor-not-allowed" : ""}`}
        >
          <option value="">Select Funding Stage</option>
          <option value="pre_seed">Pre-Seed</option>
          <option value="seed">Seed</option>
          <option value="series_a">Series A</option>
          <option value="series_b">Series B+</option>
          <option value="bootstrapped">Bootstrapped</option>
        </select>
      </label>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={prev} className="px-4 py-2 rounded-md border">Back</button>
        <button onClick={save} disabled={saving || !isEditable} className={`px-4 py-2 rounded-md ${isEditable ? "bg-green-600 text-white" : "bg-neutral-600 text-white/80 cursor-not-allowed"}`}>
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button onClick={next} className="px-4 py-2 rounded-md bg-blue-600 text-white">Next</button>
      </div>
    </div>
  );
}


/* ---------------- Step 3 (Review) ---------------- */
function Step3({ form, isEditable, submitting, prev, submit, save, card, applicationStatus, isVerified }) {
  return (
    <div className={`p-6 rounded-xl shadow ${card}`}>
      <h2 className="text-xl font-semibold mb-4">Review & Submit</h2>

      {isVerified && <div className="mb-3 text-green-600 font-semibold">✓ Verified Entrepreneur</div>}

      <div className="space-y-3">
        <Review label="Startup Name" value={form.startup_name} />
        <Review label="One Liner" value={form.one_liner} />
        <Review label="Website" value={form.website} />
        <Review label="Industry" value={form.industry} />
        <Review label="Location" value={form.location} />
        <Review label="Funding Stage" value={form.funding_stage} />
        <Review label="Description" value={form.description} />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={prev} className="px-4 py-2 rounded-md border">Back</button>

        <button onClick={save} className="px-4 py-2 bg-green-600 text-white rounded-md">Save Draft</button>

        <button
          onClick={submit}
          disabled={!isEditable || submitting || applicationStatus === "pending" || applicationStatus === "approved"}
          className={`px-4 py-2 rounded-md ${
            applicationStatus === "approved"
              ? "bg-green-600 text-white cursor-not-allowed"
              : applicationStatus === "pending"
              ? "bg-gray-500 text-white cursor-not-allowed"
              : "bg-blue-600 text-white"
          }`}
        >
          {submitting ? "Submitting..." : (applicationStatus === "approved" ? "Verified" : "Submit for Review")}
        </button>
      </div>

      <div className="mt-4 text-sm opacity-70">
        After submission, admins will review your profile. While in review, editing will be disabled.
      </div>
    </div>
  );
}

/* ---------------- reusable inputs ---------------- */
function Field({ label, value, onChange, disabled = false }) {
  return (
    <label className="block mb-4">
      <div className="font-medium mb-1">{label}</div>
      <input disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)} className={`w-full p-2 border rounded ${disabled ? " cursor-not-allowed" : ""}`} />
    </label>
  );
}

function Textarea({ label, value, onChange, disabled = false }) {
  return (
    <label className="block mb-4">
      <div className="font-medium mb-1">{label}</div>
      <textarea disabled={disabled} rows="4" value={value} onChange={(e) => onChange(e.target.value)} className={`w-full p-2 border rounded ${disabled ? " cursor-not-allowed" : ""}`} />
    </label>
  );
}

function Review({ label, value }) {
  return (
    <p className="mb-2">
      <span className="font-semibold">{label}:</span> {value || "-"}
    </p>
  );
}

/* ----------------- Modal components (submit note) ----------------- */

function ModalOverlay({ children, isDark, onClose }) {
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div onClick={(e) => e.stopPropagation()} className={`${isDark ? "bg-neutral-900 text-white" : "bg-white text-black"} rounded-xl shadow-lg w-full max-w-xl p-6`}>
        {children}
      </div>
    </div>
  );
}

function SubmitNoteModal({ onClose, onSubmit }) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    // note can be optional — follow expert modal rules (they required note on expert)
    setSending(true);
    try {
      await onSubmit(note);
      onClose();
    } catch (err) {
      console.error("Submit note modal error:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Submit Application for Review</h2>

      <label className="text-sm opacity-80">Admin Review Note (optional)</label>
      <textarea rows={4} className="w-full mt-2 px-3 py-2 rounded border" placeholder="Add any details for the admin..." value={note} onChange={(e) => setNote(e.target.value)} />

      <div className="mt-6 flex gap-3">
        <button onClick={submit} disabled={sending} className="px-4 py-2 rounded-md bg-blue-600 text-white">{sending ? "Submitting..." : "Submit Application"}</button>
        <button onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
      </div>
    </>
  );
}

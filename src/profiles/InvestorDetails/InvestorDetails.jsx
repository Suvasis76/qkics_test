import { useState, useEffect } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";

import { useSelector } from "react-redux";

export default function InvestorDetails({
  investorData,
  setInvestorData,
}) {
  const { theme, data: loggedUser } = useSelector((state) => state.user);
  const activeProfile = useSelector((state) => state.user.activeProfileData);
  const isDark = theme === "dark";

  const isOwnProfile = loggedUser?.username === (activeProfile?.profile?.user?.username || activeProfile?.profile?.username);
  const readOnly = !isOwnProfile;

  const { showAlert } = useAlert();

  const normalize = (data) => ({
    ...data,
    focus_industries: data?.focus_industries || [],
    preferred_stages: data?.preferred_stages || [],
  });

  const [editMode, setEditMode] = useState(false);
  const [local, setLocal] = useState(normalize(investorData));

  const [allIndustries, setAllIndustries] = useState([]);
  const [allStages, setAllStages] = useState([]);

  /* --------------------------
      FETCH META DATA
  --------------------------- */
  useEffect(() => {
    axiosSecure.get("/v1/investors/meta/").then((res) => {
      setAllIndustries(res.data?.industries || []);
      setAllStages(res.data?.stages || []);
    });
  }, []);

  /* --------------------------
      SYNC FROM PARENT
  --------------------------- */
  useEffect(() => {
    if (investorData) {
      setLocal(normalize(investorData));
    }
  }, [investorData]);

  const toggleItem = (list, item) =>
    list.find((i) => i.id === item.id)
      ? list.filter((i) => i.id !== item.id)
      : [...list, item];

  const investorTypes = [
    ["angel", "Angel Investor"],
    ["vc", "VC Firm"],
    ["family_office", "Family Office"],
    ["corporate", "Corporate VC"],
  ];

  const inputClass = (enabled) =>
    `w-full mt-1 px-3 py-2 rounded border ${isDark
      ? enabled
        ? "bg-neutral-700 border-green-400 text-white"
        : "bg-neutral-800 border-neutral-700 text-white opacity-60"
      : enabled
        ? "bg-white border-green-400"
        : "bg-neutral-100 border-neutral-300 opacity-60"
    }`;

  /* --------------------------
      SAVE
  --------------------------- */
  const handleSave = async () => {
    try {
      const payload = {
        display_name: local.display_name,
        one_liner: local.one_liner,
        investment_thesis: local.investment_thesis,
        check_size_min: local.check_size_min,
        check_size_max: local.check_size_max,
        location: local.location,
        website_url: local.website_url,
        linkedin_url: local.linkedin_url,
        twitter_url: local.twitter_url,
        investor_type: local.investor_type,

        focus_industries: local.focus_industries.map((i) => i.id),
        preferred_stages: local.preferred_stages.map((s) => s.id),
      };

      const res = await axiosSecure.patch(
        "/v1/investors/me/profile/",
        payload
      );

      setInvestorData(res.data);
      setLocal(normalize(res.data));
      setEditMode(false);

      showAlert("Investor profile updated!", "success");
    } catch (err) {
      console.error(err?.response?.data || err);
      showAlert("Failed to update investor profile", "error");
    }
  };

  /* ===============================
      UI
  =============================== */

  return (
    <div
      className={`p-6 rounded-xl shadow ${isDark ? "bg-neutral-900 text-white" : "bg-white text-black"
        }`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Investor Details</h2>

        {!readOnly &&
          (!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-1.5 rounded-md bg-red-500 text-white hover:bg-red-700"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-1.5 rounded-md bg-green-600 text-white"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setLocal(normalize(investorData));
                }}
                className="px-4 py-1.5 rounded-md bg-neutral-600 text-white"
              >
                Cancel
              </button>
            </div>
          ))}
      </div>

      {/* CONTENT */}
      <div className="flex flex-col gap-4">
        <Field
          label="Display Name"
          value={local.display_name}
          onChange={(v) => setLocal({ ...local, display_name: v })}
          editMode={editMode}
          inputClass={inputClass}
        />

        <Field
          label="One Liner"
          value={local.one_liner}
          onChange={(v) => setLocal({ ...local, one_liner: v })}
          editMode={editMode}
          inputClass={inputClass}
        />

        <Textarea
          label="Investment Thesis"
          value={local.investment_thesis}
          onChange={(v) =>
            setLocal({ ...local, investment_thesis: v })
          }
          editMode={editMode}
          inputClass={inputClass}
        />

        <MultiSelect
          label="Focus Industries"
          items={allIndustries}
          selected={local.focus_industries}
          editMode={editMode}
          onToggle={(item) =>
            setLocal({
              ...local,
              focus_industries: toggleItem(
                local.focus_industries,
                item
              ),
            })
          }
        />

        <MultiSelect
          label="Preferred Stages"
          items={allStages}
          selected={local.preferred_stages}
          editMode={editMode}
          onToggle={(item) =>
            setLocal({
              ...local,
              preferred_stages: toggleItem(
                local.preferred_stages,
                item
              ),
            })
          }
        />

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Min Check Size"
            value={local.check_size_min}
            onChange={(v) =>
              setLocal({ ...local, check_size_min: v })
            }
            editMode={editMode}
            inputClass={inputClass}
          />

          <Field
            label="Max Check Size"
            value={local.check_size_max}
            onChange={(v) =>
              setLocal({ ...local, check_size_max: v })
            }
            editMode={editMode}
            inputClass={inputClass}
          />
        </div>

        <Field
          label="Location"
          value={local.location}
          onChange={(v) => setLocal({ ...local, location: v })}
          editMode={editMode}
          inputClass={inputClass}
        />

        <Field
          label="Website"
          value={local.website_url}
          onChange={(v) =>
            setLocal({ ...local, website_url: v })
          }
          editMode={editMode}
          inputClass={inputClass}
        />

        <Field
          label="LinkedIn"
          value={local.linkedin_url}
          onChange={(v) =>
            setLocal({ ...local, linkedin_url: v })
          }
          editMode={editMode}
          inputClass={inputClass}
        />

        <Field
          label="Twitter"
          value={local.twitter_url}
          onChange={(v) =>
            setLocal({ ...local, twitter_url: v })
          }
          editMode={editMode}
          inputClass={inputClass}
        />

        <div>
          <label className="text-sm opacity-80">
            Investor Type
          </label>
          <select
            disabled={!editMode}
            value={local.investor_type}
            onChange={(e) =>
              setLocal({
                ...local,
                investor_type: e.target.value,
              })
            }
            className={inputClass(editMode)}
          >
            {investorTypes.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

/* ===============================
    REUSABLE COMPONENTS
=============================== */

function Field({ label, value, onChange, editMode, inputClass }) {
  return (
    <div>
      <label className="text-sm opacity-80">{label}</label>
      <input
        disabled={!editMode}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass(editMode)}
      />
    </div>
  );
}

function Textarea({ label, value, onChange, editMode, inputClass }) {
  return (
    <div>
      <label className="text-sm opacity-80">{label}</label>
      <textarea
        disabled={!editMode}
        rows={4}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass(editMode)}
      />
    </div>
  );
}

function MultiSelect({ label, items, selected, editMode, onToggle }) {
  return (
    <div>
      <label className="text-sm opacity-80">{label}</label>

      {!editMode ? (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.length ? (
            selected.map((i) => (
              <span
                key={i.id}
                className="px-3 py-1 rounded-full text-xs bg-blue-500/10 border border-blue-400 text-blue-400"
              >
                {i.name}
              </span>
            ))
          ) : (
            <span className="opacity-60">—</span>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                checked={!!selected.find((s) => s.id === item.id)}
                onChange={() => onToggle(item)}
              />
              {item.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

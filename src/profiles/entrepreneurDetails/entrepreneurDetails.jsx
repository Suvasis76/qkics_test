// src/profiles/entrepreneur/entrepreneurDetails.jsx

import { useState } from "react";
import axiosSecure from "../../components/utils/axiosSecure";
import { useAlert } from "../../context/AlertContext";

export default function EntrepreneurDetails({
  entreData,
  setEntreData,
  isDark,
}) {
  const { showAlert } = useAlert();

  const [editMode, setEditMode] = useState(false);
  const [local, setLocal] = useState({ ...entreData });

  const fundingOptions = [
    ["pre_seed", "Pre-Seed"],
    ["seed", "Seed"],
    ["series_a", "Series A"],
    ["series_b", "Series B+"],
    ["bootstrapped", "Bootstrapped"],
  ];

  const inputClass = (enabled) =>
    `w-full mt-1 px-3 py-2 rounded border ${
      isDark
        ? enabled
          ? "bg-neutral-700 border-blue-400 text-white"
          : "bg-neutral-800 border-neutral-700 text-white opacity-60"
        : enabled
        ? "bg-white border-blue-400"
        : "bg-neutral-100 border-neutral-300 opacity-60"
    }`;

  const handleSave = async () => {
    try {
      const res = await axiosSecure.patch(
        "/v1/entrepreneurs/me/profile/",
        local
      );

      setEntreData(res.data);
      setLocal(res.data);
      setEditMode(false);

      showAlert("Entrepreneur profile updated!", "success");
    } catch (err) {
      console.log(err);
      showAlert("Failed to update!", "error");
    }
  };

  return (
    <div
      className={`p-6 rounded-xl shadow ${
        isDark ? "bg-neutral-900 text-white" : "bg-white text-black"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Entrepreneur Details</h2>

        {!editMode ? (
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
                setLocal(entreData);
              }}
              className="px-4 py-1.5 rounded-md bg-neutral-600 text-white"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* ALL FIELDS */}
      <div className="flex flex-col gap-4">

        <Field
          label="Startup Name"
          value={local.startup_name}
          onChange={(v) => setLocal({ ...local, startup_name: v })}
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

        <Field
          label="Website"
          value={local.website}
          onChange={(v) => setLocal({ ...local, website: v })}
          editMode={editMode}
          inputClass={inputClass}
        />

        <Textarea
          label="Description"
          value={local.description}
          onChange={(v) => setLocal({ ...local, description: v })}
          editMode={editMode}
          inputClass={inputClass}
        />

        <Field
          label="Industry"
          value={local.industry}
          onChange={(v) => setLocal({ ...local, industry: v })}
          editMode={editMode}
          inputClass={inputClass}
        />

        <Field
          label="Location"
          value={local.location}
          onChange={(v) => setLocal({ ...local, location: v })}
          editMode={editMode}
          inputClass={inputClass}
        />

        {/* Dropdown */}
        <div>
          <label className="text-sm opacity-80">Funding Stage</label>
          <select
            disabled={!editMode}
            value={local.funding_stage}
            onChange={(e) =>
              setLocal({ ...local, funding_stage: e.target.value })
            }
            className={inputClass(editMode)}
          >
            {fundingOptions.map(([value, label]) => (
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

function Field({ label, value, onChange, editMode, inputClass }) {
  return (
    <div>
      <label className="text-sm opacity-80">{label}</label>
      <input
        disabled={!editMode}
        value={value}
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass(editMode)}
      />
    </div>
  );
}

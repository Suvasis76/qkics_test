// src/profiles/expert/expert_details_components/expertDetails.jsx

export default function ExpertDetails({
  expertData,
  setExpertData,
  editExp,
  setEditExp,
  handleSaveExpert,
  isDark,
  readOnly = false,
}) {
  const inputClass = (enabled) =>
    `w-full mt-1 px-3 py-2 rounded border ${
      isDark
        ? enabled
          ? "bg-neutral-700 border-green-400 text-white"
          : "bg-neutral-800 border-neutral-700 text-white opacity-60"
        : enabled
        ? "bg-white border-green-400"
        : "bg-neutral-100 border-neutral-300 opacity-60"
    }`;

  return (
    <div
      className={`p-6 rounded-xl shadow ${
        isDark ? "bg-neutral-900 text-white" : "bg-white"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Expert Details</h2>

        {/* ACTION BUTTONS */}
        {!readOnly && (
          <>
            {!editExp ? (
              <button
                onClick={() => setEditExp(true)}
                className="px-4 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveExpert}
                  className="px-4 py-1.5 rounded-md bg-green-500 text-white"
                >
                  Save
                </button>

                <button
                  onClick={() => setEditExp(false)}
                  className="px-4 py-1.5 rounded-md bg-neutral-600 text-white"
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm opacity-80">Headline</label>
          <input
            value={expertData.headline}
            disabled={!editExp}
            onChange={(e) =>
              setExpertData({ ...expertData, headline: e.target.value })
            }
            className={inputClass(editExp)}
          />
        </div>

        <div>
          <label className="text-sm opacity-80">Primary Expertise</label>
          <input
            value={expertData.primary_expertise}
            disabled={!editExp}
            onChange={(e) =>
              setExpertData({
                ...expertData,
                primary_expertise: e.target.value,
              })
            }
            className={inputClass(editExp)}
          />
        </div>

        <div>
          <label className="text-sm opacity-80">Other Expertise</label>
          <input
            value={expertData.other_expertise}
            disabled={!editExp}
            onChange={(e) =>
              setExpertData({
                ...expertData,
                other_expertise: e.target.value,
              })
            }
            className={inputClass(editExp)}
          />
        </div>

        <div>
          <label className="text-sm opacity-80">Hourly Rate</label>
          <input
            type="number"
            value={expertData.hourly_rate}
            disabled={!editExp}
            onChange={(e) =>
              setExpertData({ ...expertData, hourly_rate: e.target.value })
            }
            className={inputClass(editExp)}
          />
        </div>
      </div>
    </div>
  );
}

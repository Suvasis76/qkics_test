// src/shared/userDetails.jsx
export default function UserDetails({
  user,
  editMode,
  setEditMode,
  editData,
  setEditData,
  handleSave,
  isDark,
}) {
  const inputClass = (enabled) =>
    `w-full mt-1 px-3 py-2 rounded border ${
      isDark
        ? enabled
          ? "bg-neutral-700 border-green-400 text-white"
          : "bg-neutral-800 border-neutral-700 text-white opacity-60"
        : enabled
        ? "bg-white border-green-400 text-black"
        : "bg-neutral-100 border-neutral-300 text-black opacity-60"
    }`;

  return (
    <div
      className={`p-6 rounded-xl shadow ${
        isDark ? "bg-neutral-900 text-white" : "bg-white text-black"
      }`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">User Details</h2>

        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="px-4 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-md bg-green-500 text-white"
            >
              Save
            </button>

            <button
              onClick={() => setEditMode(false)}
              className="px-4 py-1.5 rounded-md bg-neutral-600 text-white"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* FORM */}
      <div className="flex flex-col gap-4">
        {/* First Name */}
        <div>
          <label className="text-sm opacity-80">First Name</label>
          <input
            value={editData.first_name}
            disabled={!editMode}
            onChange={(e) =>
              setEditData({ ...editData, first_name: e.target.value })
            }
            className={inputClass(editMode)}
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="text-sm opacity-80">Last Name</label>
          <input
            value={editData.last_name}
            disabled={!editMode}
            onChange={(e) =>
              setEditData({ ...editData, last_name: e.target.value })
            }
            className={inputClass(editMode)}
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-sm opacity-80">Email</label>
          <input value={editData.email} disabled className={inputClass(false)} />
        </div>

        {/* Phone */}
        <div>
          <label className="text-sm opacity-80">Phone</label>
          <input
            value={editData.phone}
            disabled={!editMode}
            onChange={(e) =>
              setEditData({ ...editData, phone: e.target.value })
            }
            className={inputClass(editMode)}
          />
        </div>
      </div>
    </div>
  );
}

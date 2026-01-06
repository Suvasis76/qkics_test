import { MdEdit, MdDelete } from "react-icons/md";
import { MdOutlineSchedule } from "react-icons/md";
import useThemeClasses from "../../components/utils/useThemeClasses";

export default function SlotCard({ slot, onEdit, onDelete, onReschedule , isDark}) {
  const { border1 } = useThemeClasses(isDark);
  const start = new Date(slot.start_datetime);
  const end = new Date(slot.end_datetime);

  

  // ✅ BACKEND IS SOURCE OF TRUTH
  const isAvailable = slot.is_available === true;

  const sameDay =
    start.toLocaleDateString() === end.toLocaleDateString();

  return (
    <div className="p-4 rounded-xl  shadow-xl  space-y-2" style={{border: border1}}>
      {/* TIME */}
      <div className="font-semibold">
        {start.toLocaleDateString()} •{" "}
        {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {" "}
        {!sameDay && `${end.toLocaleDateString()} • `}
        {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>

      {/* PRICE */}
      <div className="text-sm text-neutral-600">
        ₹{slot.price} • {slot.duration_minutes} mins
      </div>

      {/* STATUS */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span
          className={`px-2 py-1 rounded-full font-medium ${
            slot.status === "ACTIVE"
              ? " text-green-700"
              : " text-gray-700"
          }`}
        >
          {slot.status}
        </span>

        <span
          className={`px-2 py-1 rounded-full font-medium ${
            isAvailable
              ? "border-blue-700 bg-blue-400/10 text-blue-500 dark:border-blue-500 dark:bg-blue-500/20 dark:text-blue-400"
              : "border-red-700 bg-red-400/10 text-red-500 dark:border-red-500 dark:bg-red-500/20 dark:text-red-400"
          }`}
        >
          {isAvailable ? "Available" : "Booked"}
        </span>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2 pt-2">
        {isAvailable ? (
          <>
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-3 py-1 text-sm border rounded text-blue-700 hover:bg-blue-100 cursor-pointer"
            >
              <MdEdit /> Edit
            </button>

            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-3 py-1 text-sm border rounded text-red-600 hover:bg-red-100 cursor-pointer"
            >
              <MdDelete /> Delete
            </button>
          </>
        ) : (
          <button
            onClick={onReschedule}
            className="flex items-center gap-1 px-3 py-1 text-sm border rounded text-indigo-600 hover:bg-indigo-100 cursor-pointer"
          >
            <MdOutlineSchedule /> Reschedule
          </button>
        )}
      </div>
    </div>
  );
}

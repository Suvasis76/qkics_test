import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import axiosSecure from "../../utils/axiosSecure"; // adjust relative path

import { useDispatch, useSelector } from "react-redux";
import { createBooking, resetBookingState } from "../../../redux/slices/bookingSlice";
import { useAlert } from "../../../context/AlertContext";
import { useConfirm } from "../../../context/ConfirmContext";
import useThemeClasses from "../../utils/useThemeClasses";


export default function BookSession({ theme }) {
  const { expertUuid } = useParams();
  const navigate = useNavigate();

  const isDark = theme === "dark";

  const {border1 ,card } = useThemeClasses(isDark);


  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();

  const booking = useSelector((state) => state.booking);


  useEffect(() => {
    fetchSlots();
  }, [expertUuid]);

  const fetchSlots = async () => {
  try {
    setLoading(true);

    const res = await axiosSecure.get(
      `/v1/bookings/experts/${expertUuid}/slots/`
    );

    // ✅ ONLY keep available slots
    const availableSlots = (res.data || []).filter(
      (slot) => slot.is_available === true
    );

    setSlots(availableSlots);
  } catch (err) {
    console.error(err);
    setError("Failed to load booking data");
  } finally {
    setLoading(false);
  }
};


  const handleBook = (slotUuid) => {
  showConfirm({
    title: "Confirm Booking",
    message: "Do you want to book this session?",
    confirmText: "Book",
    cancelText: "Cancel",

    onConfirm: async () => {
      try {
        await dispatch(createBooking(slotUuid)).unwrap();

        showAlert("Booking created successfully", "success");

        // 🔥 remove booked slot from UI
        setSlots((prev) =>
          prev.filter((slot) => slot.uuid !== slotUuid)
        );

        dispatch(resetBookingState());
      } catch (err) {
        showAlert(
          typeof err === "string" ? err : "Booking failed",
          "error"
        );
      }
    },
  });
};



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading slots...
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

  return (
    <div className="min-h-screen pt-20 max-w-4xl mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
  <h1 className="text-xl font-semibold">
    Available Slots
  </h1>

  <button
    onClick={() => navigate(-1)}
    className="bg-gray-500 text-white px-4 py-1 rounded cursor-pointer hover:bg-gray-700"
  >
    ← Back
  </button>
</div>


      {slots.length === 0 ? (
        <p className="opacity-60">No slots available</p>
      ) : (
        <div className="grid gap-4">
          {slots.map((slot) => (
            <div
              key={slot.uuid}
              className={`p-4 rounded flex justify-between items-center ${
  isDark ? "shadow-lg" : "shadow-md"
}`}
style={{ border: border1 }}

            >
              <div>
                <div className="font-medium">
                  {new Date(slot.start_datetime).toLocaleDateString()}{" "}-{" "}
                  {new Date(slot.end_datetime).toLocaleDateString()}
                </div>
                <div className="text-sm opacity-70">
                  {new Date(slot.start_datetime).toLocaleTimeString()}–{" "}
                  {new Date(slot.end_datetime).toLocaleTimeString()}
                </div>
              </div>

              <button
              onClick={() => handleBook(slot.uuid)}
                className="bg-red-600 text-white px-4 py-1 rounded cursor-pointer hover:bg-red-700"
              >
                Book
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

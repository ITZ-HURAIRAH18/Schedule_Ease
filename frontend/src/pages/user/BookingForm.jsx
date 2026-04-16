// src/pages/user/BookingForm.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import UserHeader from "../../components/UserHeader";
import toast, { Toaster } from "react-hot-toast";
import { formatTime, getUserTimezone } from "../../utils/timeUtils";
import {
  CalendarDaysIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";

const BookingForm = () => {
  const { hostId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [host, setHost] = useState(location.state?.host || null);
  // const availabilityId = location.state?.availabilityId; 

  const availabilityId = location.state?.availabilityId;

  console.log(availabilityId, "avalaibli")
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    start: "",
    end: "",
    duration: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  /* ---------- effects ---------- */
  useEffect(() => {
    if (user) {
      setForm((p) => ({ ...p, name: user.name || p.name, email: user.email || p.email }));
    }
  }, []);

  useEffect(() => {
    if (!host) {
      axiosInstance
        .get("/user/hosts/availability")
        .then((res) => setHost(res.data.availability.find((a) => a.hostId?._id === hostId)))
        .catch(() => { });
    }
  }, [hostId]);

// ✅ Calculate end time correctly (without timezone manipulation)
useEffect(() => {
  if (form.start && Number(form.duration) > 0) {
    const startDateInput = form.start; // "2026-04-16T06:21" from datetime-local
    // Parse the local time properly
    const [datePart, timePart] = startDateInput.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes] = timePart.split(":").map(Number);
    
    // Create date in UTC assuming the input is in the user's local time
    // This is the correct way to handle datetime-local inputs
    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = new Date(startDate.getTime() + Number(form.duration) * 60000);
    
    // Convert back to datetime-local format
    const endString = endDate.getFullYear() +
      "-" + String(endDate.getMonth() + 1).padStart(2, "0") +
      "-" + String(endDate.getDate()).padStart(2, "0") +
      "T" + String(endDate.getHours()).padStart(2, "0") +
      ":" + String(endDate.getMinutes()).padStart(2, "0");
    
    setForm((p) => ({
      ...p,
      end: endString,
    }));
  }
}, [form.start, form.duration]);

// When host is loaded, set default duration from host availability (or from navigation state)
useEffect(() => {
  const preferred = location.state?.duration;
  if (host && (preferred || (host.durations && host.durations.length))) {
    setForm((p) => ({
      ...p,
      duration: preferred ?? host.durations[0],
    }));
  }
}, [host]);

  /* ---------- submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ✅ Convert datetime-local strings to ISO with timezone
      // The datetime-local input gives us: "2026-04-16T06:21"
      // We treat this as the user's local time and keep it as-is for backend
      const convertToUTC = (localDatetimeString) => {
        if (!localDatetimeString) return "";
        // Parse the local datetime string
        const [datePart, timePart] = localDatetimeString.split("T");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hours, minutes] = timePart.split(":").map(Number);
        
        // Create Date object (interpreted in user's local time)
        const localDate = new Date(year, month - 1, day, hours, minutes, 0);
        
        // Convert to UTC by accounting for timezone offset
        const timezoneOffset = localDate.getTimezoneOffset() * 60000;
        const utcDate = new Date(localDate.getTime() + timezoneOffset);
        
        return utcDate.toISOString();
      };
      
      const payload = {
        hostId,
        availabilityId,
        start: convertToUTC(form.start),
        end: convertToUTC(form.end),
        duration: form.duration,
        timezone: getUserTimezone(), // ✅ Include user's timezone
        guest: { name: form.name, email: form.email, phone: form.phone },
        createdByUserId: user.id || user._id,
      };
      console.log(payload, "payload from booking..")

      const { data } = await axiosInstance.post("/user/bookings", payload);
      toast.success(data.message || "Booking created!");
      setTimeout(() => navigate("/user/dashboard"), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "Booking failed";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!host)
    return (
      <>
        <UserHeader />
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center">
          <div className="text-white">Loading…</div>
        </div>
      </>
    );

  const todayDay = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const weeklySlot = host.weekly.find((s) => s.day?.trim().toLowerCase() === todayDay);
  const minTime = weeklySlot?.start || "09:00";
  const maxTime = weeklySlot?.end || "17:00";

  return (
    <>
      <UserHeader />
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
              <VideoCameraIcon className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Book with {host.hostId?.name || host.hostId?.fullName}</h2>
            <p className="text-sm text-gray-500 mt-1">Pick a slot and confirm your meeting</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="+1 234 567 890"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Start */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4" /> Start Time
              </label>
              <input
                type="datetime-local"
                value={form.start}
                // min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium text-gray-600">Host Availability:</span>
                <br />
                {host.weekly && host.weekly.length > 0 ? (
                  <ul className="mt-1 space-y-0.5">
                    {host.weekly.map((slot, i) => (
                      <li key={i} className="flex justify-between text-gray-600">
                        <span className="font-semibold w-16">{slot.day}:</span>
                        <span className="ml-2">{formatTime(slot.start)} - {formatTime(slot.end)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="italic text-gray-400">No availability set</span>
                )}
              </p>


            </div>

            {/* End */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <ClockIcon className="w-4 h-4" /> End Time
              </label>
              <input
                type="datetime-local"
                value={form.end}
                readOnly
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Duration</label>
              <select
                value={form.duration ?? ""}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select duration</option>
                {host.durations.map((d) => (
                  <option key={d} value={d}>
                    {d} mins
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-red-600 text-center text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-semibold shadow-md transition ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg"}`}
            >
              {loading ? "Submitting..." : "Book Now"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default BookingForm;
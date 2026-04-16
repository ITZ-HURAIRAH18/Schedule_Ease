// src/pages/user/BookingForm.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CalendarDays, 
  Clock, 
  Phone, 
  Mail, 
  User, 
  Video, 
  CheckCircle2, 
  Star,
  ShieldCheck,
  Zap,
  Info,
  Globe,
  Timer
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import UserHeader from "../../components/UserHeader";
import toast, { Toaster } from "react-hot-toast";
import { formatTime, getUserTimezone, localToUTC, calculateEndTime } from "../../utils/timeUtils";

const BookingForm = () => {
  const { hostId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [host, setHost] = useState(location.state?.host || null);
  const availabilityId = location.state?.availabilityId;

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
  const [isSuccess, setIsSuccess] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  /* ---------- effects ---------- */
  useEffect(() => {
    if (user) {
      setForm((p) => ({ ...p, name: user.name || user.fullName || p.name, email: user.email || p.email }));
    }
  }, []);

  useEffect(() => {
    if (!host) {
      axiosInstance
        .get("/user/hosts/availability")
        .then((res) => {
          const hostData = res.data.availability.find((a) => a.hostId?._id === hostId);
          setHost(hostData);
        })
        .catch(() => { });
    }
  }, [hostId]);

  // ✅ Calculate end time correctly
  useEffect(() => {
    if (form.start && Number(form.duration) > 0) {
      const endString = calculateEndTime(form.start, form.duration);
      setForm((p) => ({
        ...p,
        end: endString,
      }));
    }
  }, [form.start, form.duration]);

  // Set default duration
  useEffect(() => {
    const preferred = location.state?.duration;
    if (host && (preferred || (host.durations && host.durations.length))) {
      setForm((p) => ({
        ...p,
        duration: preferred ?? (Array.isArray(host.durations) ? host.durations[0] : host.durations),
      }));
    }
  }, [host]);

  /* ---------- submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        hostId,
        availabilityId,
        start: localToUTC(form.start),
        end: localToUTC(form.end),
        duration: form.duration,
        timezone: getUserTimezone(),
        guest: { name: form.name, email: form.email, phone: form.phone },
        createdByUserId: user.id || user._id,
      };

      const { data } = await axiosInstance.post("/user/bookings", payload);
      setIsSuccess(true);
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

  if (!host) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
        <UserHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#E8E4DF] border-t-[#C8622A] rounded-full animate-spin" />
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#92694A]">Loading booking details...</p>
          </div>
        </div>
      </div>
    );
  }

  const hostName = host.hostId?.name || host.hostId?.fullName || "Host";

  return (
    <div className="relative min-h-screen bg-[#FAFAF8] font-sans text-[#1A1A1A]">
      <Toaster position="top-right" />
      <UserHeader />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column: Host Info Card */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              className="bg-white border border-[#E8E4DF] rounded-[12px] p-6 sticky top-24"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-[10px] bg-[#C8622A] flex items-center justify-center text-white text-[32px] font-bold border-2 border-[#FDF0EA]">
                  {hostName.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <h2 className="text-[18px] font-semibold text-[#1A1A1A] text-center mb-1">{hostName}</h2>
              <p className="text-[13px] text-[#8A8A8A] text-center mb-6 pb-6 border-b border-[#E8E4DF]">Professional Host</p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[#C8622A]" />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#92694A]">Timezone</p>
                    <p className="text-[13px] font-semibold text-[#1A1A1A]">{host.timezone || "UTC"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#C8622A]" />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#92694A]">Duration</p>
                    <p className="text-[13px] font-semibold text-[#1A1A1A]">{host.durations?.[0] || "-"} minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Timer className="w-5 h-5 text-[#C8622A]" />
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#92694A]">Buffer</p>
                    <p className="text-[13px] font-semibold text-[#1A1A1A]">{host.bufferBefore || "0"} min before</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E8E4DF]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#92694A] mb-3">Weekly Schedule</p>
                <div className="space-y-2">
                  {host.weekly && host.weekly.length > 0 ? (
                    host.weekly.map((slot, i) => (
                      <div key={i} className="flex justify-between items-center text-[13px]">
                        <span className="text-[#92694A] font-medium capitalize">{slot.day}</span>
                        <span className="text-[#4A4A4A] font-semibold">{slot.start} — {slot.end}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-[13px] text-[#8A8A8A]">No schedule defined</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#E8E4DF]">
                <div className="flex gap-2 p-3 rounded-[10px] bg-[#FDF0EA]">
                  <Info className="w-4 h-4 text-[#C8622A] flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-[#92694A] leading-relaxed">All meetings are secure and encrypted. Links sent upon confirmation.</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
              className="bg-white border border-[#E8E4DF] rounded-[12px] p-8"
            >
              <h1 className="text-[24px] font-semibold text-[#1A1A1A] mb-1">Book Your Meeting</h1>
              <p className="text-[14px] text-[#8A8A8A] mb-8">Fill in your details to confirm</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-[#1A1A1A] flex items-center gap-2">
                      <User className="w-4 h-4 text-[#C8622A]" /> Full Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full h-11 px-4 bg-white border border-[#E8E4DF] rounded-[10px] text-[14px] focus:outline-none focus:border-[#C8622A] focus:ring-4 focus:ring-[#C8622A]/10 transition-all placeholder:text-[#B0B0B0]"
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-[#1A1A1A] flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#C8622A]" /> Phone
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                      className="w-full h-11 px-4 bg-white border border-[#E8E4DF] rounded-[10px] text-[14px] focus:outline-none focus:border-[#C8622A] focus:ring-4 focus:ring-[#C8622A]/10 transition-all placeholder:text-[#B0B0B0]"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#1A1A1A] flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#C8622A]" /> Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full h-11 px-4 bg-white border border-[#E8E4DF] rounded-[10px] text-[14px] focus:outline-none focus:border-[#C8622A] focus:ring-4 focus:ring-[#C8622A]/10 transition-all placeholder:text-[#B0B0B0]"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[13px] font-semibold text-[#1A1A1A]">Meeting Duration</label>
                  <div className="flex flex-wrap gap-2">
                    {host.durations && (Array.isArray(host.durations) ? host.durations : [host.durations]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setForm({ ...form, duration: Number(d) })}
                        className={`px-4 py-2 rounded-[8px] text-[13px] font-semibold border-2 transition-all duration-200 ${
                          Number(form.duration) === Number(d)
                            ? "bg-[#C8622A] text-white border-[#C8622A]"
                            : "bg-[#F5F3F0] text-[#4A4A4A] border-[#E8E4DF] hover:border-[#C8622A]"
                        }`}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-[#1A1A1A] flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-[#C8622A]" /> Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={form.start}
                      onChange={(e) => setForm({ ...form, start: e.target.value })}
                      required
                      className="w-full h-11 px-4 bg-white border border-[#E8E4DF] rounded-[10px] text-[14px] focus:outline-none focus:border-[#C8622A] focus:ring-4 focus:ring-[#C8622A]/10 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-[#8A8A8A] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#2D7D52]" /> End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={form.end}
                      readOnly
                      className="w-full h-11 px-4 bg-[#F5F3F0] border border-[#E8E4DF] rounded-[10px] text-[14px] cursor-not-allowed text-[#8A8A8A]"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-[#FEF2F2] border border-[#FEE2E2] rounded-[10px] text-[#B91C1C] text-[13px] font-medium flex gap-3"
                    >
                      <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={!loading && !isSuccess ? { translateY: -2 } : {}}
                  whileTap={!loading && !isSuccess ? { scale: 0.98 } : {}}
                  type="submit"
                  disabled={loading}
                  className={`w-full h-12 rounded-[10px] font-semibold text-[14px] flex items-center justify-center gap-2 transition-all duration-200 mt-8 ${
                    isSuccess 
                      ? "bg-[#2D7D52] text-white shadow-[0_4px_12px_rgba(45,125,82,0.2)]" 
                      : loading
                        ? "bg-[#E8E4DF] text-[#8A8A8A] cursor-not-allowed"
                        : "bg-[#C8622A] text-white hover:bg-[#A84E20] shadow-[0_4px_12px_rgba(200,98,42,0.2)] hover:shadow-[0_8px_16px_rgba(200,98,42,0.3)]"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#8A8A8A] border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Booking Confirmed!
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      Confirm Booking
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </main>

      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 z-50" />
    </div>
  );
};

export default BookingForm;
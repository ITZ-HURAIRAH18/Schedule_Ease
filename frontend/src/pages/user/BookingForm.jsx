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
  Info
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import UserHeader from "../../components/UserHeader";
import MeshBackground from "../../components/MeshBackground";
import Tilt from "../../components/Tilt";
import toast, { Toaster } from "react-hot-toast";
import { formatTime, getUserTimezone } from "../../utils/timeUtils";

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
      const startDateInput = form.start; // "2026-04-16T06:21"
      const [datePart, timePart] = startDateInput.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes] = timePart.split(":").map(Number);
      
      const startDate = new Date(year, month - 1, day, hours, minutes);
      const endDate = new Date(startDate.getTime() + Number(form.duration) * 60000);
      
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
      const convertToUTC = (localDatetimeString) => {
        if (!localDatetimeString) return "";
        const [datePart, timePart] = localDatetimeString.split("T");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hours, minutes] = timePart.split(":").map(Number);
        const localDate = new Date(year, month - 1, day, hours, minutes, 0);
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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  if (!host) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden">
        <MeshBackground />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"
        />
      </div>
    );
  }

  const hostName = host.hostId?.name || host.hostId?.fullName || "Host";

  return (
    <div className="relative min-h-screen font-sans text-slate-900 overflow-x-hidden">
      <Toaster position="top-right" />
      <UserHeader />
      <MeshBackground />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative grid grid-cols-1 lg:grid-cols-5 gap-8"
        >
          {/* Left Column: Host Info */}
          <div className="lg:col-span-2 space-y-6">
            <Tilt maxTilt={5}>
              <motion.div 
                variants={itemVariants}
                className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-slate-200/50 rounded-3xl p-8"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-violet-200">
                      {hostName.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg ring-4 ring-white">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-slate-900">{hostName}</h2>
                  <p className="text-slate-500 font-medium mb-4">Elite Professional</p>
                  
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-100">
                      <Star className="w-3 h-3 fill-current" /> 4.9 Rating
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-violet-50 text-violet-600 rounded-full text-xs font-bold border border-violet-100">
                      <Zap className="w-3 h-3" /> Fast Response
                    </span>
                  </div>

                  <div className="w-full space-y-4 pt-6 border-t border-slate-100 text-left">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" /> Available Days
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {host.weekly?.map((slot, i) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-slate-700">{slot.day}</span>
                          <span className="text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            {formatTime(slot.start)} - {formatTime(slot.end)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </Tilt>

            <motion.div 
              variants={itemVariants}
              className="bg-violet-900/10 backdrop-blur-md border border-violet-200/20 rounded-2xl p-6 text-sm text-violet-700"
            >
              <div className="flex gap-3">
                <Info className="w-5 h-5 flex-shrink-0" />
                <p>All meetings are held via our secure, high-definition video conferencing platform. Links will be provided upon confirmation.</p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Booking Form */}
          <div className="lg:col-span-3">
            <motion.div 
              variants={itemVariants}
              className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-slate-200/50 rounded-3xl p-8 sm:p-10"
            >
              <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Reserve Your Slot</h1>
                <p className="text-slate-600">Fill in your details to secure a meeting with {hostName.split(' ')[0]}.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Floating Label Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                    <input
                      type="text"
                      id="name"
                      placeholder=" "
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="peer w-full pl-12 pr-4 pt-6 pb-2 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-medium"
                    />
                    <label 
                      htmlFor="name" 
                      className="absolute left-12 top-4 text-slate-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-violet-600 font-semibold"
                    >
                      Full Name
                    </label>
                  </div>

                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                    <input
                      type="text"
                      id="phone"
                      placeholder=" "
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                      className="peer w-full pl-12 pr-4 pt-6 pb-2 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-medium"
                    />
                    <label 
                      htmlFor="phone" 
                      className="absolute left-12 top-4 text-slate-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-violet-600 font-semibold"
                    >
                      Phone Number
                    </label>
                  </div>
                </div>

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                  <input
                    type="email"
                    id="email"
                    placeholder=" "
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="peer w-full pl-12 pr-4 pt-6 pb-2 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-medium"
                  />
                  <label 
                    htmlFor="email" 
                    className="absolute left-12 top-4 text-slate-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-violet-600 font-semibold"
                  >
                    Email Address
                  </label>
                </div>

                {/* Duration Pills */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 ml-1">Select Duration</label>
                  <div className="flex flex-wrap gap-2">
                    {host.durations && (Array.isArray(host.durations) ? host.durations : [host.durations]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setForm({ ...form, duration: Number(d) })}
                        className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                          Number(form.duration) === Number(d)
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-200 ring-2 ring-violet-600 ring-offset-2"
                            : "bg-slate-50 text-slate-600 border border-slate-200 hover:border-violet-300 hover:bg-violet-50"
                        }`}
                      >
                        {d} Minutes
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date/Time Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-violet-600" /> Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={form.start}
                      onChange={(e) => setForm({ ...form, start: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2 opacity-50">
                      <CheckCircle2 className="w-4 h-4" /> End Time (Auto)
                    </label>
                    <input
                      type="datetime-local"
                      value={form.end}
                      readOnly
                      className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-400 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-medium flex gap-2"
                  >
                    <Info className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  className={`w-full py-5 rounded-3xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-3 mt-4 ${
                    isSuccess 
                      ? "bg-emerald-500 text-white shadow-emerald-200" 
                      : loading
                        ? "bg-slate-400 text-white cursor-not-allowed"
                        : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-violet-200 hover:shadow-2xl hover:shadow-violet-300"
                  }`}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 className="w-6 h-6" />
                      Booking Confirmed!
                    </>
                  ) : (
                    <>
                      <Video className="w-6 h-6" />
                      Confirm Meeting
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
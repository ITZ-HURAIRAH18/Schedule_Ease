// src/pages/host/EditAvailability.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Globe, 
  CheckCircle2, 
  CalendarDays,
  Settings2,
  XCircle,
  Save,
  Loader2
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import HostHeader from "../../components/HostHeader";
import MeshBackground from "../../components/MeshBackground";
import toast, { Toaster } from "react-hot-toast";

const daysOfWeek = [
  { full: "Monday", short: "Mon" },
  { full: "Tuesday", short: "Tue" },
  { full: "Wednesday", short: "Wed" },
  { full: "Thursday", short: "Thu" },
  { full: "Friday", short: "Fri" },
  { full: "Saturday", short: "Sat" },
  { full: "Sunday", short: "Sun" },
];

const EditAvailability = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [weekly, setWeekly] = useState([{ day: "", start: "09:00", end: "17:00" }]);
  const [bufferBefore, setBufferBefore] = useState(15);
  const [bufferAfter, setBufferAfter] = useState(15);
  const [durations, setDurations] = useState(30);
  const [maxPerDay, setMaxPerDay] = useState(8);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  /* ---------- load data ---------- */
  useEffect(() => {
    axiosInstance
      .get(`/host/availability/${id}`)
      .then((res) => {
        const d = res.data;
        setWeekly(d.weekly?.length ? d.weekly : [{ day: "", start: "09:00", end: "17:00" }]);
        setBufferBefore(d.bufferBefore || 15);
        setBufferAfter(d.bufferAfter || 15);
        setDurations(Array.isArray(d.durations) ? d.durations[0] : (d.durations || 30));
        setMaxPerDay(d.maxPerDay || 8);
        setTimezone(d.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
        setBlockedDates(d.blockedDates || []);
      })
      .catch(() => toast.error("Failed to load availability"))
      .finally(() => setLoading(false));
  }, [id]);

  /* ---------- handlers ---------- */
  const addDay = () => setWeekly([...weekly, { day: "", start: "09:00", end: "17:00" }]);
  const updateDay = (i, f, v) => setWeekly((w) => w.map((s, idx) => (idx === i ? { ...s, [f]: v } : s)));
  const removeDay = (i) => setWeekly((w) => w.filter((_, idx) => idx !== i));

  const addBlocked = () => setBlockedDates([...blockedDates, ""]);
  const updateBlock = (i, v) => setBlockedDates((d) => d.map((dt, idx) => (idx === i ? v : dt)));
  const removeBlock = (i) => setBlockedDates((d) => d.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await axiosInstance.put(`/host/availability/update/${id}`, {
        weekly: weekly.filter((w) => w.day && w.start && w.end),
        bufferBefore: Number(bufferBefore),
        bufferAfter: Number(bufferAfter),
        durations: [Number(durations)],
        maxPerDay: Number(maxPerDay),
        timezone,
        blockedDates: blockedDates.filter(Boolean),
      });
      setIsSuccess(true);
      toast.success("Availability updated successfully!");
      setTimeout(() => {
        navigate("/host/manage-availability");
      }, 1500);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
      setIsSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden">
        <MeshBackground />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-violet-600 animate-pulse" />
        </motion.div>
      </div>
    );

  return (
    <div className="relative min-h-screen font-sans text-slate-900 overflow-x-hidden">
      <Toaster position="top-right" />
      <HostHeader />
      <MeshBackground />

      <main className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative"
        >
          {/* Header Section */}
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600/10 text-violet-600 mb-4"
            >
              <CalendarDays className="w-8 h-8" />
            </motion.div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Edit Availability
            </h1>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
              Modify your schedule and preferences. Changes will update your active booking link.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Weekly Schedule Card */}
              <motion.section 
                variants={itemVariants}
                className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-slate-200/50 rounded-3xl p-6 sm:p-8"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold">Weekly Schedule</h2>
                  </div>
                </div>

                <div className="space-y-6">
                  <AnimatePresence mode="popLayout">
                    {weekly.map((slot, i) => (
                      <motion.div
                        key={i}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group relative p-6 rounded-2xl bg-slate-50/50 border border-slate-200 hover:border-violet-200 hover:bg-white transition-all duration-300"
                      >
                        <button
                          onClick={() => removeDay(i)}
                          className="absolute -top-3 -right-3 p-2 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-rose-500 hover:border-rose-200 shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="space-y-6">
                          {/* Day Pills Grid */}
                          <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map((day) => (
                              <button
                                key={day.full}
                                type="button"
                                onClick={() => updateDay(i, "day", day.full)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                                  slot.day === day.full
                                    ? "bg-violet-600 text-white shadow-lg shadow-violet-200 ring-2 ring-violet-600 ring-offset-2"
                                    : "bg-white text-slate-600 border border-slate-200 hover:border-violet-300 hover:bg-violet-50"
                                }`}
                              >
                                {day.short}
                              </button>
                            ))}
                          </div>

                          {/* Time Inputs */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative">
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 ml-1">Start Time</label>
                              <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  type="time"
                                  value={slot.start}
                                  onChange={(e) => updateDay(i, "start", e.target.value)}
                                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all font-medium"
                                />
                              </div>
                            </div>
                            <div className="relative">
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 ml-1">End Time</label>
                              <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                  type="time"
                                  value={slot.end}
                                  onChange={(e) => updateDay(i, "end", e.target.value)}
                                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all font-medium"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addDay}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-semibold hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50/50 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Another Slot
                  </motion.button>
                </div>
              </motion.section>

              {/* Blocked Dates Card */}
              <motion.section 
                variants={itemVariants}
                className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-slate-200/50 rounded-3xl p-6 sm:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold">Blocked Dates</h2>
                </div>

                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {blockedDates.map((date, i) => (
                      <motion.div
                        key={i}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3"
                      >
                        <div className="relative flex-1">
                          <input
                            type="date"
                            value={date}
                            onChange={(e) => updateBlock(i, e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all font-medium"
                          />
                        </div>
                        <button
                          onClick={() => removeBlock(i)}
                          className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <button
                    onClick={addBlocked}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Blocked Date
                  </button>
                </div>
              </motion.section>
            </div>

            {/* Sidebar Settings */}
            <div className="space-y-6">
              <motion.section 
                variants={itemVariants}
                className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-slate-200/50 rounded-3xl p-6 sm:p-8"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <Settings2 className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold">Preferences</h2>
                </div>

                <div className="space-y-8">
                  {/* Slider: Buffer Before */}
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <label className="text-sm font-bold text-slate-700">Buffer Before</label>
                      <span className="text-sm font-mono font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                        {bufferBefore}m
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="5"
                      value={bufferBefore}
                      onChange={(e) => setBufferBefore(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                  </div>

                  {/* Slider: Buffer After */}
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <label className="text-sm font-bold text-slate-700">Buffer After</label>
                      <span className="text-sm font-mono font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                        {bufferAfter}m
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="5"
                      value={bufferAfter}
                      onChange={(e) => setBufferAfter(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                  </div>

                  {/* Slider: Duration */}
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <label className="text-sm font-bold text-slate-700">Meeting Duration</label>
                      <span className="text-sm font-mono font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                        {durations}m
                      </span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="120"
                      step="15"
                      value={durations}
                      onChange={(e) => setDurations(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                  </div>

                  {/* Slider: Max Bookings */}
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <label className="text-sm font-bold text-slate-700">Daily Limit</label>
                      <span className="text-sm font-mono font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                        {maxPerDay}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={maxPerDay}
                      onChange={(e) => setMaxPerDay(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Timezone</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/host/manage-availability")}
                  className="py-4 rounded-2xl font-bold text-slate-600 bg-white border border-slate-200 shadow-lg shadow-slate-200/50 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Cancel
                </motion.button>
                
                <motion.button
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`py-4 rounded-2xl font-bold shadow-xl transition-all duration-300 flex items-center justify-center gap-3 ${
                    isSuccess 
                      ? "bg-emerald-500 text-white shadow-emerald-200" 
                      : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-violet-200 hover:shadow-2xl hover:shadow-violet-300"
                  }`}
                >
                  {isSaving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-6 h-6" />
                    </motion.div>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 className="w-6 h-6" />
                      Updated!
                    </>
                  ) : (
                    <>
                      <Save className="w-6 h-6" />
                      Update
                    </>
                  )}
                </motion.button>
              </div>

              <p className="text-center text-xs text-slate-400 px-4">
                Update will take effect immediately. Existing bookings will not be modified.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
      
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 z-50" />
    </div>
  );
};

export default EditAvailability;
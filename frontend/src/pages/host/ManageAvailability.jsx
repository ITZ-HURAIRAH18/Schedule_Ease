// src/pages/host/ManageAvailability.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  Globe, 
  Pencil, 
  Trash2, 
  Eye, 
  Plus, 
  X,
  Info,
  CalendarDays,
  Timer
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import HostHeader from "../../components/HostHeader";
import { useNavigate } from "react-router-dom";
import MeshBackground from "../../components/MeshBackground";
import Tilt from "../../components/Tilt";

const ManageAvailability = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewData, setViewData] = useState(null);
  const navigate = useNavigate();

  /* ---------- helpers ---------- */
  const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    return `${(h % 12 || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };

  /* ---------- data ---------- */
  const fetchAvailability = async () => {
    try {
      const res = await axiosInstance.get("/host/availability/me");
      setAvailability(res.data.availability || []);
    } catch {
      setAvailability([]);
    } finally {
      // Add a slight delay for smoother transition from skeleton to content
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  /* ---------- actions ---------- */
  const handleEdit = (id) => navigate(`/host/edit-availability/${id}`);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this availability permanently?")) return;
    try {
      await axiosInstance.delete(`/host/availability/delete/${id}`);
      // Optimistic update for smooth animation
      setAvailability(prev => prev.filter(item => item._id !== id));
    } catch {
      alert("Delete failed");
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-200">
      <MeshBackground />
      <HostHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 relative z-10">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Manage Availability
            </h1>
            <p className="text-slate-400 mt-2 text-lg">
              Fine-tune your schedule and booking windows.
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/host/add-availability")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Schedule</span>
          </motion.button>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : availability.length === 0 ? (
          <EmptyState onAdd={() => navigate("/host/add-availability")} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {availability.map((item) => (
                <AvailabilityCard
                  key={item._id}
                  item={item}
                  formatTime={formatTime}
                  onEdit={() => handleEdit(item._id)}
                  onDelete={() => handleDelete(item._id)}
                  onView={() => setViewData(item)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <AnimatePresence>
        {viewData && (
          <ViewModal 
            data={viewData} 
            formatTime={formatTime} 
            onClose={() => setViewData(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ---------- sub-components ---------- */

const TimelineView = ({ weekly }) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  const getMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  return (
    <div className="mt-6 space-y-2">
      <div className="flex justify-between items-center mb-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Weekly Timeline</p>
        <div className="flex gap-2">
          <span className="text-[8px] text-slate-600">00:00</span>
          <span className="text-[8px] text-slate-600">12:00</span>
          <span className="text-[8px] text-slate-600">23:59</span>
        </div>
      </div>
      <div className="space-y-2">
        {days.map(day => {
          const slot = weekly.find(w => w.day === day);
          const startM = slot ? getMinutes(slot.start) : 0;
          const endM = slot ? getMinutes(slot.end) : 0;
          const left = (startM / 1440) * 100;
          const width = ((endM - startM) / 1440) * 100;

          return (
            <div key={day} className="flex items-center gap-3">
              <span className="text-[9px] w-8 text-slate-400 font-bold">{day.slice(0, 3)}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                {slot && (
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className="absolute inset-y-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      transformOrigin: "left"
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AvailabilityCard = ({ item, formatTime, onEdit, onDelete, onView }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -50, transition: { duration: 0.3 } }}
      className="h-full"
    >
      <Tilt className="h-full">
        <div className="h-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 flex flex-col group hover:border-indigo-500/30 transition-colors shadow-2xl relative overflow-hidden">
          {/* Subtle Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full group-hover:bg-indigo-500/20 transition-colors" />

          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white leading-tight">{item.timezone}</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Timezone</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <ActionButton 
                icon={<Eye className="w-4 h-4" />} 
                onClick={onView} 
                tooltip="Quick Preview"
                className="bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white"
              />
              <ActionButton 
                icon={<Pencil className="w-4 h-4" />} 
                onClick={onEdit} 
                tooltip="Edit Schedule"
                className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white"
              />
              <ActionButton 
                icon={<Trash2 className="w-4 h-4" />} 
                onClick={onDelete} 
                tooltip="Delete Permanently"
                className="bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Duration</span>
              </div>
              <p className="text-sm font-bold text-white">{item.durations[0]} <span className="text-[10px] font-medium text-slate-500 italic">min</span></p>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Daily Max</span>
              </div>
              <p className="text-sm font-bold text-white">{item.maxPerDay} <span className="text-[10px] font-medium text-slate-500 italic">slots</span></p>
            </div>
          </div>

          <TimelineView weekly={item.weekly} />

          <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/5 relative z-10">
            <div className="flex -space-x-1.5">
              {item.weekly.map((w, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[8px] font-black text-white shadow-lg">
                  {w.day[0]}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <Timer className="w-3 h-3 text-indigo-400" />
              <span>Buffers: {item.bufferBefore}/{item.bufferAfter}m</span>
            </div>
          </div>
        </div>
      </Tilt>
    </motion.div>
  );
};

const ActionButton = ({ icon, onClick, tooltip, className }) => (
  <div className="relative group/btn">
    <button 
      onClick={onClick}
      className={`p-2.5 rounded-xl transition-all duration-300 transform active:scale-95 ${className}`}
    >
      {icon}
    </button>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl border border-white/10">
      {tooltip}
    </div>
  </div>
);

const ViewModal = ({ data, formatTime, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-white/10 backdrop-blur-[40px] border border-white/20 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full -ml-32 -mb-32" />

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all z-20 border border-white/10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-5 mb-10 relative z-10">
          <div className="p-5 bg-indigo-500/20 rounded-[1.5rem] border border-indigo-500/30">
            <CalendarDays className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Schedule Preview</h2>
            <p className="text-slate-400 font-medium flex items-center gap-2 mt-1">
              <Globe className="w-4 h-4" /> {data.timezone}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-6">
            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-6">
              <ModalRow icon={<Timer />} label="Session Duration" value={`${data.durations[0]} Minutes`} />
              <ModalRow icon={<Info />} label="Buffers (Pre/Post)" value={`${data.bufferBefore}m / ${data.bufferAfter}m`} />
              <ModalRow icon={<Clock />} label="Max Daily Bookings" value={`${data.maxPerDay} Sessions`} />
            </div>
            
            <div className="px-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Blocked Dates</p>
              {data.blockedDates?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.blockedDates.map((date, i) => (
                    <span key={i} className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-medium">
                      {date}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" /> No dates blocked
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/5 rounded-[2rem] p-6 border border-white/5 flex flex-col">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Weekly Schedule</p>
            <div className="space-y-1 flex-1">
              {data.weekly.map((w, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 group/row">
                  <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{w.day}</span>
                  <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
                    {formatTime(w.start)} - {formatTime(w.end)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-end relative z-10">
          <button
            onClick={onClose}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20"
          >
            Done Reviewing
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ModalRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 group">
    <div className="p-2.5 bg-white/5 rounded-xl text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
      {React.cloneElement(icon, { size: 18 })}
    </div>
    <div>
      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">{label}</p>
      <p className="text-white font-bold leading-tight">{value}</p>
    </div>
  </div>
);

const EmptyState = ({ onAdd }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[4rem] p-16 text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
    
    <div className="relative w-56 h-56 mx-auto mb-10">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-[80px]"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl animate-pulse" />
      </div>
      <CalendarDays className="w-full h-full text-indigo-500 relative z-10 opacity-40 transform -rotate-12" strokeWidth={1} />
    </div>

    <h3 className="text-4xl font-black text-white mb-4 tracking-tight">Empty Calendar?</h3>
    <p className="text-slate-400 mb-12 text-lg leading-relaxed font-medium">
      Your schedule is currently a blank canvas. Let's paint some availability so clients can start booking your time!
    </p>
    <button
      onClick={onAdd}
      className="group relative inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black shadow-2xl shadow-indigo-500/40 transition-all hover:scale-105 active:scale-95"
    >
      <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      Get Started Now
    </button>
  </motion.div>
);

const SkeletonCard = () => (
  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 h-[500px] animate-pulse relative overflow-hidden">
    <div className="flex justify-between mb-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/10 rounded-2xl" />
        <div className="space-y-2">
          <div className="w-32 h-4 bg-white/10 rounded" />
          <div className="w-20 h-2 bg-white/10 rounded" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-9 h-9 bg-white/10 rounded-xl" />
        <div className="w-9 h-9 bg-white/10 rounded-xl" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4 mb-10">
      <div className="h-16 bg-white/10 rounded-2xl" />
      <div className="h-16 bg-white/10 rounded-2xl" />
    </div>
    <div className="space-y-4">
      {[1, 2, 3, 4, 5, 6, 7].map(i => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-2 bg-white/10 rounded" />
          <div className="flex-1 h-1.5 bg-white/5 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export default ManageAvailability;
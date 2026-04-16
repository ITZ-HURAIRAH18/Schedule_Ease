// src/pages/host/HostDashboard.jsx  (pagination only)
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import HostHeader from "../../components/HostHeader";
import MeshBackground from "../../components/MeshBackground";
import Tilt from "../../components/Tilt";
import { io } from "socket.io-client";
import { getSocketUrl } from "../../utils/apiConfig";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Video,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDate, formatTime } from "../../utils/timeUtils";

// Connect to the backend Socket.IO server
const socket = io(getSocketUrl(), {
  secure: window.location.protocol === 'https:',
  rejectUnauthorized: false,
});

const HostDashboard = () => {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 5;

  /* ---------- initial data + socket ---------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get("/host/dashboard");
        setData(res.data);
        socket.emit("join_host_room", res.data.hostId);
        // Artificial delay for shimmer effect demo
        setTimeout(() => setIsLoading(false), 800);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setIsLoading(false);
      }
    };

    fetchData();

    socket.on("host_dashboard_updated", (updated) => setData(updated));
    return () => socket.off("host_dashboard_updated");
  }, []);

  /* ---------- pagination ---------- */
  const total = data?.recentBookings?.length || 0;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const paginated = data?.recentBookings?.slice(start, start + pageSize) || [];

  const statIcons = {
    totalBookings: { icon: CalendarDays, color: "bg-blue-500", text: "text-blue-600" },
    upcomingBookings: { icon: CheckCircle2, color: "bg-emerald-500", text: "text-emerald-600" },
    pendingBookings: { icon: AlertCircle, color: "bg-amber-500", text: "text-amber-600" },
    cancelledBookings: { icon: XCircle, color: "bg-rose-500", text: "text-rose-600" },
    pastBookings: { icon: Clock, color: "bg-indigo-500", text: "text-indigo-600" },
  };

  const statusStyles = (s) => {
    switch (s) {
      case "confirmed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "rejected":
      case "cancelled":
        return "bg-rose-100 text-rose-700 border-rose-200";
      default:
        return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  if (isLoading) return <DashboardSkeleton />;

  const { stats } = data;

  return (
    <div className="min-h-screen bg-transparent relative">
      <MeshBackground />
      <HostHeader />
      
      <motion.main 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20 relative z-10"
      >
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-black text-gray-900 tracking-tight"
            >
              Host Dashboard
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-500 mt-2 text-lg"
            >
              Welcome back! Here's what's happening today.
            </motion.p>
          </div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/50 shadow-sm"
          >
            <div className="flex -space-x-2 px-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-indigo-${i+3}00 flex items-center justify-center text-[10px] text-white font-bold`}>
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span className="text-sm font-bold text-indigo-600 pr-3">12 active guests</span>
          </motion.div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {Object.entries(stats).map(([key, value], index) => (
            <StatCard 
              key={key} 
              label={key.replace(/([A-Z])/g, " $1").trim()} 
              value={value} 
              config={statIcons[key]} 
              index={index}
            />
          ))}
        </div>

        {/* Recent Bookings Section */}
        <section className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 shadow-2xl shadow-indigo-500/5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-violet-600">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Bookings</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl border border-white/80">
                <Search className="w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search guests..." className="bg-transparent border-none outline-none text-sm w-40" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {paginated.map((b, i) => (
                <BookingRow 
                  key={b._id} 
                  booking={b} 
                  statusStyles={statusStyles} 
                  navigate={navigate} 
                  index={i}
                />
              ))}
            </AnimatePresence>
            
            {paginated.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No bookings found</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-10 pt-8 border-t border-white/40">
              <p className="text-sm font-medium text-gray-500">
                Showing <span className="text-gray-900">{start + 1}</span> to <span className="text-gray-900">{Math.min(start + pageSize, total)}</span> of <span className="text-gray-900">{total}</span> bookings
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center text-gray-600 hover:bg-violet-600 hover:text-white disabled:opacity-30 disabled:hover:bg-white/60 disabled:hover:text-gray-600 transition-all shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                        page === i + 1 
                        ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30" 
                        : "bg-white/60 text-gray-600 hover:bg-white"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center text-gray-600 hover:bg-violet-600 hover:text-white disabled:opacity-30 disabled:hover:bg-white/60 disabled:hover:text-gray-600 transition-all shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </section>
      </motion.main>
    </div>
  );
};

/* ---------- sub-components ---------- */

const Counter = ({ value }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const animation = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return animation.stop;
  }, [value]);

  return <motion.span>{rounded}</motion.span>;
};

const StatCard = ({ label, value, config, index }) => (
  <Tilt maxTilt={10}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 border border-white/80 shadow-xl shadow-indigo-500/5 group hover:bg-white transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`w-12 h-12 rounded-2xl ${config.color} text-white flex items-center justify-center shadow-lg transition-transform`}
        >
          <config.icon className="w-6 h-6" />
        </motion.div>
        <div className={`px-2 py-1 rounded-lg bg-gray-50 text-[10px] font-bold uppercase tracking-wider ${config.text}`}>
          Live
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <div className="text-3xl font-black text-gray-900 tracking-tight">
          <Counter value={value} />
        </div>
      </div>
    </motion.div>
  </Tilt>
);

const BookingRow = ({ booking, statusStyles, navigate, index }) => {
  const { guest, start, end, status, meetingRoom } = booking;
  const [joinAllowed, setJoinAllowed] = useState(false);
  const [access, setAccess] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      if (!meetingRoom) return;
      setChecking(true);
      try {
        const res = await axiosInstance.get(`/meetings/${meetingRoom}`);
        if (!mounted) return;
        setJoinAllowed(!!res.data?.valid);
        setAccess({
          accessStart: res.data?.bookingInfo?.accessStart,
          accessEnd: res.data?.bookingInfo?.accessEnd,
        });
      } catch (err) {
        console.error('Meeting check error:', err);
      } finally {
        mounted && setChecking(false);
      }
    };
    check();
    const id = setInterval(check, 15 * 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [meetingRoom]);

  const opensAt = access?.accessStart
    ? new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(access.accessStart))
    : null;

  const safeStatus = typeof status === "string" && status.length ? status : "pending";
  const isNear = new Date(start) - new Date() < 15 * 60 * 1000 && new Date(start) > new Date();
  const isLive = new Date() >= new Date(start) && new Date() <= new Date(end);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01, x: 5 }}
      className="p-5 rounded-2xl bg-white/60 border border-white/80 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg group-hover:rotate-6 transition-transform">
              {(guest?.name || "G").charAt(0).toUpperCase()}
            </div>
            {(isNear || isLive) && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-ping" />
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg group-hover:text-violet-600 transition-colors">{guest?.name || "Guest"}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-gray-500 font-medium">{guest?.email}</p>
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              <p className="text-sm text-gray-400">Guest</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</p>
              <p className="text-sm font-bold text-gray-700">
                {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(start))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time</p>
              <p className="text-sm font-bold text-gray-700">
                {new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(start))} – {new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(end))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 min-w-[140px] justify-end ml-auto md:ml-0">
            <span className={`px-4 py-1.5 rounded-xl text-xs font-bold border-2 ${statusStyles(safeStatus)} flex items-center gap-2`}>
              {(isNear || isLive) && safeStatus === 'confirmed' && <span className="w-2 h-2 rounded-full bg-current animate-pulse" />}
              {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
            </span>
            
            {meetingRoom ? (
              <motion.button
                whileHover={joinAllowed ? { scale: 1.05 } : {}}
                whileTap={joinAllowed ? { scale: 0.95 } : {}}
                onClick={() => joinAllowed && navigate(`/meeting/${meetingRoom}`)}
                disabled={!joinAllowed}
                className={`relative overflow-hidden group/btn px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
                  joinAllowed 
                  ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-violet-500/20 hover:shadow-violet-500/40" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                title={!joinAllowed && opensAt ? `Opens at ${opensAt}` : undefined}
              >
                <div className="flex items-center gap-2 relative z-10">
                  <Video className={`w-4 h-4 ${joinAllowed ? "animate-bounce" : ""}`} />
                  {checking ? "Verifying..." : "Join Call"}
                </div>
                {joinAllowed && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
                )}
              </motion.button>
            ) : (
              <div className="px-4 py-2.5 rounded-xl bg-gray-50 text-xs font-bold text-gray-400 border border-dashed border-gray-200">
                Pending Link
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4 sm:px-6">
    <div className="max-w-7xl mx-auto">
      <div className="mb-10">
        <div className="h-10 w-64 bg-gray-200 rounded-xl animate-pulse mb-3" />
        <div className="h-5 w-96 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-white rounded-3xl border border-gray-100 animate-pulse" />
        ))}
      </div>
      
      <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100">
        <div className="flex justify-between mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default HostDashboard;
// src/pages/user/Bookings.jsx
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import UserHeader from "../../components/UserHeader";
import MeshBackground from "../../components/MeshBackground";
import Tilt from "../../components/Tilt";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  ArrowRight
} from "lucide-react";
import { formatDate, formatTime } from "../../utils/timeUtils";
import { useNavigate } from "react-router-dom";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/user/bookings");
        setBookings(res.data.bookings || []);
      } catch (err) {
        console.error("❌ Error fetching bookings:", err);
        setError(err.response?.data?.message || "Failed to fetch bookings.");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pb-20"
    >
      <MeshBackground />
      <UserHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <motion.h1 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl font-black text-gray-900 tracking-tight"
            >
              My Bookings
            </motion.h1>
            <motion.p 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-500 mt-2 text-lg"
            >
              A history of your scheduled and past meetings.
            </motion.p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search bookings..." 
                className="pl-10 pr-4 py-2.5 bg-white/50 backdrop-blur-md border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <button className="p-2.5 bg-white/50 backdrop-blur-md border border-gray-200 rounded-xl hover:bg-white transition-colors">
              <Filter className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </header>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => <SkeletonCard key={n} />)}
          </div>
        ) : error ? (
          <ErrorMsg msg={error} />
        ) : bookings.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {bookings.map((b) => (
              <motion.div key={b._id} variants={itemVariants}>
                <Tilt>
                  <BookingCard
                    booking={b}
                    formatDate={formatDate}
                    formatTime={formatTime}
                    navigate={navigate}
                  />
                </Tilt>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

/* ---------- sub-components ---------- */

const SkeletonCard = () => (
  <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white/40 shadow-sm animate-pulse h-64 flex flex-col justify-between">
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
    <div className="h-10 bg-gray-200 rounded-full w-full" />
  </div>
);

const ErrorMsg = ({ msg }) => (
  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-rose-700 max-w-xl mx-auto flex items-center gap-4">
    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
      <AlertCircle className="w-6 h-6" />
    </div>
    <div>
      <h3 className="font-bold">Error Loading Bookings</h3>
      <p className="text-sm opacity-90">{msg}</p>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-24 bg-white/30 backdrop-blur-md rounded-[2.5rem] border border-dashed border-gray-300">
    <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-6 hover:rotate-0 transition-transform duration-500">
      <Calendar className="h-10 w-10 text-gray-400" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900">Your schedule is empty</h3>
    <p className="mt-2 text-gray-500 max-w-xs mx-auto mb-8">
      Start booking meetings with our professional hosts to see them here.
    </p>
    <button className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-full font-bold hover:bg-indigo-600 transition-all hover:scale-105 shadow-xl">
      Find a Host <ArrowRight className="w-4 h-4" />
    </button>
  </div>
);

const BookingCard = ({ booking, formatDate, formatTime, navigate }) => {
  const { hostId, start, end, status, meetingRoom } = booking;
  const hostName = hostId?.fullName || "Unknown Host";

  const getStatusConfig = (s) => {
    switch (s) {
      case "confirmed":
        return { 
          icon: CheckCircle2, 
          color: "text-emerald-600", 
          bg: "bg-emerald-50", 
          border: "border-emerald-100",
          glow: "shadow-[0_0_15px_rgba(16,185,129,0.25)]"
        };
      case "cancelled":
        return { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", glow: "" };
      default:
        return { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", glow: "" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-100 border-l-4 border-l-[#7C3AED] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full relative overflow-hidden group">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center text-indigo-700 font-bold border-2 ${status === 'confirmed' ? 'border-emerald-100' : 'border-gray-50'}`}>
          {hostName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-lg">{hostName}</p>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${config.bg} ${config.color} ${config.border} ${config.glow}`}>
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-4 mb-6 flex-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-indigo-500 transition-colors">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
            {formatDate(start)}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-indigo-500 transition-colors">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-gray-800">{formatTime(start)}</span>
            <span className="text-xs text-gray-400 font-bold tracking-tighter uppercase">{formatTime(start).split(' ')[1]}</span>
            <span className="mx-1 text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-500">{formatTime(end)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto">
        {status === 'confirmed' && meetingRoom ? (
          <button
            onClick={() => navigate(`/meeting/${meetingRoom}`)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white font-bold hover:shadow-lg hover:shadow-indigo-200 transition-all hover:scale-[1.02]"
          >
            <Video className="w-4 h-4" />
            Join Room
          </button>
        ) : (
          <div className="w-full py-3 rounded-xl bg-gray-50 text-gray-400 text-center text-xs font-bold border border-gray-100">
            {status === 'cancelled' ? "Meeting Cancelled" : "Awaiting Host Access"}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
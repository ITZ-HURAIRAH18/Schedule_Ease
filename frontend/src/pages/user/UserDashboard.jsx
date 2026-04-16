// src/pages/user/UserDashboard.jsx
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
  User as UserIcon,
  ChevronRight,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDate, formatTime } from "../../utils/timeUtils";

const UserDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance
      .get("/user/bookings")
      .then((res) => setBookings(res.data.bookings || []))
      .catch(() => { })
      .finally(() => setLoading(false));
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
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen pb-20"
    >
      <MeshBackground />
      <UserHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32">
        <header className="mb-10">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-gray-900 tracking-tight"
          >
            My Bookings
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 mt-2 text-lg"
          >
            Manage and join your upcoming scheduled meetings.
          </motion.p>
        </header>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
          </div>
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
                    onClick={() => setSelected(b)}
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

      <AnimatePresence>
        {selected && (
          <DetailModal 
            booking={selected} 
            onClose={() => setSelected(null)} 
            formatTime={formatTime}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ---------- sub-components ---------- */

const SkeletonCard = () => (
  <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/40 shadow-sm animate-pulse h-64 flex flex-col justify-between">
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

const EmptyState = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-20 bg-white/40 backdrop-blur-md rounded-3xl border border-dashed border-gray-300"
  >
    <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
      <Calendar className="h-10 w-10 text-indigo-500" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900">No bookings found</h3>
    <p className="mt-2 text-gray-500 max-w-xs mx-auto">
      When you schedule meetings with hosts, they will appear here in your dashboard.
    </p>
    <button className="mt-8 px-6 py-2.5 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
      Explore Hosts
    </button>
  </motion.div>
);

const BookingCard = ({ booking, onClick, formatDate, formatTime, navigate }) => {
  const { hostId, start, end, status, meetingRoom } = booking;
  const hostName = hostId?.fullName || "Unknown Host";
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
      } catch {}
      finally {
        mounted && setChecking(false);
      }
    };
    check();
    const id = setInterval(check, 10 * 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [meetingRoom]);

  const opensAt = access?.accessStart
    ? new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(access.accessStart))
    : null;

  const getStatusConfig = (s) => {
    switch (s) {
      case "confirmed":
        return { 
          icon: CheckCircle2, 
          color: "text-emerald-600", 
          bg: "bg-emerald-50", 
          border: "border-emerald-100",
          glow: "shadow-[0_0_12px_rgba(16,185,129,0.3)]"
        };
      case "rejected":
        return { 
          icon: XCircle, 
          color: "text-rose-600", 
          bg: "bg-rose-50", 
          border: "border-rose-100",
          glow: "" 
        };
      default:
        return { 
          icon: AlertCircle, 
          color: "text-amber-600", 
          bg: "bg-amber-50", 
          border: "border-amber-100",
          glow: ""
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div
      onClick={onClick}
      className="group bg-white/80 backdrop-blur-xl rounded-2xl border-l-4 border-[#7C3AED] shadow-sm hover:shadow-xl transition-all duration-300 p-6 flex flex-col h-full cursor-pointer overflow-hidden relative"
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.color} ${config.border} ${config.glow}`}>
          <config.icon className="w-3.5 h-3.5" />
          {status.toUpperCase()}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className={`w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-xl border-2 ${status === 'confirmed' ? 'border-emerald-400' : 'border-indigo-100'}`}>
            {hostName.charAt(0).toUpperCase()}
          </div>
          {status === 'confirmed' && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">{hostName}</h3>
          <p className="text-sm text-gray-500">Expert Host</p>
        </div>
      </div>

      <div className="space-y-4 mb-8 flex-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
            {formatDate(start)}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-2xl font-bold text-gray-800 tracking-tight">
            {formatTime(start)}
          </span>
          <span className="text-gray-400 font-medium">→</span>
          <span className="text-gray-500 font-medium">{formatTime(end)}</span>
        </div>
      </div>

      <div className="mt-auto">
        {meetingRoom ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!joinAllowed) return;
              navigate(`/meeting/${booking.meetingRoom}`);
            }}
            disabled={!joinAllowed}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-bold transition-all shadow-lg ${
              joinAllowed 
                ? "bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white hover:shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98]" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
            }`}
          >
            <Video className="w-4 h-4" />
            {checking ? "Checking..." : joinAllowed ? "Join Meeting Now" : opensAt ? `Opens at ${opensAt}` : "Join"}
          </button>
        ) : (
          <div className="w-full py-3 rounded-full bg-gray-50 text-gray-400 text-center text-sm font-medium border border-gray-100">
            Link pending host approval
          </div>
        )}
      </div>
    </div>
  );
};

const DetailModal = ({ booking, onClose, formatTime }) => {
  const { hostId, guest, start, end, duration, status, topic } = booking;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
      >
        <div className="h-24 bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] p-6 flex justify-between items-start">
          <h2 className="text-white text-2xl font-bold">Booking Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <InfoBlock label="Host" value={hostId?.fullName} icon={UserIcon} />
            <InfoBlock label="Guest" value={guest?.name} icon={UserIcon} />
            <InfoBlock label="Date" value={new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(start))} icon={Calendar} />
            <InfoBlock label="Duration" value={`${duration} mins`} icon={Clock} />
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2 mb-2 text-gray-500">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Topic</span>
            </div>
            <p className="text-gray-900 font-medium">{topic || "No topic specified for this meeting."}</p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest">Scheduled Time</p>
                <p className="text-indigo-900 font-bold">{formatTime(start)} – {formatTime(end)}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="p-6 border-t border-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const InfoBlock = ({ label, value, icon: Icon }) => (
  <div className="space-y-1">
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
      <Icon className="w-3 h-3" />
      {label}
    </p>
    <p className="text-gray-900 font-bold">{value}</p>
  </div>
);

export default UserDashboard;
// src/pages/user/Availability.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  Globe, 
  XCircle, 
  User, 
  Timer, 
  CalendarDays,
  ChevronRight,
  AlertCircle,
  Zap,
  Users
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import UserHeader from "../../components/UserHeader";
import Tilt from "../../components/Tilt";
import MeshBackground from "../../components/MeshBackground";

const AnimatedCounter = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    let totalDuration = 1000;
    let increment = end / (totalDuration / 16);
    
    let timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}</span>;
};

const Availability = () => {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance
      .get("/user/hosts/availability")
      .then((res) => setHosts(res.data.availability))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleBook = (host) =>
    navigate(`/user/book/${host.hostId._id}`, {
      state: { host, availabilityId: host._id },
    });

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    if (timeStr.toLowerCase().includes("am") || timeStr.toLowerCase().includes("pm"))
      return timeStr;
    let [hours, minutes] = timeStr.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <UserHeader />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-100 rounded-full" />
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-600 animate-pulse" />
          </div>
          <p className="mt-4 text-indigo-900/60 font-medium animate-pulse tracking-wide uppercase text-xs">Finding available hosts...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden">
      <MeshBackground />
      <UserHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-24 relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-6"
        >
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
              Book a <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">Session</span>
            </h1>
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl shadow-sm">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full border-2 border-white bg-indigo-500 flex items-center justify-center">
                  <Users className="w-3 h-3 text-white" />
                </div>
                <div className="w-6 h-6 rounded-full border-2 border-white bg-violet-500" />
                <div className="w-6 h-6 rounded-full border-2 border-white bg-fuchsia-500" />
              </div>
              <p className="text-gray-600 text-sm font-medium">
                Choose from <span className="text-indigo-600 font-bold"><AnimatedCounter value={hosts.length} /></span> active hosts
              </p>
            </div>
          </div>
          
          <div className="hidden sm:block">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500 bg-white/50 px-3 py-1.5 rounded-full border border-white/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live availability
            </div>
          </div>
        </motion.div>

        {hosts.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {hosts.map((h) => (
              <HostCard
                key={h._id}
                host={h}
                onBook={handleBook}
                formatTime={formatTime}
              />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
};

/* ---------- Sub-components ---------- */

const EmptyState = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-24 bg-white/40 backdrop-blur-md border border-dashed border-gray-300 rounded-3xl"
  >
    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <CalendarDays className="h-10 w-10 text-gray-400" />
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-2">No hosts available</h3>
    <p className="text-gray-500 max-w-xs mx-auto">
      Our experts are currently busy. Please check back in a few minutes or contact support.
    </p>
  </motion.div>
);

const HostCard = ({ host, onBook, formatTime }) => {
  const { hostId, timezone, weekly, durations, bufferBefore, bufferAfter, maxPerDay, blockedDates } = host;
  const name = hostId?.fullName ?? "Expert Host";
  const email = hostId?.email ?? "";
  const avatar = name.charAt(0).toUpperCase();

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div variants={itemVariants}>
      <Tilt className="h-full">
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2rem] p-6 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col h-full group">
          
          {/* Header */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-tr from-violet-600 to-fuchsia-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 p-[3px]">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-indigo-600 font-black text-2xl border-2 border-white shadow-inner">
                  {avatar}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold text-xl text-gray-900 truncate tracking-tight">{name}</h3>
              <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                <User className="w-3 h-3" /> {email}
              </p>
            </div>
          </div>

          {/* Info Pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Pill icon={<Globe className="w-3 h-3" />} text={timezone || "UTC"} color="indigo" />
            <Pill icon={<Clock className="w-3 h-3" />} text={`${durations[0]}m session`} color="violet" />
            <Pill icon={<Timer className="w-3 h-3" />} text={`Buf: ${bufferBefore}m`} color="fuchsia" />
          </div>

          {/* Weekly Schedule Mini Timeline */}
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-2">Weekly Availability</p>
            <MiniTimeline weekly={weekly} />
          </div>

          {/* Blocked Dates */}
          {blockedDates.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] uppercase tracking-wider font-bold text-red-500 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Unavailable dates
              </p>
              <div className="flex flex-wrap gap-1.5">
                {blockedDates.slice(0, 3).map((date, i) => (
                  <span key={i} className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-[10px] font-bold border border-red-100">
                    {date}
                  </span>
                ))}
                {blockedDates.length > 3 && (
                  <span className="text-[10px] text-gray-400 font-bold ml-1">+{blockedDates.length - 3} more</span>
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => onBook(host)}
            className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all duration-300 flex items-center justify-center gap-2 group/btn"
          >
            <span>Book Meeting</span>
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </Tilt>
    </motion.div>
  );
};

const Pill = ({ icon, text, color }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    fuchsia: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
  };
  
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colors[color] || colors.indigo}`}>
      {icon}
      <span>{text}</span>
    </div>
  );
};

const MiniTimeline = ({ weekly }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayMap = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
    friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
  };

  const activeDays = weekly.reduce((acc, curr) => {
    acc[dayMap[curr.day.toLowerCase()]] = curr;
    return acc;
  }, {});

  return (
    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
      <div className="flex justify-between items-end h-8 gap-1.5">
        {days.map(day => {
          const isActive = activeDays[day];
          return (
            <div key={day} className="flex-1 group relative">
              <div 
                className={`w-full rounded-full transition-all duration-700 ease-out ${
                  isActive 
                    ? 'bg-gradient-to-t from-violet-600 to-indigo-400 h-8 shadow-[0_0_10px_rgba(139,92,246,0.3)]' 
                    : 'bg-gray-200 h-2'
                }`}
              />
              <div className={`mt-2 text-[9px] font-black text-center uppercase tracking-tighter ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                {day[0]}
              </div>
              
              {isActive && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2 py-1.5 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-10 shadow-xl translate-y-2 group-hover:translate-y-0 font-bold">
                  {day}: {isActive.start} - {isActive.end}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Availability;

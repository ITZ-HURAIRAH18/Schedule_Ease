// src/pages/host/HostDashboard.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import axiosInstance from "../../api/axiosInstance";
import HostHeader from "../../components/HostHeader";
import io from "socket.io-client";
import { getSocketUrl } from "../../utils/apiConfig";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Video,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const [error, setError] = useState(null);
  const streamRef = useRef(null);
  const userVideo = useRef(null);
  const pageSize = 5;

  const teardownConnections = useCallback(() => {
    const activeStream = streamRef.current;
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (userVideo.current) {
      userVideo.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get("/host/dashboard");
        setData(res.data);
        if (res.data?.hostId) {
          socket.emit("join_host_room", res.data.hostId);
        }
        setError(null);
        setTimeout(() => setIsLoading(false), 600);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
        setError(err.response?.data?.message || err.message || "Failed to load dashboard. The server might be busy.");
        setIsLoading(false);
      }
    };

    fetchData();

    socket.on("host_dashboard_updated", (updated) => setData(updated));
    return () => socket.off("host_dashboard_updated");
  }, []);

  const total = data?.recentBookings?.length || 0;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const paginated = data?.recentBookings?.slice(start, start + pageSize) || [];

  const statConfigs = {
    totalBookings: { icon: CalendarDays, color: "#C8622A", bg: "#FDF0EA", label: "Total Bookings" },
    upcomingBookings: { icon: CheckCircle2, color: "#2D7D52", bg: "#EDF7F1", label: "Upcoming" },
    pendingBookings: { icon: AlertCircle, color: "#B45309", bg: "#FEF3E2", label: "Pending" },
    cancelledBookings: { icon: XCircle, color: "#B91C1C", bg: "#FEF2F2", label: "Cancelled" },
    pastBookings: { icon: Clock, color: "#92694A", bg: "#F7F0EA", label: "Past Sessions" },
  };

  if (error) return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <HostHeader />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-[#FEF2F2] rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-[#B91C1C]" />
        </div>
        <h2 className="text-[20px] font-semibold text-[#1A1A1A] mb-2">Service Temporarily Unavailable</h2>
        <p className="text-[#8A8A8A] max-w-md mb-6">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-[#C8622A] text-white rounded-lg font-semibold text-[14px] hover:bg-[#A84E20] transition-all"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );

  if (!data) return null;

  const { stats = {} } = data;

  return (
    <div className="min-h-screen bg-[#FAFAF8] page-enter">
      <HostHeader />
      
      <main className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-10">
          <h1 className="text-[28px] font-semibold text-[#1A1A1A]">Host Dashboard</h1>
          <p className="text-[#4A4A4A] mt-1 text-[14px]">Welcome back! Here's what's happening today.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          {Object.entries(stats).map(([key, value]) => {
            const config = statConfigs[key] || statConfigs.totalBookings;
            return (
              <div key={key} className="bg-white border border-[#E8E4DF] rounded-[12px] p-5 shadow-sm hover-card">
                <div 
                  className="w-9 h-9 rounded-[8px] flex items-center justify-center mb-4"
                  style={{ backgroundColor: config.bg, color: config.color }}
                >
                  <config.icon className="w-5 h-5" />
                </div>
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#8A8A8A] mb-1">
                  {config.label}
                </p>
                <div className="text-[28px] font-semibold text-[#1A1A1A]">
                  <Counter value={value} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Bookings Section */}
        <section className="bg-white border border-[#E8E4DF] rounded-[16px] overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-[#E8E4DF] flex items-center justify-between">
            <h2 className="text-[18px] font-semibold text-[#1A1A1A]">Recent Bookings</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
              <input 
                type="text" 
                placeholder="Search guests..." 
                className="h-9 pl-9 pr-4 bg-[#F5F3F0] border border-transparent rounded-lg text-[13px] focus:bg-white focus:border-[#C8622A] focus:outline-none transition-all w-48 md:w-64" 
              />
            </div>
          </div>

          <div className="divide-y divide-[#E8E4DF]">
            {paginated.map((b) => (
              <BookingRow key={b._id} booking={b} navigate={navigate} />
            ))}
            
            {paginated.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-[#F5F3F0] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-8 h-8 text-[#8A8A8A]" />
                </div>
                <p className="text-[#8A8A8A] font-medium">No bookings found</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-[#FAFAF8] border-t border-[#E8E4DF] flex items-center justify-between">
              <p className="text-[13px] text-[#8A8A8A]">
                Showing <span className="text-[#1A1A1A] font-medium">{start + 1}</span> to <span className="text-[#1A1A1A] font-medium">{Math.min(start + pageSize, total)}</span> of <span className="text-[#1A1A1A] font-medium">{total}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E8E4DF] bg-white text-[#4A4A4A] hover:border-[#C8622A] hover:text-[#C8622A] disabled:opacity-40 disabled:hover:border-[#E8E4DF] disabled:hover:text-[#4A4A4A] transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[13px] font-medium text-[#1A1A1A] mx-2">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E8E4DF] bg-white text-[#4A4A4A] hover:border-[#C8622A] hover:text-[#C8622A] disabled:opacity-40 disabled:hover:border-[#E8E4DF] disabled:hover:text-[#4A4A4A] transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

/* ---------- Sub-components ---------- */

const Counter = ({ value }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const animation = animate(count, value, { duration: 0.6, ease: "easeOut" });
    return animation.stop;
  }, [value]);

  return <motion.span>{rounded}</motion.span>;
};

const BookingRow = ({ booking, navigate }) => {
  const { guest, start, end, status, meetingRoom } = booking;
  const [joinAllowed, setJoinAllowed] = useState(false);
  
  useEffect(() => {
    if (!meetingRoom) return;
    const check = async () => {
      try {
        const res = await axiosInstance.get(`/meetings/${meetingRoom}`);
        setJoinAllowed(!!res.data?.valid);
      } catch (err) {
        console.error('Meeting check error:', err);
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [meetingRoom]);

  const initials = (guest?.name || "G").charAt(0).toUpperCase();
  const safeStatus = status || "pending";

  const statusMap = {
    confirmed: { bg: "#EDF7F1", text: "#2D7D52" },
    cancelled: { bg: "#FEF2F2", text: "#B91C1C" },
    rejected: { bg: "#FEF2F2", text: "#B91C1C" },
    pending: { bg: "#FEF3E2", text: "#B45309" }
  };
  const style = statusMap[safeStatus] || statusMap.pending;

  return (
    <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAFAF8] transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#F5F3F0] text-[#92694A] flex items-center justify-center font-semibold">
          {initials}
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[#1A1A1A]">{guest?.name || "Guest"}</p>
          <p className="text-[12px] text-[#8A8A8A]">{guest?.email}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 md:gap-12">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium uppercase tracking-[0.05em] text-[#8A8A8A]">Date</span>
          <span className="text-[13px] text-[#1A1A1A]">
            {new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-medium uppercase tracking-[0.05em] text-[#8A8A8A]">Time</span>
          <span className="text-[13px] text-[#1A1A1A]">
            {new Date(start).toLocaleTimeString(undefined, { timeStyle: 'short' })} — {new Date(end).toLocaleTimeString(undefined, { timeStyle: 'short' })}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider" style={{ backgroundColor: style.bg, color: style.text }}>
            {safeStatus}
          </span>
          
          {meetingRoom && (
            <button
              onClick={() => joinAllowed && navigate(`/meeting/${meetingRoom}`)}
              disabled={!joinAllowed}
              className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all flex items-center gap-1.5 ${
                joinAllowed 
                ? "border-[#C8622A] text-[#C8622A] hover:bg-[#C8622A] hover:text-white" 
                : "border-[#E8E4DF] text-[#8A8A8A] cursor-not-allowed"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Join
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;

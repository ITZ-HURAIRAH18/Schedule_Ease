// src/pages/host/HostDashboard.jsx  (pagination only)
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import HostHeader from "../../components/HostHeader";
import { io } from "socket.io-client";
import {
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

// Use empty string so socket.io connects to the current origin (e.g. localhost:5173)
// and the Vite dev server proxy forwards /socket.io to the backend.
const socket = io("", {
  secure: window.location.protocol === 'https:',
  rejectUnauthorized: false,
});

const HostDashboard = () => {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 4;

  /* ---------- initial data + socket ---------- */
  useEffect(() => {
    axiosInstance.get("/host/dashboard").then((res) => {
      setData(res.data);
      socket.emit("join_host_room", res.data.hostId);
    });
    socket.on("host_dashboard_updated", (updated) => setData(updated));
    return () => socket.off("host_dashboard_updated");
  }, []);

  /* ---------- pagination ---------- */
  const total       = data?.recentBookings?.length || 0;
  const totalPages  = Math.ceil(total / pageSize);
  const start       = (page - 1) * pageSize;
  const paginated   = data?.recentBookings?.slice(start, start + pageSize) || [];

  if (!data)
    return (
      <>
        <HostHeader />
        <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center">
          <div className="text-white/80">Loading…</div>
        </div>
      </>
    );

  const { stats } = data;

  const statIcons = {
    totalBookings: <CalendarDaysIcon className="w-6 h-6" />,
    upcomingBookings: <CheckCircleIcon className="w-6 h-6" />,
    pendingBookings: <ExclamationCircleIcon className="w-6 h-6" />,
    cancelledBookings: <XCircleIcon className="w-6 h-6" />,
    pastBookings: <ClockIcon className="w-6 h-6" />,
  };

  const statusStyles = (s) => {
    switch (s) {
      case "confirmed":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  return (
    <>
      <HostHeader />
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Host Dashboard</h1>
            <p className="text-gray-600 mt-1">Real-time overview of your meetings</p>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-10">
            {Object.entries(stats).map(([key, value]) => (
              <StatCard key={key} label={key.replace(/([A-Z])/g, " $1").trim()} value={value} icon={statIcons[key]} />
            ))}
          </div>

          {/* Recent Bookings – paginated */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Bookings</h2>
            <div className="bg-white rounded-2xl shadow border border-gray-100 divide-y divide-gray-100">
              {paginated.map((b) => (
                <BookingRow key={b._id} booking={b} statusStyles={statusStyles} navigate={navigate} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

/* ---------- sub-components ---------- */
const StatCard = ({ label, value, icon }) => (
  <div className="bg-white rounded-xl shadow border border-gray-100 p-5 flex items-center gap-4">
    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const BookingRow = ({ booking, statusStyles, navigate }) => {
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
        
        // Debug logging
        console.log('Host Dashboard - Meeting Check:', {
          meetingRoom,
          valid: res.data?.valid,
          accessStart: res.data?.bookingInfo?.accessStart,
          accessEnd: res.data?.bookingInfo?.accessEnd,
          now: new Date().toISOString(),
        });
        
        setJoinAllowed(!!res.data?.valid);
        setAccess({
          accessStart: res.data?.bookingInfo?.accessStart,
          accessEnd: res.data?.bookingInfo?.accessEnd,
        });
      } catch (err) {
        console.error('Host Dashboard - Meeting check error:', err);
      }
      finally {
        mounted && setChecking(false);
      }
    };
    check();
    const id = setInterval(check, 10 * 1000); // Check every 10 seconds
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [meetingRoom]);

  const opensAt = access?.accessStart
    ? new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(access.accessStart))
    : null;

  const safeStatus = typeof status === "string" && status.length ? status : "pending";

  return (
    <div className="p-4 hover:bg-gray-50 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm">
            {(guest?.name || "G").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{guest?.name || "Guest"}</p>
            <p className="text-xs text-gray-500">{guest?.email}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(start))}</p>
          <p className="text-xs text-gray-500">{new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(start))} – {new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(end))}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyles(safeStatus)}`}>
          {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
        </span>
        {meetingRoom ? (
          <button
            onClick={() => joinAllowed && navigate(`/meeting/${meetingRoom}`)}
            disabled={!joinAllowed}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition ${joinAllowed ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
            title={!joinAllowed && opensAt ? `Opens at ${opensAt}` : undefined}
          >
            <VideoCameraIcon className="w-4 h-4" />
            {checking ? "Checking…" : "Join"}
          </button>
        ) : (
          <span className="text-xs text-gray-400">No link yet</span>
        )}
      </div>
    </div>
  );
};

export default HostDashboard;
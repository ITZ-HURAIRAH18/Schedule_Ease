// src/pages/user/UserDashboard.jsx
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import UserHeader from "../../components/UserHeader";
import {
  CalendarDaysIcon,
  ClockIcon,
  VideoCameraIcon,
  XCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

/* ---------- global helpers ---------- */
const formatDate = (d) =>
  new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d));

const formatTime = (d) =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(d));
/* ---------- render ---------- */
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

  /* ---------- helpers ---------- */
  const statusStyles = (s) => {
    switch (s) {
      case "confirmed":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };
  const statusIcon = (s) =>
    s === "confirmed" ? (
      <CheckCircleIcon className="w-4 h-4" />
    ) : s === "rejected" ? (
      <XCircleIcon className="w-4 h-4" />
    ) : (
      <ExclamationCircleIcon className="w-4 h-4" />
    );

  return (
    <>
      <div className={`min-h-screen bg-gray-50 ${selected ? "blur-sm" : ""}`}>
        <UserHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">My Bookings</h1>
            <p className="text-gray-600 mt-1">Review, join, or track your scheduled meetings.</p>
          </header>

          {loading && <Spinner />}
          {!loading && bookings.length === 0 && <EmptyState />}
          {!loading && bookings.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bookings.map((b) => (
                <BookingCard
                  key={b._id}
                  booking={b}
                  onClick={() => setSelected(b)}
                  statusStyles={statusStyles}
                  statusIcon={statusIcon}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  navigate={navigate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selected && <DetailModal booking={selected} onClose={() => setSelected(null)} />}
    </>
  );
};

/* ---------- sub-components ---------- */
const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const EmptyState = () => (
  <div className="text-center py-20">
    <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-lg font-medium text-gray-900">No bookings yet</h3>
    <p className="mt-1 text-gray-500">When you schedule a meeting it will appear here.</p>
  </div>
);

const BookingCard = ({ booking, onClick, statusStyles, statusIcon, formatDate, formatTime, navigate }) => {
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
    const id = setInterval(check, 10 * 1000); // Check every 10 seconds
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [meetingRoom]);

  const opensAt = access?.accessStart
    ? new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(access.accessStart))
    : null;

  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-blue-900 to-blue-600 text-white rounded-2xl shadow-lg p-5 flex flex-col cursor-pointer hover:shadow-2xl transition-all duration-300"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
          {hostName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg">{hostName}</p>
          <p className="text-xs opacity-80">Host</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${statusStyles(status)}`}>
          {statusIcon(status)}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="space-y-2 text-sm opacity-90 flex-1">
        <Row icon={<CalendarDaysIcon className="w-4 h-4" />} label="Date" value={formatDate(start)} />
        <Row icon={<ClockIcon className="w-4 h-4" />} label="Time" value={`${formatTime(start)} – ${formatTime(end)}`} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        {meetingRoom ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!joinAllowed) return;
              navigate(`/meeting/${booking.meetingRoom}`);
            }}
            disabled={!joinAllowed}
            className={`inline-flex items-center gap-2 underline ${joinAllowed ? "text-blue-200 hover:text-white" : "text-white/40 cursor-not-allowed"}`}
            title={!joinAllowed && opensAt ? `Opens at ${opensAt}` : undefined}
          >
            <VideoCameraIcon className="w-4 h-4" />
            {checking ? "Checking…" : "Join"}
          </button>

        ) : (
          <span className="text-xs opacity-75">No link yet</span>
        )}

        <span className="text-xs opacity-75">Click for details</span>
      </div>
    </div>
  );
};


const Row = ({ icon, label, value }) => (
  <div className="flex items-center gap-2">
    <span className="opacity-70">{icon}</span>
    <span className="opacity-90">{label}:</span>
    <span className="font-medium">{value}</span>
  </div>
);

const DetailModal = ({ booking, onClose }) => {
  const { hostId, guest, start, end, duration, status, meetingLink, topic } = booking;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        >
          <XCircleIcon className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Details</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <Row icon={<UserCircleIcon className="w-4 h-4" />} label="Host" value={hostId?.fullName} />
          <Row icon={<UserCircleIcon className="w-4 h-4" />} label="Guest" value={guest?.name} />
          <Row icon={<CalendarDaysIcon className="w-4 h-4" />} label="Date" value={new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(start))} />
          <Row icon={<ClockIcon className="w-4 h-4" />} label="Time" value={`${formatTime(start)} – ${formatTime(end)}`} />
          <Row icon={<ClockIcon className="w-4 h-4" />} label="Duration" value={`${duration} mins`} />
          {topic && <Row icon={<ChatBubbleLeftRightIcon className="w-4 h-4" />} label="Topic" value={topic} />}
          {meetingLink && (
            <div className="pt-3 border-t">
              <a
                href={meetingLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow hover:shadow-md transition"
              >
                <VideoCameraIcon className="w-5 h-5" />
                Join Meeting
              </a>
            </div>
          )}
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
// src/pages/user/Bookings.jsx
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
} from "@heroicons/react/24/outline";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  /* ------------ helpers ------------ */
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

  const formatDate = (d) =>
    new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(d));

  const formatTime = (d) =>
    new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(d));

  /* ------------ render ------------ */
  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">Review, join, or track your scheduled meetings.</p>
        </header>

        {loading && <Spinner />}
        {error && <ErrorMsg msg={error} />}
        {!loading && !error && bookings.length === 0 && <EmptyState />}
        {!loading && !error && bookings.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((b) => (
              <BookingCard
                key={b._id}
                booking={b}
                statusStyles={statusStyles}
                statusIcon={statusIcon}
                formatDate={formatDate}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------- sub-components ---------- */
const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ErrorMsg = ({ msg }) => (
  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 max-w-xl mx-auto">
    {msg}
  </div>
);

const EmptyState = () => (
  <div className="text-center py-20">
    <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-lg font-medium text-gray-900">No bookings yet</h3>
    <p className="mt-1 text-gray-500">When you schedule a meeting it will appear here.</p>
  </div>
);

const BookingCard = ({ booking, statusStyles, statusIcon, formatDate, formatTime }) => {
  const { hostId, start, end, status, meetingLink, topic } = booking;
  const hostName = hostId?.fullName || "Unknown Host";

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 flex flex-col">
      {/* header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br bg-blue-900 to-blue-600 flex items-center justify-center text-white font-bold">
          {hostName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900">{hostName}</p>
          <p className="text-xs text-gray-500">Host</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${statusStyles(status)}`}>
          {statusIcon(status)}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* body */}
      <div className="space-y-2 text-sm text-gray-700 flex-1">
        <Row icon={<CalendarDaysIcon className="w-4 h-4" />} label="Date" value={formatDate(start)} />
        <Row icon={<ClockIcon className="w-4 h-4" />} label="Time" value={`${formatTime(start)} – ${formatTime(end)}`} />
        {topic && <Row icon={<ChatBubbleLeftRightIcon className="w-4 h-4" />} label="Topic" value={topic} />}
      </div>

      {/* footer */}
      <div className="mt-5 flex items-center gap-2">
        {meetingLink ? (
          <a
            href={meetingLink}
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r bg-blue-900 to-indigo-600 text-white font-semibold shadow hover:shadow-md transition"
          >
            <VideoCameraIcon className="w-5 h-5" />
            Join meeting
          </a>
        ) : (
          <span className="text-sm text-gray-500">Meeting link will appear here</span>
        )}
      </div>
    </div>
  );
};

const Row = ({ icon, label, value }) => (
  <div className="flex items-center gap-2">
    <span className="text-gray-400">{icon}</span>
    <span className="text-gray-600">{label}:</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

export default Bookings;
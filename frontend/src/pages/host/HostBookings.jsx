// src/pages/host/HostBookings.jsx
import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import HostHeader from "../../components/HostHeader";
import {
  CalendarDaysIcon,
  ClockIcon,
  UserCircleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
const formatDate = (d) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(d));
const formatTime = (d) =>
  new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(d));

const HostBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    axiosInstance
      .get("/host/bookings")
      .then((res) => {
        if (res.data.success) setBookings(res.data.bookings);
      })
      .catch(() => { });
  }, []);

  /* ---------- helpers ---------- */
  const statusStyles = (s) => {
    switch (s) {
      case "confirmed":
        return "bg-green-100 text-green-700 border-green-200";
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };
  const statusIcon = (s) =>
    s === "confirmed" ? (
      <CheckCircleIcon className="w-4 h-4" />
    ) : s === "cancelled" || s === "rejected" ? (
      <XCircleIcon className="w-4 h-4" />
    ) : (
      <ExclamationCircleIcon className="w-4 h-4" />
    );


  /* ---------- render ---------- */
  return (
    <>
      <HostHeader />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">All Bookings</h1>
            <p className="text-gray-600 mt-1">Update status or review meeting details</p>
          </header>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="bg-gradient-to-r from-blue-900 to-blue-600 text-white text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Guest</th>
                  <th className="px-6 py-3">Booked By</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Timezone</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm">
                          {(b.guest?.name || "G").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{b.guest?.name || "N/A"}</p>
                          <p className="text-xs text-gray-500">{b.guest?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {b.createdByUserId ? (
                        <>
                          <p className="font-medium text-gray-900">{b.createdByUserId.fullName}</p>
                          <p className="text-xs text-gray-500">{b.createdByUserId.email}</p>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(b.start)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatTime(b.start)} – {formatTime(b.end)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={b.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          try {
                            await axiosInstance.put(`/host/bookings/update-status/${b._id}`, { status: newStatus });
                            setBookings((prev) => prev.map((bk) => (bk._id === b._id ? { ...bk, status: newStatus } : bk)));
                          } catch { }
                        }}
                        className="px-2 py-1 rounded-full text-xs font-semibold border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rescheduled">Rescheduled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {b.availabilityId?.timezone || "UTC"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setSelected(b)}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow hover:shadow-md transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden grid gap-4">
            {bookings.map((b) => (
              <BookingCardMobile
                key={b._id}
                booking={b}
                onClick={() => setSelected(b)}
                statusStyles={statusStyles}
                statusIcon={statusIcon}
                formatDate={formatDate}
                formatTime={formatTime}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selected && <DetailModal booking={selected} onClose={() => setSelected(null)} />}
    </>
  );
};

/* ---------- sub-components ---------- */
const BookingCardMobile = ({ booking, onClick, statusStyles, statusIcon, formatDate, formatTime }) => {
  const { guest, start, end, status } = booking;
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow border border-gray-100 p-4 cursor-pointer hover:shadow-lg transition"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm">
            {(guest?.name || "G").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{guest?.name || "N/A"}</p>
            <p className="text-xs text-gray-500">{guest?.email}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${statusStyles(status)}`}>
          {statusIcon(status)}
          {status}
        </span>
      </div>
      <div className="text-sm text-gray-600">
        <p>{formatDate(start)}</p>
        <p>
          {formatTime(start)} – {formatTime(end)}
        </p>
      </div>
      <div className="mt-3 text-right text-xs text-blue-600 font-semibold">Tap for details →</div>
    </div>
  );
};

const DetailModal = ({ booking, onClose }) => {
  const { guest, createdByUserId, start, end, status, availabilityId } = booking;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
          <XCircleIcon className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Details</h2>

        <div className="space-y-3 text-sm text-gray-700">
          <Row icon={<UserCircleIcon className="w-4 h-4" />} label="Guest" value={`${guest?.name} (${guest?.email})`} />
          <Row icon={<UserCircleIcon className="w-4 h-4" />} label="Booked by" value={createdByUserId ? `${createdByUserId.fullName} (${createdByUserId.email})` : "N/A"} />
          <Row icon={<CalendarDaysIcon className="w-4 h-4" />} label="Date" value={new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(start))} />
          <Row icon={<ClockIcon className="w-4 h-4" />} label="Time" value={`${formatTime(start)} – ${formatTime(end)}`} />
          <Row icon={<ExclamationCircleIcon className="w-4 h-4" />} label="Status" value={status.charAt(0).toUpperCase() + status.slice(1)} />

          {availabilityId && (
            <>
              <hr className="my-2" />
              <Row icon={<ClockIcon className="w-4 h-4" />} label="Timezone" value={availabilityId.timezone} />
              <Row icon={<ClockIcon className="w-4 h-4" />} label="Buffer" value={`${availabilityId.bufferBefore || 0} / ${availabilityId.bufferAfter || 0} min`} />
              <Row icon={<CalendarDaysIcon className="w-4 h-4" />} label="Max / day" value={availabilityId.maxPerDay} />
            </>
          )}
        </div>

        <div className="mt-6 text-right">
          <button onClick={onClose} className="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition">Close</button>
        </div>
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

export default HostBookings;
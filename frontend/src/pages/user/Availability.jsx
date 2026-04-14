// src/pages/user/Availability.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import UserHeader from "../../components/UserHeader";
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  XCircleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

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

  // const handleBook = (host) => navigate(`/user/book/${host.hostId._id}`);
const handleBook = (host) =>
  navigate(`/user/book/${host.hostId._id}`, {
    state: { host, availabilityId: host._id }, // ✅ pass availability ID here
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

 if (loading)
  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      <div className="flex items-center justify-center py-32">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Available Hosts</h1>
          <p className="text-gray-600 mt-1">Pick a host and schedule your meeting in seconds.</p>
        </header>

        {hosts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {hosts.map((h) => (
              <HostCard
                key={h._id}
                host={h}
                onBook={handleBook}
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
const EmptyState = () => (
  <div className="text-center py-20">
    <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-lg font-medium text-gray-900">No hosts available</h3>
    <p className="mt-1 text-gray-500">Check back later or contact support.</p>
  </div>
);

const HostCard = ({ host, onBook, formatTime }) => {
  
  const { hostId, timezone, weekly, durations, bufferBefore, bufferAfter, maxPerDay, blockedDates } = host;
  const name = hostId?.fullName
 ?? "Unknown";
  const email = hostId?.email ?? "";
  const avatar = name.charAt(0).toUpperCase();

  return (
    <div className="bg-white rounded-2xl shadow border border-gray-100 p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br bg-blue-900 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
          {avatar}
        </div>
        <div>
          <h3 className="font-bold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500">{email}</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 text-sm text-gray-700 flex-1">
        <Detail icon={<MapPinIcon className="w-4 h-4" />} label="Timezone" value={timezone || "UTC"} />
        <Detail icon={<ClockIcon className="w-4 h-4" />} label="Durations" value={`${durations.join(", ")} min`} />
        <Detail icon={<ClockIcon className="w-4 h-4" />} label="Buffer" value={`${bufferBefore}/${bufferAfter} min`} />
        <Detail icon={<CalendarDaysIcon className="w-4 h-4" />} label="Max / day" value={maxPerDay} />

        {/* Weekly slots */}
        <div>
          <p className="font-medium text-gray-900 mb-2">Weekly schedule</p>
          {weekly.length === 0 ? (
            <p className="text-gray-500">No weekly slots set</p>
          ) : (
            <ul className="space-y-1">
              {weekly.map((d, i) => (
                <li key={i} className="flex justify-between text-gray-600">
                  <span className="capitalize">{d.day}</span>
                  <span className="font-medium">
                    {formatTime(d.start)} - {formatTime(d.end)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Blocked dates */}
        {blockedDates.length > 0 && (
          <div>
            <p className="font-medium text-gray-900 mb-2 flex items-center gap-1">
              <XCircleIcon className="w-4 h-4 text-red-500" /> Blocked dates
            </p>
            <div className="flex flex-wrap gap-2">
              {blockedDates.map((date, i) => (
                <span key={i} className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs">
                  {date}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => onBook(host)}
        className="mt-5 w-full py-2.5 rounded-lg bg-gradient-to-r bg-blue-900 to-indigo-600 text-white font-semibold shadow hover:shadow-md transition"
      >
        Book meeting
      </button>
    </div>
  );
};

const Detail = ({ icon, label, value }) => (
  <div className="flex items-center gap-2">
    <span className="text-gray-400">{icon}</span>
    <span className="text-gray-600">{label}:</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
);

export default Availability;
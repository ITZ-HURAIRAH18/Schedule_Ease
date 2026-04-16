// src/pages/user/Availability.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Globe, 
  Clock, 
  Timer,
  ChevronRight,
  Search
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import UserHeader from "../../components/UserHeader";

const Availability = () => {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredHosts = hosts.filter(h => 
    h.hostId?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.hostId?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading)
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
        <UserHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#E8E4DF] border-t-[#C8622A] rounded-full animate-spin" />
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#92694A]">Finding available hosts...</p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FAFAF8] page-enter">
      <UserHeader />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <h1 className="text-[28px] font-semibold text-[#1A1A1A]">Available Hosts</h1>
            <span className="bg-[#FDF0EA] text-[#C8622A] px-3 py-1 rounded-full text-[13px] font-semibold">
              {hosts.length}
            </span>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
            <input 
              type="text"
              placeholder="Search hosts by name or email..."
              className="w-full h-11 pl-10 pr-4 bg-white border border-[#E8E4DF] rounded-lg text-[14px] focus:outline-none focus:border-[#C8622A] focus:ring-4 focus:ring-[#C8622A]/10 transition-all placeholder:text-[#B0B0B0]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredHosts.length === 0 ? (
          <div className="bg-white border border-[#E8E4DF] rounded-[16px] p-12 text-center">
            <div className="w-16 h-16 bg-[#F5F3F0] rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-[#8A8A8A]" />
            </div>
            <h3 className="text-[18px] font-semibold text-[#1A1A1A] mb-2">No hosts found</h3>
            <p className="text-[14px] text-[#8A8A8A] max-w-xs mx-auto">
              Try adjusting your search or check back later for new available sessions.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredHosts.map((h) => (
              <HostCard
                key={h._id}
                host={h}
                onBook={handleBook}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

/* ---------- Sub-components ---------- */

const HostCard = ({ host, onBook }) => {
  const { hostId, timezone, weekly, durations, bufferBefore } = host;
  const name = hostId?.fullName ?? "Expert Host";
  const email = hostId?.email ?? "";
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="bg-white border border-[#E8E4DF] rounded-[16px] p-6 hover-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-[#F5F3F0] flex items-center justify-center text-[#92694A] font-semibold text-[18px]">
          {initials}
        </div>
        <div className="overflow-hidden">
          <h3 className="text-[16px] font-semibold text-[#1A1A1A] truncate">{name}</h3>
          <p className="text-[13px] text-[#8A8A8A] truncate">{email}</p>
        </div>
      </div>

      {/* Info Chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Chip icon={<Globe className="w-3.5 h-3.5" />} text={timezone || "UTC"} />
        <Chip icon={<Clock className="w-3.5 h-3.5" />} text={`${durations[0]}m`} />
        <Chip icon={<Timer className="w-3.5 h-3.5" />} text={`${bufferBefore}m buffer`} />
      </div>

      {/* Weekly Schedule */}
      <div className="flex-1 mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#92694A] block mb-3">
          Weekly Schedule
        </span>
        <div className="space-y-2">
          {weekly.length > 0 ? (
            weekly.map((slot, idx) => (
              <div key={idx} className="flex justify-between items-center text-[13px]">
                <span className="text-[#92694A] font-medium capitalize">{slot.day}</span>
                <span className="text-[#4A4A4A]">{slot.start} — {slot.end}</span>
              </div>
            ))
          ) : (
            <p className="text-[13px] text-[#8A8A8A] italic">No slots defined</p>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => onBook(host)}
        className="w-full h-11 bg-[#C8622A] hover:bg-[#A84E20] text-white font-medium text-[14px] rounded-[10px] transition-colors flex items-center justify-center gap-2 group"
      >
        Book Meeting
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
};

const Chip = ({ icon, text }) => (
  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F3F0] border border-[#E8E4DF] rounded-md text-[12px] font-medium text-[#4A4A4A]">
    <span className="text-[#92694A]">{icon}</span>
    {text}
  </div>
);

export default Availability;

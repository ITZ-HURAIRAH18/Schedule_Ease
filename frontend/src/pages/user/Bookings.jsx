import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import UserHeader from "../../components/UserHeader";
import { Calendar, Search, Filter, ArrowRight, Video } from "lucide-react";
import { formatDate, formatTime } from "../../utils/timeUtils";
import { useNavigate, Link } from "react-router-dom";

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
        setError(err.response?.data?.message || "Failed to fetch bookings.");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <UserHeader />

      <div className="max-w-[900px] mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-[28px] font-semibold text-[#1A1A1A]">Booking History</h1>
            <p className="text-[14px] text-[#4A4A4A] mt-1">
              A history of your scheduled and past meetings.
            </p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-4 h-[40px] bg-white border border-[#E8E4DF] rounded-[10px] text-[14px] focus:outline-none focus:border-[#C8622A] transition-all w-[200px]"
              />
            </div>
            <button className="w-[40px] h-[40px] flex items-center justify-center bg-white border border-[#E8E4DF] rounded-[10px] hover:bg-[#F5F3F0] transition-colors">
              <Filter className="w-4 h-4 text-[#4A4A4A]" />
            </button>
          </div>
        </header>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((n) => <SkeletonCard key={n} />)}
          </div>
        ) : error ? (
          <div className="p-6 bg-[#FEF2F2] border border-[#FEF2F2] rounded-[12px] text-[#B91C1C] text-[14px]">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {bookings.map((b) => (
              <BookingCard
                key={b._id}
                booking={b}
                formatDate={formatDate}
                formatTime={formatTime}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white border border-[#E8E4DF] rounded-[16px] p-6 h-[200px] animate-pulse">
    <div className="flex justify-between mb-4">
      <div className="w-12 h-12 rounded-full bg-[#F5F3F0]" />
      <div className="w-20 h-6 bg-[#F5F3F0] rounded-[6px]" />
    </div>
    <div className="space-y-3">
      <div className="h-4 bg-[#F5F3F0] rounded w-1/2" />
      <div className="h-6 bg-[#F5F3F0] rounded w-3/4" />
    </div>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-20 bg-white border border-[#E8E4DF] rounded-[16px]">
    <div className="w-16 h-16 bg-[#F5F3F0] rounded-full flex items-center justify-center mx-auto mb-4">
      <Calendar className="h-8 w-8 text-[#8A8A8A]" />
    </div>
    <h3 className="text-[16px] font-medium text-[#1A1A1A]">Your schedule is empty</h3>
    <p className="text-[14px] text-[#8A8A8A] mt-1 mb-8">
      Start booking meetings with our professional hosts.
    </p>
    <Link 
      to="/user/availability"
      className="inline-flex items-center gap-2 px-8 py-2.5 bg-[#C8622A] text-white text-[14px] font-medium rounded-[10px] hover:bg-[#A84E20] transition-all"
    >
      Find a Host <ArrowRight className="w-4 h-4" />
    </Link>
  </div>
);

const BookingCard = ({ booking, formatDate, formatTime, navigate }) => {
  const { hostId, start, end, status, meetingRoom } = booking;
  const hostName = hostId?.fullName || "Unknown Host";

  const getStatusStyle = (s) => {
    switch (s) {
      case "confirmed":
        return "bg-[#EDF7F1] text-[#2D7D52]";
      case "cancelled":
        return "bg-[#FEF2F2] text-[#B91C1C]";
      default:
        return "bg-[#FEF3E2] text-[#B45309]";
    }
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="bg-white border border-[#E8E4DF] rounded-[16px] p-6 transition-all duration-200 hover:translate-y-[-3px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.06)] flex flex-col h-full relative group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F5F3F0] flex items-center justify-center text-[#92694A] text-[15px] font-semibold border border-[#E8E4DF]">
            {getInitials(hostName)}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[#1A1A1A]">{hostName}</p>
            <p className="text-[12px] text-[#8A8A8A]">Expert Host</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold uppercase tracking-wider ${getStatusStyle(status)}`}>
          {status}
        </span>
      </div>

      <div className="space-y-4 mb-6 flex-1">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#F5F3F0] rounded-[6px]">
          <Calendar className="w-3.5 h-3.5 text-[#C8622A]" />
          <span className="text-[13px] text-[#4A4A4A] font-medium">{formatDate(start)}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[20px] font-semibold text-[#1A1A1A]">{formatTime(start)}</span>
          <span className="text-[#8A8A8A]">→</span>
          <span className="text-[20px] font-semibold text-[#4A4A4A]">{formatTime(end)}</span>
        </div>
      </div>

      <div className="mt-auto">
        {status === 'confirmed' && meetingRoom ? (
          <button
            onClick={() => navigate(`/meeting/${meetingRoom}`)}
            className="w-full h-[40px] rounded-[10px] bg-[#C8622A] text-white text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-[#A84E20] transition-colors"
          >
            <Video className="w-4 h-4" />
            Join Room
          </button>
        ) : (
          <div className="w-full h-[40px] rounded-[10px] bg-[#F5F3F0] text-[#8A8A8A] text-[12px] font-medium flex items-center justify-center border border-[#E8E4DF]">
            {status === 'cancelled' ? "Meeting Cancelled" : "Awaiting Host Access"}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;

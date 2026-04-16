import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import UserHeader from "../../components/UserHeader";
import { Calendar, Clock, Video, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { formatDate, formatTime } from "../../utils/timeUtils";

const UserDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance
      .get("/user/bookings")
      .then((res) => setBookings(res.data.bookings || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <UserHeader />
      
      <div className="max-w-[900px] mx-auto px-6 py-12">
        <header className="mb-10">
          <h1 className="text-[28px] font-semibold text-[#1A1A1A]">My Bookings</h1>
          <p className="text-[14px] text-[#4A4A4A] mt-1">
            Manage and join your upcoming scheduled meetings.
          </p>
        </header>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((n) => <SkeletonCard key={n} />)}
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
  <div className="bg-white border border-[#E8E4DF] rounded-[16px] p-6 h-[220px] animate-pulse">
    <div className="flex justify-between mb-6">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-full bg-[#F5F3F0]" />
        <div className="space-y-2">
          <div className="h-4 bg-[#F5F3F0] rounded w-24" />
          <div className="h-3 bg-[#F5F3F0] rounded w-16" />
        </div>
      </div>
      <div className="w-20 h-6 bg-[#F5F3F0] rounded-[6px]" />
    </div>
    <div className="space-y-4">
      <div className="h-4 bg-[#F5F3F0] rounded w-1/2" />
      <div className="h-8 bg-[#F5F3F0] rounded w-3/4" />
    </div>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-20 bg-white border border-[#E8E4DF] rounded-[16px]">
    <div className="w-16 h-16 bg-[#FDF0EA] rounded-full flex items-center justify-center mx-auto mb-4">
      <Calendar className="h-8 w-8 text-[#C8622A]" />
    </div>
    <h3 className="text-[16px] font-medium text-[#1A1A1A]">No bookings yet</h3>
    <p className="text-[14px] text-[#8A8A8A] mt-1 mb-6">
      When you schedule meetings, they will appear here.
    </p>
    <Link 
      to="/user/availability"
      className="inline-flex items-center px-6 py-2.5 bg-[#C8622A] text-white text-[14px] font-medium rounded-[10px] hover:bg-[#A84E20] transition-colors"
    >
      Browse hosts
    </Link>
  </div>
);

const BookingCard = ({ booking, formatDate, formatTime, navigate }) => {
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
        });
      } catch {}
      finally {
        mounted && setChecking(false);
      }
    };
    check();
    return () => { mounted = false; };
  }, [meetingRoom]);

  const opensAt = access?.accessStart
    ? new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date(access.accessStart))
    : null;

  const statusStyle = status === "confirmed" 
    ? "bg-[#EDF7F1] text-[#2D7D52]" 
    : "bg-[#FEF3E2] text-[#B45309]";

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="bg-white border border-[#E8E4DF] rounded-[16px] p-6 transition-all duration-200 hover:translate-y-[-3px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.06)] flex flex-col h-full relative">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F5F3F0] flex items-center justify-center text-[#92694A] text-[15px] font-semibold">
            {getInitials(hostName)}
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#1A1A1A]">{hostName}</h3>
            <p className="text-[12px] text-[#8A8A8A]">Expert Host</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold uppercase tracking-wider ${statusStyle}`}>
          {status}
        </span>
      </div>

      <div className="space-y-4 mb-6 flex-1">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#F5F3F0] rounded-[6px]">
          <Calendar className="w-3.5 h-3.5 text-[#C8622A]" />
          <span className="text-[13px] text-[#4A4A4A] font-medium">{formatDate(start)}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[22px] font-semibold text-[#1A1A1A]">
            {formatTime(start)}
          </span>
          <ArrowRight className="w-4 h-4 text-[#8A8A8A]" />
          <span className="text-[22px] font-semibold text-[#4A4A4A]">
            {formatTime(end)}
          </span>
        </div>
      </div>

      <div className="mt-auto">
        {meetingRoom ? (
          <button
            onClick={() => joinAllowed && navigate(`/meeting/${meetingRoom}`)}
            disabled={!joinAllowed}
            className={`w-full h-[40px] rounded-[10px] border-[1.5px] border-[#E8E4DF] text-[14px] font-medium flex items-center justify-center transition-colors ${
              joinAllowed 
                ? "bg-white text-[#1A1A1A] border-[#C8622A] text-[#C8622A] hover:bg-[#FDF0EA]" 
                : "bg-white text-[#8A8A8A] cursor-not-allowed"
            }`}
          >
            {checking ? "Checking..." : joinAllowed ? "Join Meeting" : opensAt ? `Opens at ${opensAt}` : "Meeting Link"}
          </button>
        ) : (
          <div className="w-full h-[40px] rounded-[10px] border-[1.5px] border-[#E8E4DF] bg-white text-[#8A8A8A] text-[13px] font-medium flex items-center justify-center">
            {status === 'confirmed' ? "Waiting for video link..." : "Pending host approval"}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;

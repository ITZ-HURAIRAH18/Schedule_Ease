// src/components/MeetingRoom.jsx
import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PhoneOff, 
  Users, 
  Info, 
  AlertCircle, 
  CheckCircle2,
  ShieldCheck,
  Clock,
  Video
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const MeetingRoom = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { user } = useAuth();
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Initializing...");
  const [showParticipants, setShowParticipants] = useState(false);

  const parseTimestamp = useCallback((value) => {
    if (!value) return null;
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? null : ms;
  }, []);

  const getDisplayName = (participant, fallback) => {
    if (!participant) return fallback;
    if (typeof participant === "string") return participant;
    return (
      participant.name ||
      participant.fullName ||
      participant.username ||
      participant.email ||
      fallback
    );
  };

  const hostDisplayName = getDisplayName(meetingInfo?.bookingInfo?.host, "Host");
  const guestDisplayName = getDisplayName(meetingInfo?.bookingInfo?.guest, "Guest");

  const isCurrentUserHost = user && meetingInfo?.bookingInfo?.host?.id
    ? String(user?._id || user?.id) === String(meetingInfo.bookingInfo.host.id)
    : false;

  const statusLower = (status || "").toLowerCase();
  
  const getStatusConfig = () => {
    if (error || statusLower.includes("failed") || statusLower.includes("error")) {
      return { color: "bg-red-500", text: "Connection Error", icon: AlertCircle };
    }
    if (statusLower.includes("waiting") || statusLower.includes("not yet open")) {
      return { color: "bg-amber-500", text: status, icon: Clock };
    }
    if (statusLower.includes("ended")) {
      return { color: "bg-slate-500", text: "Meeting Ended", icon: Info };
    }
    return { color: "bg-emerald-500", text: "Connected", icon: CheckCircle2 };
  };

  const statusConfig = getStatusConfig();

  const handleLeaveCall = () => {
    navigate(-1);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await axiosInstance.get(`/meetings/${roomId}`);
        if (mounted) {
          setMeetingInfo(res.data);
          setStatus("Meeting loaded");
        }
      } catch (err) {
        console.error("Failed to load meeting info:", err);
        setError("Meeting session not found or expired.");
      }
    };
    if (roomId) load();
    return () => { mounted = false; };
  }, [roomId]);

  useEffect(() => {
    if (!meetingInfo) return;

    const accessStartMs = parseTimestamp(meetingInfo.bookingInfo?.accessStart);
    const accessEndMs = parseTimestamp(meetingInfo.bookingInfo?.accessEnd);
    const now = Date.now();

    if (accessEndMs && now >= accessEndMs) {
      setStatus("Meeting ended");
      setError("This meeting has ended. Please schedule a new session.");
      return;
    }

    const earlyJoinWindow = 30 * 60 * 1000;
    const canJoinEarly = accessStartMs && now >= (accessStartMs - earlyJoinWindow);

    if (accessStartMs && now < accessStartMs && !canJoinEarly) {
      const friendlyStart = new Date(accessStartMs).toLocaleString();
      setStatus("Meeting not yet open");
      setError(`You can join from ${new Date(accessStartMs - earlyJoinWindow).toLocaleTimeString()}`);
    } else {
      setStatus("Connected");
    }
  }, [meetingInfo, parseTimestamp]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FAFAF8] text-[#1A1A1A] font-sans">
      
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 z-50 w-full bg-[#FFFFFF] border-b border-[#E8E4DF] px-6 py-4"
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-[10px] bg-[#C8622A] flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <h1 className="text-[16px] font-semibold text-[#1A1A1A]">NexGen</h1>
          </div>

          {meetingInfo && (
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#92694A]">Live Session</p>
                <p className="text-[14px] font-semibold text-[#1A1A1A] mt-1">
                  {hostDisplayName} <span className="text-[#8A8A8A] mx-2">+</span> {guestDisplayName}
                </p>
              </div>
              <div className="w-[1px] h-8 bg-[#E8E4DF]" />
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-[6px] ${
                statusLower.includes('connected') ? 'bg-[#EDF7F1]' : 'bg-[#FEF3E2]'
              }`}>
                <span className={`h-2 w-2 rounded-full ${
                  statusLower.includes('connected') ? 'bg-[#2D7D52]' : 'bg-[#B45309]'
                }`}></span>
                <span className={`text-[12px] font-semibold ${
                  statusLower.includes('connected') ? 'text-[#2D7D52]' : 'text-[#B45309]'
                }`}>{statusConfig.text}</span>
              </div>
            </div>
          )}
        </div>
      </motion.header>

      {/* Main Content Area */}
      <main className="mx-auto flex h-screen max-w-[1600px] flex-col px-6 pt-24 pb-8">
        <div className="flex h-full flex-1 gap-6">
          <motion.div layout className="relative flex flex-1 flex-col">
            <div className="h-full w-full">
              {meetingInfo?.meetingLink ? (
                <div className="h-full w-full rounded-[12px] overflow-hidden border border-[#E8E4DF] bg-white shadow-xl relative">
                  <iframe
                    src={meetingInfo.meetingLink}
                    allow="camera; microphone; display-capture; autoplay; encrypted-media; fullscreen"
                    className="h-full w-full border-none"
                    title="Nexagen Video Meeting"
                  />
                </div>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center gap-6 bg-white rounded-[12px] border border-[#E8E4DF] p-12 text-center">
                    <div className="w-20 h-20 bg-[#FDF0EA] rounded-[20px] flex items-center justify-center animate-pulse mb-2">
                        <Video className="w-10 h-10 text-[#C8622A]" />
                    </div>
                    <div>
                      <h3 className="text-[20px] font-semibold text-[#1A1A1A] mb-2">{status}</h3>
                      <p className="text-[14px] text-[#8A8A8A] max-w-sm">
                        {statusLower.includes('loading') 
                          ? "We're setting up your secure session..." 
                          : statusLower.includes('open')
                            ? error
                            : "Waiting for the host to confirm the meeting room. Please stay on this page."}
                      </p>
                    </div>
                    {error && !statusLower.includes('open') && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Sidebar */}
          <AnimatePresence>
            {showParticipants && (
              <motion.aside 
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="hidden w-80 flex-col gap-4 lg:flex"
              >
                <div className="flex-1 overflow-y-auto rounded-[12px] border border-[#E8E4DF] bg-[#FFFFFF] p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[#1A1A1A]">
                      <Users className="h-4 w-4 text-[#C8622A]" />
                      Participants
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <PremiumParticipantCard name="You" role={isCurrentUserHost ? 'Host' : 'Guest'} avatar="U" isMe mic={true} />
                    <PremiumParticipantCard name={isCurrentUserHost ? guestDisplayName : hostDisplayName} role={isCurrentUserHost ? 'Guest' : 'Host'} avatar="O" mic={true} />
                  </div>

                  <div className="mt-8 space-y-4 pt-6 border-t border-[#E8E4DF]">
                    <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#92694A]">Meeting Info</p>
                    <div className="grid gap-3">
                      <PremiumInfoItem icon={Clock} label="Start" value={meetingInfo?.bookingInfo?.start ? new Date(meetingInfo.bookingInfo.start).toLocaleTimeString() : "--"} />
                      <PremiumInfoItem icon={ShieldCheck} label="Security" value="Encrypted" />
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Persistent Leave Button */}
      <motion.div 
        className="fixed bottom-6 right-6 z-[60]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <button
          onClick={handleLeaveCall}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#B91C1C] text-white font-semibold transition-all hover:bg-red-700 shadow-lg"
        >
          <PhoneOff className="w-4 h-4" />
          Leave Meeting
        </button>
      </motion.div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
              className="max-w-lg w-full rounded-[12px] border border-[#E8E4DF] bg-[#FFFFFF] p-8"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[10px] bg-[#FEF2F2] border border-[#FEE2E2]">
                <AlertCircle className="h-8 w-8 text-[#B91C1C]" />
              </div>
              <h2 className="mb-2 text-[20px] font-semibold text-[#1A1A1A]">Connection Issue</h2>
              <p className="mb-6 text-[14px] text-[#4A4A4A] leading-relaxed">{error}</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => window.location.reload()} className="w-full rounded-[10px] bg-[#C8622A] text-white py-3 text-[14px] font-semibold">Retry Connection</button>
                <button onClick={handleLeaveCall} className="w-full rounded-[10px] border border-[#E8E4DF] bg-white text-[#4A4A4A] py-3 text-[14px] font-semibold">Exit Meeting</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PremiumParticipantCard = ({ name, role, avatar, isMe, mic }) => (
  <div className={`flex items-center justify-between rounded-[10px] p-4 border ${isMe ? 'bg-[#FDF0EA] border-[#FDF0EA]' : 'bg-[#F5F3F0] border-[#E8E4DF]'}`}>
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-[8px] font-semibold text-white ${isMe ? 'bg-[#C8622A]' : 'bg-[#92694A]'}`}>{avatar}</div>
      <div><p className="text-[14px] font-semibold text-[#1A1A1A]">{name}</p><p className="text-[12px] text-[#8A8A8A]">{role}</p></div>
    </div>
  </div>
);

const PremiumInfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-[10px] bg-[#FFFFFF] p-3 border border-[#E8E4DF]">
    <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#FDF0EA]"><Icon className="h-4 w-4 text-[#C8622A]" /></div>
    <div><p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#92694A]">{label}</p><p className="text-[13px] font-semibold text-[#1A1A1A]">{value}</p></div>
  </div>
);

export default MeetingRoom;
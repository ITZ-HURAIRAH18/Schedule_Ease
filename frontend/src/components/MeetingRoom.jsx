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
  Video,
  Check
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
  const [stream, setStream] = useState(null);
  const userVideo = useRef();
  const streamRef = useRef();

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
  
  const handleLeaveCall = () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    navigate(-1);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await axiosInstance.get(`/meetings/${roomId}`);
        if (mounted) {
          setMeetingInfo(res.data);
          setStatus(res.data?.valid ? "Live" : "Waiting for time...");
        }
      } catch (err) {
        console.error("Failed to load meeting info:", err);
        setError(err.response?.data?.message || "Meeting session not found or expired.");
      }
    };

    const startLocalVideo = async () => {
      try {
        const local = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (mounted) {
          setStream(local);
          streamRef.current = local;
          if (userVideo.current) userVideo.current.srcObject = local;
        }
      } catch (e) {
        console.warn("Local camera preview failed:", e);
      }
    };

    if (roomId) {
      load();
      startLocalVideo();
      const interval = setInterval(() => {
        if (mounted && (!meetingInfo || !meetingInfo.meetingLink)) load();
      }, 5000);
      return () => {
        mounted = false;
        clearInterval(interval);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
      };
    }
  }, [roomId]);

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
            <h1 className="text-[16px] font-semibold text-[#1A1A1A]">NexGen Meeting Room</h1>
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
                statusLower.includes('live') || meetingInfo.meetingLink ? 'bg-[#EDF7F1]' : 'bg-[#FEF3E2]'
              }`}>
                <span className={`h-2 w-2 rounded-full animate-pulse ${
                  statusLower.includes('live') || meetingInfo.meetingLink ? 'bg-[#2D7D52]' : 'bg-[#B45309]'
                }`}></span>
                <span className={`text-[12px] font-semibold ${
                  statusLower.includes('live') || meetingInfo.meetingLink ? 'text-[#2D7D52]' : 'text-[#B45309]'
                }`}>{meetingInfo.meetingLink ? 'Room Open' : status}</span>
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
                <div className="h-full w-full flex flex-col md:flex-row gap-6">
                  {/* Left Side: Local Preview */}
                  <div className="flex-1 bg-white rounded-[16px] border border-[#E8E4DF] overflow-hidden relative shadow-sm">
                    <video 
                      ref={userVideo} 
                      autoPlay 
                      muted 
                      playsInline 
                      className="w-full h-full object-cover bg-black"
                    />
                    <div className="absolute top-6 left-6 px-4 py-2 bg-black/50 backdrop-blur-md rounded-lg border border-white/20">
                      <p className="text-white text-[13px] font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        You (Preview)
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Waiting Info */}
                  <div className="w-full md:w-[400px] flex flex-col items-center justify-center gap-6 bg-white rounded-[16px] border border-[#E8E4DF] p-12 text-center">
                    <div className="w-20 h-20 bg-[#FDF0EA] rounded-[24px] flex items-center justify-center animate-bounce mb-2">
                        <Video className="w-10 h-10 text-[#C8622A]" />
                    </div>
                    <div>
                      <h3 className="text-[20px] font-semibold text-[#1A1A1A] mb-2">{status || "Connecting..."}</h3>
                      <p className="text-[14px] text-[#8A8A8A] leading-relaxed">
                        {statusLower.includes('time') 
                          ? error || "The session hasn't started yet. Your camera is ready!"
                          : "Connecting to secure video bridge. Both users will see each other automatically."}
                      </p>
                    </div>
                    
                    <div className="w-full h-[2px] bg-[#F5F3F0] my-2" />
                    
                    <div className="flex flex-col gap-2 w-full text-left">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#92694A] mb-1">Status Check</p>
                      <StatusItem label="Camera & Microphone" active={!!stream} />
                      <StatusItem label="Secure Connection" active={true} />
                      <StatusItem label="Host Ready" active={!!meetingInfo?.meetingLink} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
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
          Leave Room
        </button>
      </motion.div>

      {/* Error Alert */}
      <AnimatePresence>
        {error && !meetingInfo && (
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
              <h2 className="mb-2 text-[20px] font-semibold text-[#1A1A1A]">Meeting Issue</h2>
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

const StatusItem = ({ label, active }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-[13px] text-[#4A4A4A]">{label}</span>
    {active ? (
      <div className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
        <Check className="w-3 h-3" /> Ready
      </div>
    ) : (
      <div className="flex items-center gap-1 text-amber-500 font-semibold text-[11px]">
        <Clock className="w-3 h-3" /> Waiting
      </div>
    )}
  </div>
);

export default MeetingRoom;
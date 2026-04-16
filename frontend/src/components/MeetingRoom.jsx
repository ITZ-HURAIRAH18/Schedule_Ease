import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Share2, 
  Users, 
  Info, 
  AlertCircle, 
  CheckCircle2,
  Settings,
  ShieldCheck,
  Clock,
  MoreVertical
} from "lucide-react";
import { getSocketUrl } from "../utils/apiConfig";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const MeetingRoom = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { user } = useAuth();
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [stream, setStream] = useState(null);
  const streamRef = useRef(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Initializing...");
  const socketRef = useRef(null);
  const userVideo = useRef();
  const peersRef = useRef([]);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [canStart, setCanStart] = useState(false);
  const hasStartedRef = useRef(false);
  const startTimerRef = useRef(null);
  const endTimerRef = useRef(null);
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

  const hasRemoteParticipants = remoteStreams.length > 0;
  const statusLower = (status || "").toLowerCase();
  
  const getStatusConfig = () => {
    if (error || statusLower.includes("failed") || statusLower.includes("error")) {
      return { color: "bg-red-500", text: "Connection Error", icon: AlertCircle };
    }
    if (statusLower.includes("reconnect") || statusLower.includes("waiting") || statusLower.includes("not yet open")) {
      return { color: "bg-amber-500", text: status, icon: Clock };
    }
    if (statusLower.includes("ended")) {
      return { color: "bg-slate-500", text: "Meeting Ended", icon: Info };
    }
    return { color: "bg-emerald-500", text: "Connected", icon: CheckCircle2 };
  };

  const statusConfig = getStatusConfig();
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    if (!stream) {
      setIsCameraOn(false);
      setIsMicOn(false);
      return;
    }
    const [videoTrack] = stream.getVideoTracks();
    const [audioTrack] = stream.getAudioTracks();
    setIsCameraOn(Boolean(videoTrack?.enabled));
    setIsMicOn(Boolean(audioTrack?.enabled));
  }, [stream]);

  const handleToggleCamera = () => {
    const activeStream = streamRef.current;
    if (!activeStream) return;
    setIsCameraOn((prev) => {
      const next = !prev;
      activeStream.getVideoTracks().forEach((track) => {
        track.enabled = next;
      });
      return next;
    });
  };

  const handleToggleMic = () => {
    const activeStream = streamRef.current;
    if (!activeStream) return;
    setIsMicOn((prev) => {
      const next = !prev;
      activeStream.getAudioTracks().forEach((track) => {
        track.enabled = next;
      });
      return next;
    });
  };

  const teardownConnections = useCallback(() => {
    try {
      socketRef.current?.disconnect();
    } catch (disconnectError) {
      console.error("Socket disconnect error:", disconnectError);
    }
    peersRef.current.forEach((peer) => peer.destroy?.());
    peersRef.current = [];
    const activeStream = streamRef.current;
    if (activeStream) {
      activeStream.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (userVideo.current) {
      userVideo.current.srcObject = null;
    }
    socketRef.current = null;
  }, []);

  const resetMediaState = useCallback(() => {
    setRemoteStreams([]);
    setStream(null);
    streamRef.current = null;
    setIsCameraOn(false);
    setIsMicOn(false);
  }, []);

  const handleLeaveCall = () => {
    clearTimeout(startTimerRef.current);
    startTimerRef.current = null;
    clearTimeout(endTimerRef.current);
    endTimerRef.current = null;
    teardownConnections();
    resetMediaState();
    hasStartedRef.current = false;
    setCanStart(false);
    setError("");
    setStatus("Call ended");
    const hasHistory = typeof window !== "undefined" && window.history.length > 1;
    if (hasHistory) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await axiosInstance.get(`/meetings/${roomId}`);
        if (mounted) setMeetingInfo(res.data);
      } catch (err) {
        console.error("Failed to load meeting info:", err);
      }
    };
    if (roomId) load();
    return () => {
      mounted = false;
    };
  }, [roomId]);

  useEffect(() => {
    if (!meetingInfo) return;

    const accessStartMs = parseTimestamp(meetingInfo.bookingInfo?.accessStart);
    const accessEndMs = parseTimestamp(meetingInfo.bookingInfo?.accessEnd);
    const now = Date.now();

    let startTimeout;

    const endSession = () => {
      teardownConnections();
      resetMediaState();
      hasStartedRef.current = false;
      setCanStart(false);
      clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    };

    if (accessEndMs && now >= accessEndMs) {
      endSession();
      setStatus("Meeting ended");
      setError("This meeting has ended. Please schedule a new session.");
      return;
    }

    // Allow joining from 30 minutes before the meeting or immediately if within range
    const earlyJoinWindow = 30 * 60 * 1000; // 30 minutes before
    const canJoinEarly = accessStartMs && now >= (accessStartMs - earlyJoinWindow);

    if (accessStartMs && now < accessStartMs && !canJoinEarly) {
      endSession();
      const friendlyStart = new Date(accessStartMs).toLocaleString();
      setStatus("Meeting not yet open");
      setError(`You can join from ${new Date(accessStartMs - earlyJoinWindow).toLocaleTimeString()}`);
      startTimeout = setTimeout(() => {
        setError("");
        setStatus("Ready to join");
        setCanStart(true);
        startTimerRef.current = null;
      }, (accessStartMs - earlyJoinWindow) - now);
      startTimerRef.current = startTimeout;
    } else {
      setError((prev) => (prev && prev.includes("meeting opens at") ? "" : prev));
      setCanStart(true);
    }

    return () => {
      if (startTimeout) clearTimeout(startTimeout);
    };
  }, [meetingInfo, parseTimestamp, resetMediaState, teardownConnections]);

  useEffect(() => {
    if (!meetingInfo) return;
    clearTimeout(endTimerRef.current);
    const accessEndMs = parseTimestamp(meetingInfo.bookingInfo?.accessEnd);
    if (!accessEndMs) return;
    const now = Date.now();
    if (now >= accessEndMs) {
      if (hasStartedRef.current) {
        teardownConnections();
        resetMediaState();
        hasStartedRef.current = false;
      }
      setCanStart(false);
      setStatus("Meeting ended");
      setError("This meeting has ended. Please schedule a new session.");
      return;
    }
    const timeout = setTimeout(() => {
      if (hasStartedRef.current) {
        teardownConnections();
        resetMediaState();
        hasStartedRef.current = false;
      }
      setCanStart(false);
      setStatus("Meeting ended");
      setError("This meeting has ended. Please schedule a new session.");
      endTimerRef.current = null;
    }, accessEndMs - now);
    endTimerRef.current = timeout;
    return () => clearTimeout(timeout);
  }, [meetingInfo, parseTimestamp, resetMediaState, teardownConnections]);

  useEffect(() => {
    if (!roomId || !meetingInfo || !canStart || hasStartedRef.current) return;
    let mounted = true;
    hasStartedRef.current = true;
    const start = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Browser doesn't support camera/microphone access.");
        }
        setStatus("Requesting media access...");
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        if (!mounted) return;
        setStatus("Connecting to meeting...");
        setStream(localStream);
        streamRef.current = localStream;
        if (userVideo.current) userVideo.current.srcObject = localStream;

        const socketUrl = getSocketUrl();
        const meetingNamespaceUrl = socketUrl ? `${socketUrl}/meeting` : `/meeting`;
        const isNetworkIP = !['localhost', '127.0.0.1'].includes(window.location.hostname);
        const useSecure = window.location.protocol === 'https:';

        socketRef.current = io(meetingNamespaceUrl, {
          transports: import.meta.env.DEV && isNetworkIP ? ['polling'] : ['websocket', 'polling'],
          upgrade: !import.meta.env.DEV || !isNetworkIP,
          secure: useSecure,
          rejectUnauthorized: false,
          timeout: 45000,
          reconnection: true,
          autoConnect: true,
        });

        socketRef.current.on("connect", () => {
          setStatus("Connected. Joining room...");
          socketRef.current.emit("join_meeting_room", roomId);
        });

        socketRef.current.on("connect_error", (err) => {
          setError(`Failed to connect to meeting server. Error: ${err.message}`);
          setStatus("Connection failed");
        });

        socketRef.current.on("meeting_role", ({ initiator }) => {
          setStatus(initiator ? "Setting up connection..." : "Waiting for participant...");
          const peer = new Peer({ initiator, trickle: true, stream: localStream });
          peer.on("signal", (signal) => {
            socketRef.current.emit("signal", { roomId, signal, sender: socketRef.current.id });
          });
          peer.on("stream", (remoteStream) => {
            setStatus("Connected!");
            setRemoteStreams((prev) => [...prev, remoteStream]);
          });
          peer.on("error", (err) => {
            setError("Peer connection failed: " + err.message);
          });
          peersRef.current.push(peer);
        });

        socketRef.current.on("signal", ({ signal }) => {
          const peer = peersRef.current[0];
          if (peer) {
            try { peer.signal(signal); } catch (err) { console.error("peer.signal error:", err); }
          }
        });

        socketRef.current.on("room_full", () => {
          setError("Room is full! Only two participants allowed.");
          setStatus("Room full");
        });
      } catch (err) {
        setError(err.message || "Failed to initialize meeting.");
        setStatus("Error");
        resetMediaState();
        hasStartedRef.current = false;
      }
    };
    start();
    return () => {
      mounted = false;
      hasStartedRef.current = false;
      teardownConnections();
      resetMediaState();
    };
  }, [roomId, meetingInfo, canStart, resetMediaState, teardownConnections]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FAFAF8] text-[#1A1A1A] font-sans" style={{ fontFamily: "Inter, sans-serif" }}>
      
      {/* Premium Navbar Header */}
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
                statusLower.includes('connected') || statusLower.includes('joined') ? 'bg-[#EDF7F1]' : 'bg-[#FEF3E2]'
              }`}>
                <span className={`h-2 w-2 rounded-full ${
                  statusLower.includes('connected') || statusLower.includes('joined') ? 'bg-[#2D7D52]' : 'bg-[#B45309]'
                }`}></span>
                <span className={`text-[12px] font-semibold ${
                  statusLower.includes('connected') || statusLower.includes('joined') ? 'text-[#2D7D52]' : 'text-[#B45309]'
                }`}>{statusConfig.text}</span>
              </div>
            </div>
          )}
        </div>
      </motion.header>

      {/* Main Content Area */}
      <main className="mx-auto flex h-screen max-w-[1600px] flex-col px-6 pt-24 pb-32">
        <div className="flex h-full flex-1 gap-6">
          <motion.div 
            layout
            className="relative flex flex-1 flex-col"
          >
            <div className={`grid h-full w-full gap-6 transition-all duration-700 ease-in-out ${
              remoteStreams.length > 0 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
            }`}>
              {/* Local Video Container */}
              <motion.div 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className={`group relative overflow-hidden rounded-[12px] border border-[#E8E4DF] bg-[#FFFFFF] transition-all duration-200 hover:translate-y-[-3px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.06)] ${
                  remoteStreams.length === 0 ? "mx-auto aspect-video max-h-[75vh] w-full max-w-6xl" : "h-full"
                }`}
              >
                <video ref={userVideo} autoPlay muted playsInline className="h-full w-full object-cover bg-[#F5F3F0]" />
                
                <AnimatePresence>
                  {!stream && (
                    <motion.div 
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#FAFAF8]"
                    >
                      <div className="flex h-20 w-20 items-center justify-center rounded-[12px] bg-[#F5F3F0] border border-[#E8E4DF]">
                        <Video className="h-10 w-10 text-[#8A8A8A]" />
                      </div>
                      <p className="text-[14px] font-medium text-[#8A8A8A]">Initializing Media...</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Video Overlays */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1A1A1A]/60 via-[#1A1A1A]/30 to-transparent p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#C8622A] text-white text-[11px] font-bold">
                        YOU
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-white">You</p>
                        <p className="text-[12px] font-medium text-[#8A8A8A]">Host</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!isMicOn && <div className="rounded-[8px] bg-[#FEF2F2] p-2 border border-[#E8E4DF]"><MicOff className="h-4 w-4 text-[#B91C1C]" /></div>}
                      {!isCameraOn && <div className="rounded-[8px] bg-[#FEF2F2] p-2 border border-[#E8E4DF]"><VideoOff className="h-4 w-4 text-[#B91C1C]" /></div>}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Remote Video Container */}
              <AnimatePresence>
                {remoteStreams.map((remoteStream, i) => (
                  <motion.div
                    key={i}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.35 }}
                    className="group relative h-full overflow-hidden rounded-[12px] border border-[#E8E4DF] bg-[#FFFFFF] transition-all duration-200 hover:translate-y-[-3px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.06)]"
                  >
                    <video
                      autoPlay playsInline className="h-full w-full object-cover bg-[#F5F3F0]"
                      ref={(videoEl) => { if (videoEl) videoEl.srcObject = remoteStream; }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1A1A1A]/60 via-[#1A1A1A]/30 to-transparent p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#2D7D52] text-white text-[11px] font-bold">
                          {(isCurrentUserHost ? guestDisplayName : hostDisplayName).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-white">
                            {isCurrentUserHost ? guestDisplayName : hostDisplayName}
                          </p>
                          <p className="text-[12px] font-medium text-[#8A8A8A]">Guest</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Redesigned Sidebar */}
          <AnimatePresence>
            {showParticipants && (
              <motion.aside 
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="hidden w-80 flex-col gap-4 lg:flex"
              >
                <div className="flex-1 overflow-y-auto rounded-[12px] border border-[#E8E4DF] bg-[#FFFFFF] p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-[14px] font-semibold text-[#1A1A1A]">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#FDF0EA]">
                        <Users className="h-4 w-4 text-[#C8622A]" />
                      </div>
                      Participants
                    </h2>
                    <span className="text-[12px] font-semibold text-[#1A1A1A] bg-[#F5F3F0] px-2 py-1 rounded-[6px]">
                      {hasRemoteParticipants ? "2" : "1"}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <PremiumParticipantCard name="You" role="Host" avatar="YOU" isMe mic={isMicOn} />
                    {hasRemoteParticipants && (
                      <PremiumParticipantCard 
                        name={isCurrentUserHost ? guestDisplayName : hostDisplayName} 
                        role="Guest" 
                        avatar={(isCurrentUserHost ? guestDisplayName : hostDisplayName).charAt(0)} 
                        mic={true} 
                      />
                    )}
                  </div>

                  <div className="mt-8 space-y-4 pt-6 border-t border-[#E8E4DF]">
                    <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#92694A]">Meeting Info</p>
                    <div className="grid gap-3">
                      <PremiumInfoItem icon={Clock} label="Start Time" value={meetingInfo?.bookingInfo?.scheduledFor ? new Date(meetingInfo.bookingInfo.scheduledFor).toLocaleTimeString() : "--:--"} />
                      <PremiumInfoItem icon={ShieldCheck} label="Security" value="Encrypted" />
                      <PremiumInfoItem icon={Info} label="Room ID" value={roomId?.slice(-6) || "N/A"} />
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Premium Controls Bar */}
      <motion.div 
        initial={{ y: 150, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-x-0 bottom-10 z-50 flex justify-center px-6"
      >
        <div className="flex items-center gap-4 rounded-[10px] border border-[#E8E4DF] bg-[#FFFFFF] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.10),0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2">
            <PremiumControlButton 
              onClick={handleToggleMic} 
              active={isMicOn} 
              disabled={!stream}
              icon={isMicOn ? Mic : MicOff} 
            />
            <PremiumControlButton 
              onClick={handleToggleCamera} 
              active={isCameraOn} 
              disabled={!stream}
              icon={isCameraOn ? Video : VideoOff} 
            />
          </div>
          
          <div className="h-10 w-[1px] bg-[#E8E4DF]" />

          <div className="flex items-center gap-2">
            {canShare && (
              <PremiumControlButton 
                onClick={async () => {
                  try { await navigator.share({ title: "Join meeting", url: window.location.href }); } catch (e) {}
                }} 
                icon={Share2}
              />
            )}
            <PremiumControlButton 
              onClick={() => setShowParticipants(!showParticipants)} 
              icon={Users} 
              active={showParticipants}
            />
            <PremiumControlButton icon={Settings} />
          </div>

          <div className="h-10 w-[1px] bg-[#E8E4DF]" />

          <button
            onClick={handleLeaveCall}
            className="group relative flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#FEF2F2] text-[#B91C1C] border border-[#E8E4DF] transition-all duration-200 hover:translate-y-[-3px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] active:scale-95"
            title="Leave call"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      {/* Redesigned Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="max-w-lg w-full rounded-[12px] border border-[#E8E4DF] bg-[#FFFFFF] p-8"
            >
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[10px] bg-[#FEF2F2] border border-[#FEE2E2]">
                <AlertCircle className="h-8 w-8 text-[#B91C1C]" />
              </div>
              <h2 className="mb-2 text-[20px] font-semibold text-[#1A1A1A]">Connection Issue</h2>
              <p className="mb-6 text-[14px] text-[#4A4A4A] leading-relaxed">{error}</p>
              
              <div className="mb-8 space-y-3">
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-[#92694A]">Troubleshooting Steps</p>
                <div className="space-y-2">
                  <TroubleshootStep text="Check browser media permissions" />
                  <TroubleshootStep text="Verify network connection is stable" />
                  <TroubleshootStep text="Update your browser to the latest version" />
                  <TroubleshootStep text="Restart and try again" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full rounded-[10px] bg-[#C8622A] text-white py-3 text-[14px] font-semibold transition-all duration-200 hover:bg-[#A84E20]"
                >
                  Retry Connection
                </button>
                <button 
                  onClick={handleLeaveCall}
                  className="w-full rounded-[10px] border border-[#E8E4DF] bg-[#FFFFFF] text-[#4A4A4A] py-3 text-[14px] font-semibold transition-all duration-200 hover:bg-[#FAFAF8]"
                >
                  Exit Meeting
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Premium Helper Components
const PremiumControlButton = ({ onClick, icon: Icon, active = false, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-12 w-12 items-center justify-center rounded-[10px] border transition-all duration-200 hover:translate-y-[-3px] ${
        active 
          ? 'bg-[#FDF0EA] border-[#E8E4DF] text-[#C8622A]' 
          : 'bg-[#FFFFFF] border-[#E8E4DF] text-[#8A8A8A] hover:bg-[#F5F3F0]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]'}`}
      title={active ? "Turn off" : "Turn on"}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
};

const PremiumParticipantCard = ({ name, role, avatar, isMe, mic }) => (
  <div className={`flex items-center justify-between rounded-[10px] p-4 border transition-all ${
    isMe ? 'bg-[#FDF0EA] border-[#FDF0EA]' : 'bg-[#F5F3F0] border-[#E8E4DF]'
  }`}>
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-[8px] font-semibold text-[11px] text-white ${
        isMe ? 'bg-[#C8622A]' : 'bg-[#92694A]'
      }`}>
        {avatar}
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[#1A1A1A]">{name}</p>
        <p className="text-[12px] text-[#8A8A8A]">{role}</p>
      </div>
    </div>
    <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#FFFFFF] border border-[#E8E4DF]">
      {mic ? <Mic className="h-4 w-4 text-[#2D7D52]" /> : <MicOff className="h-4 w-4 text-[#B91C1C]" />}
    </div>
  </div>
);

const PremiumInfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-[10px] bg-[#FFFFFF] p-3 border border-[#E8E4DF]">
    <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#FDF0EA]">
      <Icon className="h-4 w-4 text-[#C8622A]" />
    </div>
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#92694A]">{label}</p>
      <p className="text-[13px] font-semibold text-[#1A1A1A]">{value}</p>
    </div>
  </div>
);

const TroubleshootStep = ({ text }) => (
  <div className="flex items-center gap-2">
    <div className="h-1.5 w-1.5 rounded-full bg-[#C8622A]" />
    <span className="text-[13px] text-[#4A4A4A]">{text}</span>
  </div>
);

// Legacy components kept for compatibility (not used in new design)
const ControlButton = ({ onClick, icon: Icon, active = false, disabled = false, variant = "ghost" }) => {
  const variants = {
    ghost: active ? "bg-white/10 text-white" : "bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white",
    primary: "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50",
    danger: "bg-red-500/20 text-red-400 ring-1 ring-red-500/50"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex h-16 w-16 items-center justify-center rounded-[1.5rem] transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 ${variants[variant]}`}
    >
      <Icon className={`h-6 w-6 transition-transform ${active ? "scale-110" : "group-hover:scale-110"}`} />
    </button>
  );
};

const ParticipantCard = ({ name, role, avatar, isMe, active, mic }) => (
  <div className={`flex items-center justify-between rounded-[1.75rem] p-4 ring-1 transition-all ${
    isMe ? "bg-indigo-500/10 ring-indigo-500/20" : "bg-white/5 ring-white/5"
  }`}>
    <div className="flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl font-black text-xs ${
        isMe ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-white/10 text-slate-300"
      }`}>
        {avatar}
      </div>
      <div>
        <p className="text-sm font-bold text-white">{name}</p>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${isMe ? "text-indigo-400" : "text-slate-500"}`}>{role}</p>
      </div>
    </div>
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950/50">
      {mic ? <Mic className="h-4 w-4 text-emerald-400" /> : <MicOff className="h-4 w-4 text-red-400" />}
    </div>
  </div>
);

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/5">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950/40">
      <Icon className="h-4 w-4 text-slate-400" />
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="text-xs font-bold text-white">{value}</p>
    </div>
  </div>
);

const TroubleStep = ({ text }) => (
  <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/5">
    <div className="h-1.5 w-1.5 rounded-full bg-red-500/50" />
    <span className="text-xs font-medium text-slate-400">{text}</span>
  </div>
);

export default MeetingRoom;
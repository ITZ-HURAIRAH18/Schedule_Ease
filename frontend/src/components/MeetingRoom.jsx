import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneOff,
  Users,
  Video,
  Mic,
  MicOff,
  VideoOff,
  AlertCircle,
  Video as VideoIcon,
  Wifi,
  WifiOff,
  Maximize2,
  Minimize2,
  Settings,
  MessageSquare,
  Clock,
  ChevronRight
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import io from "socket.io-client";
import { getSocketUrl } from "../utils/apiConfig";

const MeetingRoom = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { user } = useAuth();

  const [meetingInfo, setMeetingInfo] = useState(null);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Loading engine...");
  const [mediaError, setMediaError] = useState("");
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [connectionQuality, setConnectionQuality] = useState("good");
  const [elapsed, setElapsed] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const peerRef = useRef();
  const socketRef = useRef(null);
  const myVideo = useRef();
  const userVideo = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (status === "Session Live") {
      const interval = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (userVideo.current && remoteStream) {
      userVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (myVideo.current && stream) {
      myVideo.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (!peerRef.current) return;
    const interval = setInterval(() => {
      if (peerRef.current?.connectionState === "connected") {
        setConnectionQuality("good");
      } else if (peerRef.current?.connectionState === "connecting") {
        setConnectionQuality("fair");
      } else {
        setConnectionQuality("poor");
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [remoteStream]);

  useEffect(() => {
    let mounted = true;
    let peerConnection = null;
    let socket = null;
    let localStream = null;

    const STUN_SERVERS = [
      { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] }
    ];

    const createPeerConnection = async (shouldMakeOffer) => {
      if (peerConnection) return peerConnection;

      peerConnection = new RTCPeerConnection({
        iceServers: STUN_SERVERS
      });

      if (localStream) {
        const tracks = localStream.getTracks();
        tracks.forEach(track => {
          peerConnection.addTrack(track, localStream);
        });
      }

      peerConnection.ontrack = (event) => {
        if (event.streams.length > 0 && mounted) {
          setRemoteStream(event.streams[0]);
          setStatus("Session Live");
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("ice_candidate", {
            roomId,
            candidate: event.candidate
          });
        }
      };

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === "connected") {
          setConnectionQuality("good");
        }
        if (peerConnection.connectionState === "failed" && mounted) {
          setError("WebRTC connection failed - trying to reconnect");
        }
      };

      if (shouldMakeOffer) {
        try {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          if (socket) socket.emit("webrtc_offer", { roomId, offer });
        } catch (err) {
          console.error("Error creating offer:", err.message);
        }
      }

      peerRef.current = peerConnection;
      return peerConnection;
    };

    const initMeeting = async () => {
      try {
        const res = await axiosInstance.get(`/meetings/${roomId}`);
        if (!mounted) return;
        setMeetingInfo(res.data);

        setStatus("Requesting camera/mic...");

        const isSecure = window.location.protocol === "https:" ||
                         window.location.hostname === "localhost" ||
                         window.location.hostname === "127.0.0.1";

        const mediaConstraints = [
          { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true },
          { video: true, audio: true },
          { audio: true },
        ];
        for (const constraints of mediaConstraints) {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
              localStream = await navigator.mediaDevices.getUserMedia(constraints);
              if (localStream) {
                break;
              }
            } catch (mediaErr) {
              console.warn("Media failed:", mediaErr.message);
            }
          }
        }
        if (!mounted) return;

        if (localStream) {
          setStream(localStream);
          setStatus("Connecting...");
        } else {
          const noMediaMsg = !isSecure
            ? "Camera/mic require HTTPS. Open the page via HTTPS and accept the security warning."
            : "Camera/mic access denied. Click the camera icon in the address bar to allow permissions, then refresh.";
          setMediaError(noMediaMsg);
          setError(noMediaMsg);
        }

        const currentUserId = String(user?._id || user?.id || "anon");
        const myPeerId = `${roomId}-${currentUserId}`;

        socket = io(getSocketUrl(), {
          path: "/api/socket.io",
          transports: ["websocket", "polling"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("join_meeting", { roomId, userId: myPeerId });
          setStatus("Connecting...");
        });

        socket.on("user_joined", (data) => {
          setParticipantCount(prev => prev + 1);
          if (!peerConnection && data.userId !== myPeerId) {
            createPeerConnection(true);
          }
        });

        socket.on("user_left", () => {
          setParticipantCount(prev => Math.max(1, prev - 1));
        });

        socket.on("webrtc_offer", async (data) => {
          try {
            if (!peerConnection) {
              await createPeerConnection(false);
            }
            if (!peerConnection) return;

            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit("webrtc_answer", { roomId, answer });
          } catch (err) {
            console.error("Error handling offer:", err.message);
          }
        });

        socket.on("webrtc_answer", async (data) => {
          try {
            if (!peerConnection) return;
            if (peerConnection.signalingState !== "have-local-offer") return;
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          } catch (err) {
            console.error("Error handling answer:", err.message);
          }
        });

        socket.on("ice_candidate", async (data) => {
          try {
            if (peerConnection && data.candidate) {
              await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
          } catch (err) {
            console.error("Error adding ICE candidate:", err);
          }
        });

        socket.on("error", (error) => {
          if (mounted) setError(`Connection error: ${error}`);
        });

      } catch (err) {
        console.error("Meeting init error:", err);
        if (mounted) setError(err.message || "Failed to join room.");
      }
    };

    initMeeting();

    return () => {
      mounted = false;
      if (peerConnection) {
        peerConnection.close();
      }
      if (socket) {
        socket.disconnect();
      }
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [roomId, user]);

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !micOn;
      setMicOn(!micOn);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !videoOn;
      setVideoOn(!videoOn);
    }
  };

  const leaveMeeting = () => {
    navigate(-1);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getQualityIcon = () => {
    switch (connectionQuality) {
      case "good": return <Wifi className="w-3 h-3 text-green-400" />;
      case "fair": return <Wifi className="w-3 h-3 text-yellow-400" />;
      case "poor": return <WifiOff className="w-3 h-3 text-red-400" />;
      default: return <Wifi className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div ref={containerRef} className="h-screen max-h-screen bg-[#0a0f1e] text-white flex flex-col overflow-hidden">

      {/* TOP BAR */}
      {/* Premium accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-50 bg-gradient-to-r from-[#FC6C26] via-[#FFF4D6] to-[#FC6C26] opacity-80" />

      <div className="h-14 bg-[#0a0f1e]/80 backdrop-blur-xl border-b border-white/[0.04] flex items-center justify-between px-4 md:px-6 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FC6C26] to-[#E05A1A] flex items-center justify-center shadow-lg shadow-[#FC6C26]/20 ring-1 ring-[#FFF4D6]/20">
            <VideoIcon className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-[#FFF4D6]/90">NexGen Meeting</h1>
            <p className="text-[11px] text-white/40">{roomId?.slice(0, 8)}...</p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {/* Timer */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <Clock className="w-3 h-3 text-[#FC6C26]" />
            <span className="text-xs font-mono text-white/70">{formatTime(elapsed)}</span>
          </div>

          {/* Connection Quality */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            {getQualityIcon()}
            <span className="text-[11px] text-white/50 capitalize">{connectionQuality}</span>
          </div>

          {/* Participant Count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
            <Users className="w-3 h-3 text-[#FC6C26]" />
            <span className="text-xs font-medium text-white/70">{participantCount}</span>
          </div>

          {/* Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            remoteStream
              ? "bg-[#FC6C26]/10 text-[#FC6C26] border border-[#FC6C26]/20"
              : "bg-[#FFF4D6]/10 text-[#FFF4D6]/80 border border-[#FFF4D6]/20"
          }`}>
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className={`w-1.5 h-1.5 rounded-full ${remoteStream ? "bg-[#FC6C26] shadow-lg shadow-[#FC6C26]/50" : "bg-[#FFF4D6]"}`}
            />
            <span className="hidden sm:inline">{status}</span>
          </div>

          {/* Side panel toggle (mobile/tablet) */}
          <button
            onClick={() => setSidePanelOpen(!sidePanelOpen)}
            className="lg:hidden p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors border border-white/[0.06]"
          >
            <MessageSquare className="w-4 h-4 text-white/60" />
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors border border-white/[0.06]"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-white/60" /> : <Maximize2 className="w-4 h-4 text-white/60" />}
          </button>

          <button onClick={leaveMeeting} className="text-white/40 hover:text-white/80 transition-colors p-1">
            <span className="text-lg">&times;</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* VIDEO CONTAINER */}
        <div className={`flex-1 flex flex-col relative transition-all duration-300`}>

          {/* Video Grid */}
          <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-[#0a0f1e] via-[#0e1528] to-[#0a0f1e]">
            {/* Premium ambient glow */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#FC6C26]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#FFF4D6]/5 rounded-full blur-3xl pointer-events-none" />
            {remoteStream ? (
              <div className="w-full h-full relative">
                <video
                  ref={userVideo}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-[#FC6C26]/20">
                  <p className="text-xs font-medium text-[#FFF4D6]/80">Participant</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-[#FC6C26]/20 to-[#FC6C26]/5 flex items-center justify-center mb-6 border border-[#FC6C26]/20 shadow-lg shadow-[#FC6C26]/10"
                >
                  <Users className="w-14 h-14 text-[#FFF4D6]/30" />
                </motion.div>
                <h2 className="text-xl md:text-2xl font-semibold text-[#FFF4D6]/60">Waiting for participant...</h2>
                <p className="text-sm text-[#FFF4D6]/30 mt-2">They will appear here when they join</p>
                {mediaError && (
                  <p className="text-xs text-red-400/60 mt-3 max-w-sm text-center px-4">{mediaError}</p>
                )}
              </div>
            )}

            {/* LOCAL VIDEO - Picture in Picture */}
            <div className={`absolute bottom-4 right-4 rounded-xl overflow-hidden border-2 border-[#FC6C26]/20 shadow-2xl shadow-[#FC6C26]/10 bg-black transition-all duration-300 ${
              sidePanelOpen
                ? "w-28 h-20 md:w-36 md:h-28"
                : "w-36 h-28 md:w-48 md:h-36"
            }`}>
              <video
                ref={myVideo}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-medium text-[#FFF4D6]/80">
                You
              </div>

              {(!micOn || !videoOn) && (
                <div className="absolute top-2 right-2 flex gap-1">
                  {!micOn && (
                    <div className="p-1 bg-red-500/80 rounded-md">
                      <MicOff className="w-2.5 h-2.5" />
                    </div>
                  )}
                  {!videoOn && (
                    <div className="p-1 bg-red-500/80 rounded-md">
                      <VideoOff className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Connection Badge */}
            {remoteStream && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-[#FC6C26]/20 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#FC6C26] animate-pulse shadow-lg shadow-[#FC6C26]/50" />
                <span className="text-[11px] text-[#FFF4D6]/80 font-medium">Live</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* SIDE PANEL - Desktop (always visible on lg+) */}
        <div className="hidden lg:flex flex-col w-80 bg-[#0e1528] border-l border-white/[0.04] overflow-hidden">
          <div className="p-5 border-b border-white/[0.04]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#FFF4D6]/80">Meeting Details</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: "Status", value: "Connected", accent: true },
                { label: "Duration", value: formatTime(elapsed), mono: true },
                { label: "Video", value: videoOn ? "On" : "Off", accent: videoOn, danger: !videoOn },
                { label: "Audio", value: micOn ? "On" : "Off", accent: micOn, danger: !micOn },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.03]">
                  <span className="text-xs text-white/50">{item.label}</span>
                  <span className={`text-xs font-medium ${
                    item.accent ? "text-[#FC6C26]" : item.danger ? "text-red-400" : item.mono ? "text-white/70 font-mono" : "text-white/70"
                  }`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <h3 className="text-sm font-semibold text-[#FFF4D6]/80 mb-4">Participants ({participantCount})</h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FC6C26] to-[#E05A1A] flex items-center justify-center text-xs font-semibold">
                    {user?.fullName?.charAt(0)?.toUpperCase() || "Y"}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#FC6C26] border-2 border-[#0e1528]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{user?.fullName || "You"}</p>
                  <p className="text-[11px] text-white/40">Host</p>
                </div>
                <div className="flex gap-1">
                  {micOn ? <Mic className="w-3 h-3 text-white/40" /> : <MicOff className="w-3 h-3 text-red-400" />}
                  {videoOn ? <Video className="w-3 h-3 text-white/40" /> : <VideoOff className="w-3 h-3 text-red-400" />}
                </div>
              </div>
              {remoteStream && (
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFF4D6] to-[#E8DCC0] flex items-center justify-center text-xs font-semibold text-[#1A1A1A]">
                      P
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0e1528]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">Participant</p>
                    <p className="text-[11px] text-white/40">Guest</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE/TABLET SIDE PANEL - Slide overlay */}
        <AnimatePresence>
          {sidePanelOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSidePanelOpen(false)}
            >
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-0 h-full w-[300px] bg-[#0e1528] border-l border-white/[0.06] shadow-2xl"
              >
                <div className="p-5 border-b border-white/[0.04] flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#FFF4D6]/80">Meeting Details</h3>
                  <button
                    onClick={() => setSidePanelOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  </button>
                </div>
                <div className="p-5 space-y-2">
                  {[
                    { label: "Status", value: "Connected", accent: true },
                    { label: "Duration", value: formatTime(elapsed), mono: true },
                    { label: "Video", value: videoOn ? "On" : "Off", accent: videoOn, danger: !videoOn },
                    { label: "Audio", value: micOn ? "On" : "Off", accent: micOn, danger: !micOn },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.03]">
                      <span className="text-xs text-white/50">{item.label}</span>
                      <span className={`text-xs font-medium ${
                        item.accent ? "text-[#FC6C26]" : item.danger ? "text-red-400" : item.mono ? "text-white/70 font-mono" : "text-white/70"
                      }`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-5">
                  <h3 className="text-sm font-semibold text-[#FFF4D6]/80 mb-4">Participants ({participantCount})</h3>
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.03]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FC6C26] to-[#E05A1A] flex items-center justify-center text-xs font-semibold">
                      {user?.fullName?.charAt(0)?.toUpperCase() || "Y"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{user?.fullName || "You"}</p>
                      <p className="text-[11px] text-white/40">Host</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM TOOLBAR */}
      <div className="h-16 md:h-20 bg-[#0a0a0f]/80 backdrop-blur-xl border-t border-white/[0.04] flex items-center justify-center px-4 shrink-0">
        <div className="flex items-center gap-2 md:gap-3 bg-[#0d0d14] rounded-xl p-1.5 md:p-2 border border-white/[0.06] shadow-xl overflow-x-auto max-w-full">
          {/* MIC BUTTON */}
          <button
            onClick={toggleMic}
            className={`relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              micOn
                ? "bg-white/[0.06] hover:bg-white/[0.10] text-white/80"
                : "bg-red-500/15 hover:bg-red-500/25 text-red-400"
            }`}
            title={micOn ? "Mute" : "Unmute"}
          >
            {micOn ? <Mic className="w-4 h-4 md:w-5 md:h-5" /> : <MicOff className="w-4 h-4 md:w-5 md:h-5" />}
            {micOn && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FC6C26]/0 to-[#FC6C26]/5 opacity-0 hover:opacity-100 transition-opacity" />
            )}
          </button>

          {/* VIDEO BUTTON */}
          <button
            onClick={toggleVideo}
            className={`relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              videoOn
                ? "bg-white/[0.06] hover:bg-white/[0.10] text-white/80"
                : "bg-red-500/15 hover:bg-red-500/25 text-red-400"
            }`}
            title={videoOn ? "Stop Video" : "Start Video"}
          >
            {videoOn ? <Video className="w-4 h-4 md:w-5 md:h-5" /> : <VideoOff className="w-4 h-4 md:w-5 md:h-5" />}
          </button>

          {/* SEPARATOR */}
          <div className="w-px h-6 md:h-8 bg-white/[0.06] mx-1 md:mx-2 shrink-0" />

          {/* LEAVE BUTTON */}
          <button
            onClick={leaveMeeting}
            className="px-4 md:px-6 h-10 md:h-12 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold transition-all flex items-center gap-2 text-xs md:text-sm border border-red-500/10 hover:border-red-500/20 shrink-0"
          >
            <PhoneOff className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Leave</span>
          </button>

          {/* SEPARATOR */}
          <div className="w-px h-6 md:h-8 bg-white/[0.06] mx-1 md:mx-2 shrink-0" />

          {/* Settings */}
          <button className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-white/60 hover:text-white/80 transition-all flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* Chat (mobile/tablet) */}
          <button
            onClick={() => setSidePanelOpen(!sidePanelOpen)}
            className="lg:hidden w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-white/60 hover:text-white/80 transition-all flex items-center justify-center shrink-0"
          >
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* ERROR MODAL */}
      <AnimatePresence>
        {error && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#0d0d14] border border-white/[0.08] rounded-2xl max-w-md w-full p-8 shadow-2xl shadow-black/50"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white/90">Connection Error</h2>
                  <p className="text-xs text-white/40">Something went wrong with your meeting</p>
                </div>
              </div>
              <p className="text-sm text-white/60 mb-8 leading-relaxed bg-white/[0.03] p-4 rounded-xl border border-white/[0.04]">
                {error}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FC6C26] to-[#E05A1A] text-white font-semibold text-sm hover:shadow-lg hover:shadow-[#FC6C26]/20 transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={leaveMeeting}
                  className="px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-white/70 font-medium text-sm transition-all border border-white/[0.06]"
                >
                  Leave
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MeetingRoom;

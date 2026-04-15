import { useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";
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

  const getDisplayEmail = (participant) => {
    if (!participant || typeof participant === "string") return null;
    return participant.email || null;
  };

  const hostDisplayName = getDisplayName(meetingInfo?.bookingInfo?.host, "Host");
  const guestDisplayName = getDisplayName(meetingInfo?.bookingInfo?.guest, "Guest");
  const hostEmail = getDisplayEmail(meetingInfo?.bookingInfo?.host);
  const guestEmail = getDisplayEmail(meetingInfo?.bookingInfo?.guest);

  const isCurrentUserHost = user && meetingInfo?.bookingInfo?.host?.id
    ? String(user?._id || user?.id) === String(meetingInfo.bookingInfo.host.id)
    : false;

  const hasRemoteParticipants = remoteStreams.length > 0;
  const videoGridCols = hasRemoteParticipants
    ? remoteStreams.length > 2
      ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
      : "grid-cols-1 lg:grid-cols-2"
    : "grid-cols-1";
  const localVideoShell = hasRemoteParticipants
    ? "group relative w-full overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/60 shadow-lg"
    : "group relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/60 shadow-lg";
  const statusLower = (status || "").toLowerCase();
  const statusColor =
    error || statusLower.includes("failed") || statusLower.includes("error")
      ? "bg-red-400"
      : statusLower.includes("reconnect") || statusLower.includes("waiting") || statusLower.includes("not yet open")
        ? "bg-amber-400"
        : statusLower.includes("ended")
          ? "bg-slate-500"
          : "bg-emerald-400";
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

  // Log browser info for debugging
  useEffect(() => {
    console.log("Browser info:", {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    });
  }, []);

  // 🔹 Load meeting info
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

    if (accessStartMs && now < accessStartMs) {
      endSession();
      const friendlyStart = new Date(accessStartMs).toLocaleString();
      setStatus("Meeting not yet open");
      setError(`You can join once the meeting opens at ${friendlyStart}.`);
      startTimeout = setTimeout(() => {
        setError("");
        setStatus("Initializing...");
        setCanStart(true);
        startTimerRef.current = null;
      }, accessStartMs - now);
      startTimerRef.current = startTimeout;
    } else {
      setError((prev) => (prev && prev.includes("meeting opens at") ? "" : prev));
      setCanStart(true);
    }

    return () => {
      if (startTimeout) clearTimeout(startTimeout);
      if (startTimeout && startTimerRef.current === startTimeout) {
        startTimerRef.current = null;
      }
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

    return () => {
      clearTimeout(timeout);
      if (endTimerRef.current === timeout) {
        endTimerRef.current = null;
      }
    };
  }, [meetingInfo, parseTimestamp, resetMediaState, teardownConnections]);

  // 🔹 Initialize camera + socket + WebRTC
  useEffect(() => {
    if (!roomId || !meetingInfo || !canStart || hasStartedRef.current) {
      return;
    }

    let mounted = true;
    hasStartedRef.current = true;

    const start = async () => {
      try {
        // Check if mediaDevices is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          // Try to provide helpful guidance based on the issue
          let guidance = "Your browser doesn't support camera/microphone access. ";

          if (window.location.protocol === 'https:' && window.location.hostname !== 'localhost') {
            guidance += "Camera access requires HTTPS. Please access the site via https:// or use localhost for testing.";
          } else {
            guidance += "Please use a modern browser like Chrome (version 53+), Firefox (version 36+), or Edge (version 79+).";
          }

          throw new Error(guidance);
        }

        setStatus("Requesting camera and microphone access...");
        // 🎥 Get local stream
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        if (!mounted) return;

    setStatus("Camera access granted. Connecting to meeting...");
    setStream(localStream);
    streamRef.current = localStream;
        if (userVideo.current) userVideo.current.srcObject = localStream;

        // 🌐 Connect to /meeting namespace on the backend server
        const socketUrl = getSocketUrl();
        const meetingNamespaceUrl = socketUrl
          ? `${socketUrl}/meeting`
          : `/meeting`; // relative URL for dev (Vite proxy)
        const isNetworkIP = !['localhost', '127.0.0.1'].includes(window.location.hostname);
        const useSecure = window.location.protocol === 'https:';

        // For production (Vercel), use websocket transport
        // For development with network IPs, prioritize polling for certificate tolerance
        const transportOrder = import.meta.env.DEV && isNetworkIP ? ['polling'] : ['websocket', 'polling'];

        socketRef.current = io(
          meetingNamespaceUrl,
          {
            transports: transportOrder,
            upgrade: !import.meta.env.DEV || !isNetworkIP, // Allow upgrade in production
            rememberUpgrade: false,
            secure: useSecure,
            rejectUnauthorized: false, // Note: browsers still validate certificates, this only affects Node.js
            timeout: 45000, // 45 second timeout for mobile/slow networks
            reconnection: true,
            reconnectionDelay: 3000,
            reconnectionDelayMax: 15000,
            reconnectionAttempts: 5,
            autoConnect: true,
            forceNew: isNetworkIP && import.meta.env.DEV, // Force new connection for network IPs in dev only
            withCredentials: false,
            // Additional options for better mobile support
            path: '/socket.io/',
          }
        );

        socketRef.current.on("connect", () => {
          console.log("🎥 Connected to meeting namespace:", socketRef.current.id);
          console.log("📡 Transport:", socketRef.current.io?.engine?.transport?.name);
          setStatus("Connected. Joining room...");
          socketRef.current.emit("join_meeting_room", roomId);
        });

        socketRef.current.on("connect_error", (err) => {
          console.error("Socket connection error:", err);
          const errorDetails = {
            message: err.message,
            type: err.type,
            description: err.description,
            url: `/meeting`,
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            transport: socketRef.current?.io?.engine?.transport?.name,
          };
          console.error("Error details:", errorDetails);

          // Provide helpful error message for certificate issues
          let errorMsg = `Failed to connect to meeting server. `;

          if (err.message.includes('xhr poll error') ||
              err.message.includes('NetworkError') ||
              err.message.includes('Failed to fetch')) {
            if (isNetworkIP && useSecure) {
              errorMsg += `This may be a certificate mismatch issue. `;
              errorMsg += `Try visiting the site directly in your browser first to accept the certificate, then refresh this page.`;
            } else {
              errorMsg += `Error: ${err.message}. Please check if the backend server is running and accessible.`;
            }
          } else {
            errorMsg += `Error: ${err.message}`;
          }

          setError(errorMsg);
          setStatus("Connection failed");
        });

        socketRef.current.on("disconnect", (reason) => {
          console.warn("Socket disconnected:", reason);
          if (reason === 'io server disconnect') {
            // Server disconnected, try to reconnect
            socketRef.current.connect();
          }
        });

        socketRef.current.on("reconnect_attempt", (attemptNumber) => {
          console.log(`🔄 Reconnection attempt ${attemptNumber}`);
          setStatus(`Reconnecting... (attempt ${attemptNumber})`);
        });

        socketRef.current.on("reconnect_failed", () => {
          console.error("❌ Reconnection failed");
          setError("Failed to reconnect to meeting server. Please refresh the page.");
          setStatus("Connection failed");
        });

        // 🎭 Receive role (initiator or receiver)
        socketRef.current.on("meeting_role", ({ initiator }) => {
          console.log("🎭 Role:", initiator ? "Initiator" : "Receiver");
          setStatus(initiator ? "Setting up connection..." : "Waiting for other participant...");
          const peer = new Peer({
            initiator,
            trickle: true,
            stream: localStream,
          });

          // Send signaling data to backend
          peer.on("signal", (signal) => {
            socketRef.current.emit("signal", {
              roomId,
              signal,
              sender: socketRef.current.id,
            });
          });

          // When remote stream arrives
          peer.on("stream", (remoteStream) => {
            console.log("📡 Received remote stream");
            setStatus("Connected!");
            setRemoteStreams((prev) => [...prev, remoteStream]);
          });

          peer.on("error", (err) => {
            console.error("Peer connection error:", err);
            setError("Peer connection failed: " + err.message);
          });

          peersRef.current.push(peer);
        });

        // 👥 Peer is ready to connect (second user joined)
        socketRef.current.on("peer_ready", () => {
          console.log("👥 Peer is ready for signaling");
        });

        // 🔁 Receive WebRTC signaling from backend
        socketRef.current.on("signal", ({ signal, sender }) => {
          console.log("📨 Received signal from:", sender);
          const peer = peersRef.current[0];
          if (peer) {
            try {
              peer.signal(signal);
            } catch (err) {
              console.error("peer.signal error:", err);
            }
          }
        });

        // 🚪 Handle full room
        socketRef.current.on("room_full", () => {
          setError("Room is full! Only two participants allowed.");
          setStatus("Room full");
        });
      } catch (err) {
        console.error("Meeting initialization failed:", err);
        let errorMessage = "Failed to initialize meeting. ";

        if (err.name === "NotAllowedError") {
          errorMessage = "Camera/microphone access denied. Please allow permissions and refresh.";
        } else if (err.name === "NotFoundError") {
          errorMessage = "No camera or microphone found. Please connect a device and refresh.";
        } else if (err.name === "NotReadableError") {
          errorMessage = "Camera/microphone is already in use by another application.";
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setStatus("Error");
        resetMediaState();
        hasStartedRef.current = false;
      }
    };
    start();

    // 🔹 Cleanup when leaving page
    return () => {
      mounted = false;
      hasStartedRef.current = false;
      teardownConnections();
      resetMediaState();
    };
  }, [roomId, meetingInfo, canStart, resetMediaState, teardownConnections]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-4 py-10 sm:px-8">
      <header className="flex flex-col items-center gap-2 text-center">
  <span className="text-xs uppercase tracking-[0.35em] text-slate-400">
    Meeting Room
  </span>

  {meetingInfo && (
    <div className="flex flex-col items-center gap-1 text-sm sm:text-base text-slate-200">
      <p className="font-semibold">
        <span className="text-white font-bold">{hostDisplayName}</span>
        <span className="mx-2 text-slate-400 font-medium">meeting with</span>
        <span className="text-white font-bold">{guestDisplayName}</span>
      </p>

      {(hostEmail || guestEmail) && (
        <p className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-slate-400 font-medium">
          {hostEmail ? <span className="font-semibold text-slate-300">Host:</span> : null}{" "}
          {hostEmail ? hostEmail : null}
          {hostEmail && guestEmail ? "  •  " : ""}
          {guestEmail ? (
            <>
              <span className="font-semibold text-slate-300"> Guest:</span> {guestEmail}
            </>
          ) : null}
        </p>
      )}
    </div>
  )}
</header>


        <section className="grid gap-6 lg:grid-cols-[2fr,1fr] xl:gap-8">
          <div className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-2xl backdrop-blur sm:p-6">
            <div className={`grid gap-5 ${videoGridCols}`}>
              <div className={`${localVideoShell} aspect-[4/3] sm:aspect-[16/9] min-h-[220px] sm:min-h-[260px] max-h-[55vh] sm:max-h-[62vh] lg:max-h-[68vh]`}>
                <video
                  ref={userVideo}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50 text-sm text-slate-300">
                    Waiting for camera access...
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 pb-5 pt-14">
                  <p className="text-sm font-semibold text-white">You</p>
                  <p className="text-xs text-slate-300">{stream ? (isMicOn ? "Microphone active" : "Microphone muted") : "Requesting media permissions"}</p>
                </div>
              </div>

              {remoteStreams.map((remoteStream, i) => {
                const isRemoteVideoActive = remoteStream.getVideoTracks().some(
                  (track) => track.readyState === "live" && track.enabled
                );
                return (
                  <div
                    key={i}
                    className="group relative aspect-[4/3] sm:aspect-[16/9] min-h-[200px] sm:min-h-[220px] max-h-[45vh] sm:max-h-[55vh] lg:max-h-[60vh] xl:max-h-[68vh] overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/60 shadow-lg"
                  >
                    {!isRemoteVideoActive && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-950/70 text-sm text-slate-300">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-lg font-medium">
                          {`P${i + 1}`}
                        </div>
                        <span className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Video off</span>
                      </div>
                    )}
                    <video
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover"
                      ref={(videoEl) => {
                        if (videoEl) videoEl.srcObject = remoteStream;
                      }}
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-5 pb-5 pt-14">
                      <p className="text-sm font-semibold text-white">
                        {remoteStreams.length === 1
                          ? (isCurrentUserHost ? guestDisplayName : hostDisplayName)
                          : `Participant ${i + 1}`}
                      </p>
                      <p className="text-xs text-slate-300">Connected</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {!hasRemoteParticipants && stream && !error && (
              <div className="mx-auto mt-5 w-full max-w-2xl rounded-xl border border-slate-800/80 bg-slate-900/80 p-5 text-center text-sm text-slate-200">
                Share this room link to bring someone into the room. The layout seamlessly adapts once a participant joins.
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
              <button
                type="button"
                onClick={handleToggleMic}
                disabled={!stream}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  isMicOn && stream
                    ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                    : "bg-slate-800/80 text-slate-200 hover:bg-slate-800"
                } ${stream ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  {isMicOn && stream ? (
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 3c-1.105 0-2 .895-2 2v6c0 1.105.895 2 2 2s2-.895 2-2V5c0-1.105-.895-2-2-2z" />
                      <path d="M6 11a6 6 0 0 0 12 0" />
                      <path d="M12 17v4" />
                      <path d="M9 21h6" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
                      <path d="M15 10v-5a3 3 0 0 0-5.73-1" />
                      <path d="M9 11v-4" />
                      <path d="M12 17v4" />
                      <path d="M7 21h10" />
                      <path d="M5 5l14 14" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6 11a6 6 0 0 0 10.06 4.24" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
                {isMicOn && stream ? "Mute" : "Unmute"}
              </button>

              <button
                type="button"
                onClick={handleToggleCamera}
                disabled={!stream}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  isCameraOn && stream
                    ? "bg-sky-500/20 text-sky-300 hover:bg-sky-500/30"
                    : "bg-slate-800/80 text-slate-200 hover:bg-slate-800"
                } ${stream ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  {isCameraOn && stream ? (
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 7a3 3 0 0 1 3-3h5a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" />
                      <path d="M16 10l4-3v10l-4-3z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
                      <path d="M7 7a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v5" />
                      <path d="M5 5l14 14" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M7 15v2a3 3 0 0 0 3 3h5a3 3 0 0 0 2.47-1.3" />
                      <path d="M16 10l3-2v6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {isCameraOn && stream ? "Turn camera off" : "Turn camera on"}
              </button>

              <button
                type="button"
                onClick={handleLeaveCall}
                className="inline-flex items-center gap-2 rounded-full bg-red-500/80 px-4 py-2 font-medium text-red-50 transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400/60 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 13c0-4.418 3.582-8 8-8s8 3.582 8 8" strokeLinecap="round" />
                    <path d="M4 15l2.5-.833a2 2 0 0 1 1.9.416l2.7 2.417a2 2 0 0 0 1.3.5h1.2a2 2 0 0 0 1.3-.5l2.7-2.417a2 2 0 0 1 1.9-.416L20 15" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Leave call
              </button>

              {canShare && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.share({
                        title: "Join my meeting",
                        text: "Tap to join the meeting",
                        url: window.location.href,
                      });
                    } catch (shareError) {
                      console.error("Share cancelled", shareError);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-4 py-2 font-medium text-slate-200 transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/60 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 5l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 18h5a4 4 0 0 0 4-4V9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  Share invite
                </button>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-2.5 w-2.5 rounded-full ${statusColor}`} />
                <p className="text-sm font-medium text-slate-200">{status}</p>
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.35em] text-slate-500">Participants</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {hasRemoteParticipants ? remoteStreams.length + 1 : 1} active
              </p>
              {meetingInfo && (
                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <p>
                    <span className="text-slate-400">Host:</span> {hostDisplayName}
                    {hostEmail && <span className="text-slate-500"> ({hostEmail})</span>}
                  </p>
                  <p>
                    <span className="text-slate-400">Guest:</span> {guestDisplayName}
                    {guestEmail && <span className="text-slate-500"> ({guestEmail})</span>}
                  </p>
                  {meetingInfo.bookingInfo?.scheduledFor && (
                    <p>
                      <span className="text-slate-400">Scheduled:</span> {new Date(meetingInfo.bookingInfo.scheduledFor).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-200 shadow-2xl">
                <p className="text-base font-semibold text-red-100">Connection issue</p>
                <p className="mt-2 leading-relaxed">{error}</p>
                <div className="mt-4 text-left text-xs text-red-100/80">
                  <p className="font-semibold uppercase tracking-[0.25em] text-red-200">Troubleshooting</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Ensure you're using Chrome 53+, Firefox 36+, or Edge 79+</li>
                    <li>Check that your camera and microphone are connected and working</li>
                    <li>Close other applications that might be using your camera</li>
                    <li>Try accessing via localhost if testing locally</li>
                    <li>Visit the backend URL directly to accept the certificate if prompted</li>
                  </ul>
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>
    </div>
  );
};

export default MeetingRoom;
// src/components/MeetingRoom.jsx
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PhoneOff, 
  Users, 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  AlertCircle,
  Video as VideoIcon
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

  const peerRef = useRef();
  const socketRef = useRef(null);
  const myVideo = useRef();
  const userVideo = useRef();

  // Attach remote stream to video element after React renders it
  useEffect(() => {
    if (userVideo.current && remoteStream) {
      userVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Attach local stream to video element after React renders it
  useEffect(() => {
    if (myVideo.current && stream) {
      myVideo.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    let mounted = true;
    let peerConnection = null;
    let socket = null;
    let localStream = null;

    const STUN_SERVERS = [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
    ];

    // Declare createPeerConnection first so event handlers can reference it
    const createPeerConnection = async (shouldMakeOffer) => {
      if (peerConnection) return peerConnection;

      peerConnection = new RTCPeerConnection({
        iceServers: STUN_SERVERS
      });
      console.log('🔌 PC created', shouldMakeOffer ? '(initiator)' : '(responder)');

      if (localStream) {
        const tracks = localStream.getTracks();
        console.log(`Adding ${tracks.length} local tracks to PC`);
        tracks.forEach(track => {
          peerConnection.addTrack(track, localStream);
        });
      } else {
        console.warn('⚠️ No local stream to add to PC - media unavailable');
      }

      peerConnection.ontrack = (event) => {
        console.log('✅ ontrack:', event.track.kind, 'streams:', event.streams.length);
        if (event.streams.length > 0 && mounted) {
          setRemoteStream(event.streams[0]);
          setStatus("Session Live");
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice_candidate', {
            roomId,
            candidate: event.candidate
          });
        }
      };

      peerConnection.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          console.log('✨ WebRTC fully connected');
        }
        if (peerConnection.connectionState === 'failed' && mounted) {
          setError('WebRTC connection failed - trying to reconnect');
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log('❄️ ICE state:', peerConnection.iceConnectionState);
      };

      if (shouldMakeOffer) {
        try {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          console.log('📤 Sending offer');
          if (socket) socket.emit('webrtc_offer', { roomId, offer });
        } catch (err) {
          console.error('❌ Error creating offer:', err.message);
        }
      }

      peerRef.current = peerConnection;
      return peerConnection;
    };

    const initMeeting = async () => {
      try {
        // 1. Fetch Meeting Data
        const res = await axiosInstance.get(`/meetings/${roomId}`);
        if (!mounted) return;
        setMeetingInfo(res.data);
        const data = res.data;

        // 2. Get Media Stream with fallbacks
        setStatus("Requesting camera/mic...");

        console.log(`🌐 Page protocol: ${window.location.protocol}`);
        const isSecure = window.location.protocol === 'https:' || 
                         window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
        if (!isSecure) {
          console.warn('🚫 HTTP detected - getUserMedia will be blocked');
          setMediaError("Camera/mic require HTTPS. Your connection is HTTP.");
        }

        const mediaConstraints = [
          { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true },
          { video: true, audio: true },
          { audio: true },
        ];
        console.log(`🎥 Requesting media (secure: ${isSecure})`);
        for (const constraints of mediaConstraints) {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
              localStream = await navigator.mediaDevices.getUserMedia(constraints);
              if (localStream) {
                console.log(`✅ Media acquired:`, localStream.getTracks().map(t => t.kind).join(', '));
                break;
              }
            } catch (mediaErr) {
              console.warn(`⚠️ Media failed:`, mediaErr.message);
            }
          } else {
            console.warn('❌ navigator.mediaDevices.getUserMedia not available');
          }
        }
        if (!mounted) return;

        if (localStream) {
          setStream(localStream);
          setStatus("Connecting...");
        } else {
          const noMediaMsg = !isSecure
            ? "Camera/mic require HTTPS. Open https://51.20.10.115 and accept the security warning."
            : "Camera/mic access denied. Click the camera icon in the address bar to allow permissions, then refresh.";
          setMediaError(noMediaMsg);
          setError(noMediaMsg);
        }

        // 3. Identity Logic — use actual user ID for unique peerId
        const currentUserId = String(user?._id || user?.id || 'anon');
        const myPeerId = `${roomId}-${currentUserId}`;

        console.log(`📡 Peer ID: ${myPeerId}`);

        // 4. Initialize Socket.IO Connection for Signaling
        socket = io(getSocketUrl(), {
          path: '/api/socket.io',
          transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('✅ Socket.IO connected for signaling');
          socket.emit('join_meeting', { roomId, userId: myPeerId });
          setStatus("Connecting...");
        });

        socket.on('user_joined', (data) => {
          console.log('👤 User joined:', data.userId);
          if (!peerConnection && data.userId !== myPeerId) {
            console.log('🔵 Initiating WebRTC as offerer');
            createPeerConnection(true);
          }
        });

        socket.on('webrtc_offer', async (data) => {
          console.log('📥 Received offer');
          try {
            if (!peerConnection) {
              await createPeerConnection(false);
            }
            if (!peerConnection) return;

            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            console.log('📤 Sending answer');
            socket.emit('webrtc_answer', { roomId, answer });
          } catch (err) {
            console.error('❌ Error handling offer:', err.message);
          }
        });

        socket.on('webrtc_answer', async (data) => {
          console.log('📥 Received answer');
          try {
            if (!peerConnection) return;
            if (peerConnection.signalingState !== 'have-local-offer') {
              console.warn('⚠️ Wrong state for answer:', peerConnection.signalingState);
              return;
            }

            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log('✅ Remote description set from answer');
          } catch (err) {
            console.error('❌ Error handling answer:', err.message);
          }
        });

        socket.on('ice_candidate', async (data) => {
          try {
            if (peerConnection && data.candidate) {
              await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        });

        socket.on('error', (error) => {
          if (mounted) setError(`Connection error: ${error}`);
        });

      } catch (err) {
        console.error('❌ Meeting init error:', err);
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

  return (
    <div className="min-h-screen bg-[#1a1a1f] text-white flex flex-col">
      
      {/* TOP BAR - Meeting Info */}
      <div className="h-14 bg-[#0f0f12] border-b border-white/5 flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <VideoIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">NexGen Meeting</h1>
            <p className="text-xs text-gray-400">{roomId?.slice(0, 8)}...</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            remoteStream 
              ? 'bg-green-500/10 text-green-400' 
              : 'bg-yellow-500/10 text-yellow-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${remoteStream ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
            {status}
          </div>
          <button onClick={leaveMeeting} className="text-gray-400 hover:text-white transition-colors p-1">
            <span className="text-xs">✕</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* VIDEO CONTAINER */}
        <div className="flex-1 bg-black flex flex-col relative">
          
          {/* REMOTE VIDEO (Full screen) */}
          <div className="flex-1 relative bg-black overflow-hidden">
            {remoteStream ? (
              <video 
                ref={userVideo} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border-2 border-white/10">
                  <Users className="w-12 h-12 text-white/20" />
                </div>
                <h2 className="text-2xl font-semibold text-white/60">Waiting for participant...</h2>
                <p className="text-sm text-white/30 mt-2">They will appear here when they join</p>
                {mediaError && (
                  <p className="text-xs text-red-400/70 mt-3 max-w-sm text-center">{mediaError}</p>
                )}
              </div>
            )}

            {/* PARTICIPANT NAME OVERLAY */}
            {remoteStream && (
              <div className="absolute top-6 left-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                <p className="text-sm font-medium">Participant</p>
              </div>
            )}

            {/* CONNECTION STATUS */}
            <div className="absolute bottom-6 right-6 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg text-xs text-green-400">
              Connected
            </div>
          </div>

          {/* LOCAL VIDEO - Picture in Picture */}
          <div className="absolute bottom-20 right-6 w-48 h-36 rounded-lg overflow-hidden border-2 border-white/10 shadow-2xl bg-black">
            <video 
              ref={myVideo} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-xs font-medium">
              You
            </div>

            {/* MIC/CAMERA STATUS IN PIP */}
            <div className="absolute top-2 right-2 flex gap-1">
              {!micOn && (
                <div className="p-1.5 bg-red-500 rounded">
                  <MicOff className="w-3 h-3" />
                </div>
              )}
              {!videoOn && (
                <div className="p-1.5 bg-red-500 rounded">
                  <VideoOff className="w-3 h-3" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SIDE PANEL - Meeting Details (Optional, hidden on mobile) */}
        <div className="hidden lg:flex flex-col w-80 bg-[#0f0f12] border-l border-white/5">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-sm font-semibold mb-4">Meeting Details</h3>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-gray-400">Status</p>
                <p className="text-green-400 font-medium">Connected</p>
              </div>
              <div>
                <p className="text-gray-400">Video</p>
                <p className={videoOn ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                  {videoOn ? 'On' : 'Off'}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Audio</p>
                <p className={micOn ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                  {micOn ? 'On' : 'Off'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-sm font-semibold mb-4">Participants</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded hover:bg-white/5">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm">You</span>
              </div>
              {remoteStream && (
                <div className="flex items-center gap-2 p-2 rounded hover:bg-white/5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Participant</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM TOOLBAR */}
      <div className="h-24 bg-[#0f0f12] border-t border-white/5 flex items-center justify-center px-6">
        <div className="flex items-center gap-3 bg-[#1a1a1f] rounded-full p-2 border border-white/5">
          
          {/* MIC BUTTON */}
          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all font-medium text-sm ${
              micOn
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
            }`}
            title={micOn ? 'Mute' : 'Unmute'}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* VIDEO BUTTON */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all font-medium text-sm ${
              videoOn
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
            }`}
            title={videoOn ? 'Stop Video' : 'Start Video'}
          >
            {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* SEPARATOR */}
          <div className="w-px h-6 bg-white/10 mx-2"></div>

          {/* LEAVE BUTTON */}
          <button
            onClick={leaveMeeting}
            className="px-6 h-12 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold transition-all flex items-center gap-2 text-sm"
          >
            <PhoneOff className="w-5 h-5" />
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* ERROR MODAL */}
      <AnimatePresence>
        {error && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1a1a1f] border border-white/10 rounded-xl max-w-md w-full p-8">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <h2 className="text-lg font-semibold">Connection Error</h2>
              </div>
              <p className="text-sm text-gray-300 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};



export default MeetingRoom;
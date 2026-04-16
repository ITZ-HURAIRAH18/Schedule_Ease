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
  
  const peerRef = useRef();
  const myVideo = useRef();
  const userVideo = useRef();

  useEffect(() => {
    let mounted = true;

    const loadPeerJS = () => {
      return new Promise((resolve, reject) => {
        if (window.Peer) return resolve(window.Peer);
        const script = document.createElement("script");
        script.src = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
        script.onload = () => resolve(window.Peer);
        script.onerror = () => reject(new Error("Failed to load PeerJS from CDN"));
        document.head.appendChild(script);
      });
    };

    const initMeeting = async () => {
      try {
        // 1. Load Meeting Data
        const res = await axiosInstance.get(`/meetings/${roomId}`);
        if (!mounted) return;
        setMeetingInfo(res.data);
        const data = res.data;

        // 2. Wait for PeerJS to load from CDN
        setStatus("Initializing WebRTC...");
        const PeerClass = await loadPeerJS();

        // 3. Get Media Stream
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) return;
        setStream(localStream);
        if (myVideo.current) myVideo.current.srcObject = localStream;

        // 4. Identity Logic
        const currentUserId = String(user?._id || user?.id);
        const isHost = currentUserId === String(data.bookingInfo.hostId);
        const myPeerId = isHost ? `${roomId}-host` : `${roomId}-guest`;
        const targetPeerId = isHost ? `${roomId}-guest` : `${roomId}-host`;

        console.log(`📡 Identity: ${isHost ? 'HOST' : 'GUEST'} | ID: ${myPeerId}`);

        const peer = new PeerClass(myPeerId, {
          host: '0.peerjs.com',
          secure: true,
          port: 443
        });

        peer.on('open', (id) => {
          if (!mounted) return;
          console.log('✅ WebRTC Ready:', id);
          setStatus(isHost ? "Waiting for Guest..." : "Connecting to Host...");
          
          if (!isHost) {
            const connectInterval = setInterval(() => {
                if (mounted && !peerRef.current?.destroyed && !remoteStream) {
                    const call = peer.call(targetPeerId, localStream);
                    if (call) {
                        call.on('stream', (incoming) => {
                            setRemoteStream(incoming);
                            if (userVideo.current) userVideo.current.srcObject = incoming;
                            setStatus("Session Live");
                            clearInterval(connectInterval);
                        });
                    }
                } else {
                    clearInterval(connectInterval);
                }
            }, 5000);
          }
        });

        peer.on('call', (call) => {
          console.log("📞 Incoming Peer call");
          call.answer(localStream);
          call.on('stream', (incoming) => {
            if (!mounted) return;
            setRemoteStream(incoming);
            if (userVideo.current) userVideo.current.srcObject = incoming;
            setStatus("Session Live");
          });
        });

        peerRef.current = peer;

      } catch (err) {
        console.error(err);
        if (mounted) setError(err.message || "Failed to join room.");
      }
    };

    initMeeting();

    return () => {
      mounted = false;
      if (peerRef.current) peerRef.current.destroy();
      if (stream) stream.getTracks().forEach(t => t.stop());
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
    <div className="min-h-screen bg-[#0F0F12] text-white flex flex-col font-sans selection:bg-[#C8622A]/30">
      
      {/* Header */}
      <header className="px-8 py-5 flex justify-between items-center bg-black/40 backdrop-blur-2xl border-b border-white/5 z-50">
        <div className="flex items-center gap-5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#C8622A] to-[#E87E44] flex items-center justify-center shadow-2xl">
            <VideoIcon className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white/90">NexGen Pro Live</h1>
            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-black">Secure WebRTC Session</p>
          </div>
        </div>

        <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-[12px] font-bold border transition-all duration-300 ${
            remoteStream ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-xl' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
        }`}>
            <div className={`w-2 h-2 rounded-full ${remoteStream ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 animate-pulse'}`} />
            {status}
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 p-8 flex flex-col xl:flex-row gap-8 items-stretch justify-center max-w-[1800px] mx-auto w-full">
        {/* Main View */}
        <div className="relative flex-[3] min-h-[400px] bg-[#1A1A1E] rounded-[40px] overflow-hidden border border-white/5 shadow-2xl group">
          {remoteStream ? (
            <video ref={userVideo} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                 <Users className="w-10 h-10 text-white/10" />
              </div>
              <h2 className="text-2xl font-bold text-white/80">Connecting to Peer...</h2>
              <p className="text-sm text-white/30 max-w-sm mt-3">The session will start automatically when both parties are ready.</p>
            </div>
          )}
        </div>

        {/* Local View */}
        <div className="xl:w-[400px] flex flex-col gap-6">
            <div className="relative aspect-video xl:aspect-square bg-[#1A1A1E] rounded-[32px] overflow-hidden border-2 border-[#C8622A]/40 shadow-2xl">
                <video ref={myVideo} autoPlay muted playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-6 left-6 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl text-[10px] font-black uppercase border border-white/10">You</div>
                <div className="absolute top-6 right-6 flex flex-col gap-2">
                    {!micOn && <div className="p-2 bg-red-500 rounded-xl shadow-lg"><MicOff className="w-4 h-4" /></div>}
                    {!videoOn && <div className="p-2 bg-red-500 rounded-xl shadow-lg"><VideoOff className="w-4 h-4" /></div>}
                </div>
            </div>

            <div className="flex-1 bg-[#1A1A1E] rounded-[32px] border border-white/5 p-8 flex flex-col justify-center gap-4">
                <p className="text-[11px] font-black uppercase text-[#C8622A] tracking-widest">Hardware Check</p>
                <StatusRow label="Microphone" active={micOn} />
                <StatusRow label="Camera" active={videoOn} />
                <StatusRow label="Signal Server" active={true} />
            </div>
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="h-32 flex justify-center items-center gap-8 px-10">
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-2xl px-6 py-4 rounded-[32px] border border-white/10 shadow-2xl">
            <button onClick={toggleMic} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${micOn ? 'bg-white/5 hover:bg-white/10' : 'bg-red-500'}`}>
              {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>
            <button onClick={leaveMeeting} className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all">
                <PhoneOff className="w-5 h-5" />
                <span className="text-sm">Leave Session</span>
            </button>
            <button onClick={toggleVideo} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${videoOn ? 'bg-white/5 hover:bg-white/10' : 'bg-red-500'}`}>
              {videoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
        </div>
      </footer>

      {/* Error Overlay */}
      <AnimatePresence>
        {error && (
          <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-lg flex items-center justify-center p-8">
            <div className="bg-[#1A1A1E] p-12 rounded-[40px] border border-white/10 max-w-md w-full text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Relay Error</h2>
              <p className="text-white/40 text-sm mb-10">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="w-full py-5 bg-[#C8622A] rounded-2xl font-bold transition-all shadow-xl"
              >
                Reconnect
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatusRow = ({ label, active }) => (
    <div className="flex items-center justify-between">
        <span className="text-xs text-white/30 font-bold uppercase tracking-widest">{label}</span>
        <div className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
    </div>
);

export default MeetingRoom;
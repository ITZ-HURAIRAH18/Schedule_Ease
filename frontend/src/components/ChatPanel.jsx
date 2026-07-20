import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, FileText, Image, Download, X } from "lucide-react";
import axiosInstance from "../api/axiosInstance";

const ChatPanel = ({ roomId, socket, user, meetingInfo }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;
    axiosInstance.get(`/chat/${roomId}?limit=100`)
      .then((res) => setMessages(res.data.messages || []))
      .catch(() => {});
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      setMessages((prev) => [...prev, data]);
    };
    const ackHandler = (data) => {
      setMessages((prev) => [...prev, data]);
    };
    socket.on("chat_message", handler);
    socket.on("chat_message_ack", ackHandler);
    return () => {
      socket.off("chat_message", handler);
      socket.off("chat_message_ack", ackHandler);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !socket || !roomId) return;
    const payload = {
      roomId,
      message: text,
      senderId: user?._id || user?.id,
      senderName: user?.fullName || "You",
      senderRole: user?.role || "user",
      messageType: "text",
    };
    socket.emit("chat_message", payload);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !socket || !roomId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("roomId", roomId);
      const res = await axiosInstance.post("/chat/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { fileUrl, fileName, fileSize, fileType } = res.data;
      const payload = {
        roomId,
        message: "",
        senderId: user?._id || user?.id,
        senderName: user?.fullName || "You",
        senderRole: user?.role || "user",
        messageType: "file",
        fileUrl,
        fileName,
        fileSize,
        fileType,
      };
      socket.emit("chat_message", payload);
    } catch (err) {
      console.error("File upload error:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type) => {
    if (!type) return <FileText className="w-5 h-5" />;
    if (type.startsWith("image/")) return <Image className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const isOwn = (msg) => {
    const myId = String(user?._id || user?.id || "");
    const msgId = String(msg.senderId || "");
    return myId === msgId;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-white/30">No messages yet. Say hello!</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={msg._id || i} className={`flex ${isOwn(msg) ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
              isOwn(msg)
                ? "bg-[#FC6C26] text-white rounded-br-md"
                : "bg-white/[0.06] text-white/80 rounded-bl-md"
            }`}>
              {!isOwn(msg) && (
                <p className="text-[10px] font-medium text-[#FC6C26]/80 mb-1">{msg.senderName}</p>
              )}
              {msg.messageType === "file" ? (
                <div className="flex items-center gap-2">
                  {msg.fileType?.startsWith("image/") ? (
                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <img src={msg.fileUrl} alt={msg.fileName} className="max-w-[200px] max-h-[150px] rounded-lg object-cover" />
                    </a>
                  ) : (
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {getFileIcon(msg.fileType)}
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate max-w-[120px]">{msg.fileName}</p>
                        <p className="text-[10px] text-white/50">{formatFileSize(msg.fileSize)}</p>
                      </div>
                      <Download className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
              )}
              <p className={`text-[10px] mt-1 ${isOwn(msg) ? "text-white/60" : "text-white/40"}`}>
                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/[0.04] p-3 bg-[#0a0f1e]">
        <div className="flex items-center gap-2">
          <label className="relative cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <div className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors border border-white/[0.06]">
              {uploading ? (
                <div className="w-4 h-4 border-2 border-[#FC6C26] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4 text-white/50" />
              )}
            </div>
          </label>
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 text-sm text-white/80 placeholder-white/30 outline-none focus:border-[#FC6C26]/40 focus:bg-white/[0.06] transition-all"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !socket}
            className="p-2 rounded-lg bg-[#FC6C26] hover:bg-[#E05A1A] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;

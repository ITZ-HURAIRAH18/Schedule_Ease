import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ["host", "user", "admin"], default: "user" },
    message: { type: String, default: "" },
    messageType: { type: String, enum: ["text", "file"], default: "text" },
    fileUrl: { type: String, default: null },
    fileName: { type: String, default: null },
    fileSize: { type: Number, default: null },
    fileType: { type: String, default: null },
  },
  { timestamps: true }
);

chatMessageSchema.index({ roomId: 1, createdAt: 1 });

export default mongoose.model("ChatMessage", chatMessageSchema);

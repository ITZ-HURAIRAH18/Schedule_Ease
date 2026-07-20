import ChatMessage from "../models/ChatMessage.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const messages = await ChatMessage.find({ roomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ChatMessage.countDocuments({ roomId });

    res.json({
      messages: messages.reverse(),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { roomId } = req.body;
    const file = req.file;

    const fileUrl = `/uploads/${file.filename}`;

    res.json({
      fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Server error" });
  }
};

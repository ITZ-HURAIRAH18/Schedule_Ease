import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { getChatHistory, uploadFile } from "../controllers/chatController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = express.Router();

router.get("/:roomId", verifyToken, getChatHistory);
router.post("/upload", verifyToken, upload.single("file"), uploadFile);

export default router;

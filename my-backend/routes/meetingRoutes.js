import express from "express";
import { getMeetingByRoomId } from "../controllers/meetingController.js";

const router = express.Router();

router.get("/:roomId", getMeetingByRoomId);

export default router;

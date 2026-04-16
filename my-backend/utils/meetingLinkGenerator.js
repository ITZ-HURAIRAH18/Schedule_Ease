import axios from "axios";
import { v4 as uuidv4 } from "uuid";

/**
 * Creates a professional meeting link using Daily.co with Jitsi fallback.
 * @param {Object} booking - The booking document from MongoDB
 * @returns {Promise<string>} - Returns the generated meeting link
 */
export const generateProfessionalMeetingLink = async (booking) => {
  // 1. Ensure internal meetingRoom ID exists
  if (!booking.meetingRoom) {
    booking.meetingRoom = uuidv4();
  }

  // 2. Compute expiration (link expires when meeting ends + 1 hour buffer)
  const accessEnd = booking.accessEnd || booking.end;
  const expTimestamp = Math.floor(new Date(accessEnd).getTime() / 1000) + 3600;

  try {
    // Attempt Daily.co (Premium Experience)
    const response = await axios.post(
      "https://api.daily.co/v1/rooms",
      {
        name: `nexagen-${booking._id}-${Date.now()}`,
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          exp: expTimestamp,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );
    console.log("💎 Daily.co Room Created:", response.data.url);
    return response.data.url;
  } catch (dailyError) {
    console.warn("⚠️ Daily.co Failed, Falling back to Jitsi Meet...");
    // Fallback to Jitsi Meet
    const jitsiRoomId = `NexGen-${booking._id}-${Math.floor(Math.random() * 1000000)}`;
    const link = `https://meet.jit.si/${jitsiRoomId}`;
    console.log("🛠️ Jitsi Fallback Link Generated:", link);
    return link;
  }
};

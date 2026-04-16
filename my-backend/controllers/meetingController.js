// controllers/meetingController.js
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { generateProfessionalMeetingLink } from "../utils/meetingLinkGenerator.js";
import { sendDirectEmail } from "../utils/nodemail.js";

export const getMeetingByRoomId = async (req, res) => {
  try {
    const { roomId } = req.params;

    const booking = await Booking.findOne({
      meetingRoom: roomId,
      status: "confirmed",
    }).select(
      "guest start end duration bufferBefore bufferAfter accessStart accessEnd hostId meetingRoom meetingLink"
    );

    if (!booking) {
      const anyBooking = await Booking.findOne({ meetingRoom: roomId });
      if (anyBooking) {
        return res.status(403).json({ 
          message: `This meeting is currently ${anyBooking.status.toUpperCase()}. If it was rescheduled, please check your dashboard for the new link.`
        });
      }
      return res.status(404).json({ message: "Meeting room not found. Please verify the link from your dashboard." });
    }

    const hostId = booking.hostId ? booking.hostId.toString() : null;
    const host = hostId ? await User.findById(hostId).select("fullName email role") : null;
    const hostInfo = host ? { id: host._id?.toString(), name: host.fullName || host.email, email: host.email } : hostId ? { id: hostId, name: "Host" } : null;
    const guestInfo = booking.guest ? { name: booking.guest.name || "Guest", email: booking.guest.email || null } : null;

    const now = new Date();
    const accessStart = booking.accessStart || booking.start;
    const accessEnd = booking.accessEnd || booking.end;
    
    const gracePeriod = 10 * 60 * 1000; // 10 minutes grace
    const valid = now >= new Date(new Date(accessStart).getTime() - gracePeriod) && now <= new Date(accessEnd);

    // ✨ Auto-Activation: If the booking is "Live" but missing its link, create it now!
    if (valid && !booking.meetingLink) {
      console.log("⚡ Auto-activating room for:", roomId);
      booking.meetingLink = await generateProfessionalMeetingLink(booking);
      await booking.save();
    }

    return res.json({
      valid,
      roomId: booking.meetingRoom,
      meetingLink: booking.meetingLink,
      bookingInfo: { 
        guest: guestInfo, 
        host: hostInfo,
        hostId,
        start: booking.start,
        end: booking.end,
        accessStart,
        accessEnd,
      },
    });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    res.status(500).json({ message: "Server error" });
  }
};

let reminderJobStarted = false;
export const startMeetingReminderJob = () => {
  if (reminderJobStarted) return;
  reminderJobStarted = true;

  const ONE_MIN = 60 * 1000;
  setInterval(async () => {
    try {
      const now = new Date();
      const inFive = new Date(now.getTime() + 5 * 60 * 1000);
      const inSix = new Date(now.getTime() + 6 * 60 * 1000);

      const due = await Booking.find({
        status: "confirmed",
        start: { $gte: inFive, $lt: inSix },
        $or: [{ reminderSentToGuest: false }, { reminderSentToHost: false }],
      });

      if (!due.length) return;

      for (const b of due) {
        const startStr = new Date(b.start).toLocaleString();
        const joinUrl = b.meetingRoom ? `${process.env.FRONTEND_URL}/meeting/${b.meetingRoom}` : null;

        if (!b.reminderSentToGuest && b.guest?.email) {
          const html = `<h2>Meeting Reminder</h2><p>Your session starts soon: ${startStr}</p>${joinUrl ? `<a href="${joinUrl}">Join now</a>` : ""}`;
          await sendDirectEmail(b.guest.email, "Meeting in 5 minutes", html);
          b.reminderSentToGuest = true;
        }

        if (!b.reminderSentToHost) {
          const host = await User.findById(b.hostId);
          if (host?.email) {
            const html = `<h2>Host Reminder</h2><p>Your session starts soon: ${startStr}</p>${joinUrl ? `<a href="${joinUrl}">Join now</a>` : ""}`;
            await sendDirectEmail(host.email, "Meeting in 5 minutes", html);
            b.reminderSentToHost = true;
          }
        }
        await b.save();
      }
    } catch (err) {
      console.error("Reminder job error:", err.message);
    }
  }, ONE_MIN);
};

startMeetingReminderJob();

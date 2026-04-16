// // controllers/meetingController.js
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { sendDirectEmail } from "../utils/nodemail.js";

// export const getMeetingByRoomId = async (req, res) => {
//   try {
//     const { roomId } = req.params;
//     const booking = await Booking.findOne({ meetingRoom: roomId, status: "confirmed" });

//     if (!booking) return res.status(404).json({ message: "Meeting not found" });

//     res.json({
//       valid: true,
//       roomId: booking.meetingRoom,
//       bookingInfo: {
//         guest: booking.guest,
//         start: booking.start,
//         end: booking.end,
//         hostId: booking.hostId,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching meeting:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// controllers/meetingController.js
// controllers/meetingController.js
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
      return res.status(404).json({ message: "Meeting not found" });
    }

    const hostId = booking.hostId ? booking.hostId.toString() : null;

    const host = hostId
      ? await User.findById(hostId).select("fullName email role")
      : null;

    const hostInfo = host
      ? {
          id: host._id?.toString(),
          name: host.fullName || host.email || host._id?.toString() || hostId,
          email: host.email || null,
          role: host.role || null,
        }
      : hostId
      ? { id: hostId, name: hostId }
      : null;

    const guestInfo = booking.guest
      ? {
          name: booking.guest.name || null,
          email: booking.guest.email || null,
          phone: booking.guest.phone || null,
        }
      : null;

    const now = new Date();
    const accessStart = booking.accessStart || booking.start;
    const accessEnd = booking.accessEnd || booking.end;
    
    // Allow joining 5 seconds early to handle clock sync issues
    const gracePeriod = 5000; // 5 seconds in milliseconds
    const valid = now >= new Date(accessStart.getTime() - gracePeriod) && now <= accessEnd;

    // Debug logging
    console.log('Meeting Validation:', {
      roomId,
      now: now.toISOString(),
      accessStart: accessStart.toISOString(),
      accessEnd: accessEnd.toISOString(),
      accessStartWithGrace: new Date(accessStart.getTime() - gracePeriod).toISOString(),
      valid,
      nowTime: now.getTime(),
      accessStartTime: accessStart.getTime(),
      accessEndTime: accessEnd.getTime(),
    });

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
        duration: booking.duration,
        bufferBefore: booking.bufferBefore,
        bufferAfter: booking.bufferAfter,
        accessStart,
        accessEnd,
        meetingLink: booking.meetingLink,
      },
    });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// 🕒 EMAIL REMINDER JOB (every minute)
// ===============================
let reminderJobStarted = false;
export const startMeetingReminderJob = () => {
  if (reminderJobStarted) return; // prevent duplicate intervals on hot reload
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
      }).select(
        "hostId guest start end duration meetingRoom reminderSentToGuest reminderSentToHost"
      );

      if (!due.length) return;

      for (const b of due) {
        const startStr = new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(b.start));
        const joinUrl = b.meetingRoom
          ? `${process.env.FRONTEND_URL || "http://localhost:5173"}/meeting/${
              b.meetingRoom
            }`
          : null;

        if (!b.reminderSentToGuest && b.guest?.email) {
          const html = `
            <div style=\"font-family:Arial, sans-serif;\">
              <h2>Reminder: Your meeting starts in 5 minutes</h2>
              <p><strong>When:</strong> ${startStr}</p>
              ${joinUrl ? `<p><a href=\"${joinUrl}\">Join meeting</a></p>` : ""}
            </div>
          `;
          try {
            await sendDirectEmail(
              b.guest.email,
              "Reminder: Meeting in 5 minutes",
              html
            );
            b.reminderSentToGuest = true;
          } catch {}
        }

        if (!b.reminderSentToHost) {
          try {
            const host = await User.findById(b.hostId).select("email fullName");
            if (host?.email) {
              const html = `
                <div style=\"font-family:Arial, sans-serif;\">
                  <h2>Reminder: Your meeting starts in 5 minutes</h2>
                  <p><strong>When:</strong> ${startStr}</p>
                  ${
                    joinUrl
                      ? `<p><a href=\"${joinUrl}\">Open meeting room</a></p>`
                      : ""
                  }
                </div>
              `;
              await sendDirectEmail(
                host.email,
                "Reminder: Meeting in 5 minutes",
                html
              );
              b.reminderSentToHost = true;
            }
          } catch {}
        }

        await b.save();
      }
    } catch (err) {
      console.error("Reminder job error:", err.message || err);
    }
  }, ONE_MIN);
};

// auto-start on import
startMeetingReminderJob();

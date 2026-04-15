import mongoose from "mongoose";
import Availability from "../models/Availability.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { safeEmit, safeToEmit } from "../config/socket.js";
import { v4 as uuidv4 } from "uuid";



// 📊 Dashboard Overview
export const getHostDashboard = async (req, res) => {
  try {
    const hostId = req.user._id || req.user.id;

    const totalBookings = await Booking.countDocuments({ hostId });
    const now = new Date();

    const upcomingBookings = await Booking.countDocuments({
      hostId,
      status: "confirmed",
      start: { $gte: now }, // only future bookings
    });

    const pastBookings = await Booking.countDocuments({
      hostId,
      status: "confirmed",
      start: { $lt: now }, // already happened
    });

    const pendingBookings = await Booking.countDocuments({
      hostId,
      status: "pending",
    });
    const cancelledBookings = await Booking.countDocuments({
      hostId,
      status: "cancelled",
    });

    const recentBookings = await Booking.find({ hostId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("guest start end status duration createdAt meetingRoom");

    const availability = await Availability.findOne({ hostId });

    res.json({
      success: true,
      hostId,
      stats: {
        totalBookings,
        upcomingBookings,
        pendingBookings,
        cancelledBookings,
        pastBookings, // optional, if you want to show past confirmed
      },
      availability,
      recentBookings,
    });
  } catch (error) {
    console.error("Error fetching host dashboard:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const emitHostDashboardUpdate = async (hostId) => {
  console.log("Emitting dashboard update for host:", hostId);
  try {
    const now = new Date();

    const totalBookings = await Booking.countDocuments({ hostId });
    const upcomingBookings = await Booking.countDocuments({
      hostId,
      status: "confirmed",
      start: { $gte: now },
    });
    const pastBookings = await Booking.countDocuments({
      hostId,
      status: "confirmed",
      start: { $lt: now },
    });
    const pendingBookings = await Booking.countDocuments({
      hostId,
      status: "pending",
    });
    const cancelledBookings = await Booking.countDocuments({
      hostId,
      status: "cancelled",
    });

    const recentBookings = await Booking.find({ hostId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("guest start end status duration createdAt meetingRoom");

    const availability = await Availability.findOne({ hostId });

    safeToEmit(hostId.toString(), "host_dashboard_updated", {
      stats: {
        totalBookings,
        upcomingBookings,
        pendingBookings,
        cancelledBookings,
        pastBookings,
      },
      recentBookings,
      availability,
    });
  } catch (err) {
    console.error("Error emitting host dashboard update:", err);
  }
};
// 📅 All Bookings for this Host
export const getHostBookings = async (req, res) => {
  try {
    const hostId = req.user._id || req.user.id;

    // ✅ Find all bookings for this host and populate both user & availability info
    const bookings = await Booking.find({ hostId })
      .populate({
        path: "guest", // populate user who created the booking
        select: "name email",
      })
      .populate({
        path: "createdByUserId", // populate user who created the booking
        select: "fullName email",
      })
      .populate({
        path: "availabilityId", // populate availability data
        select: "timezone weekly bufferBefore bufferAfter maxPerDay",
      })
      .sort({ start: 1 })
      .select("createdByUserId start end status meetingLink availabilityId");

    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching host bookings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🕓 Get Host Availability
export const getMyAvailability = async (req, res) => {
  try {
    // ✅ Prefer token ID, but fallback to body or query if needed
    const hostId =
      req.user?._id || req.user?.id || req.body.hostId || req.query.hostId;

    if (!hostId) {
      return res
        .status(400)
        .json({ success: false, message: "Host ID missing" });
    }

    // ✅ Fetch availability for this host
    const availability = await Availability.find({ hostId });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "No availability found for this host",
      });
    }

    res.json({ success: true, availability });
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ➕ Add New Availability
export const addAvailability = async (req, res) => {
  try {
    // ✅ Try to get hostId from token first, otherwise use request body
    const hostId = req.user?._id || req.user?.id || req.body.hostId;

    if (!hostId) {
      return res
        .status(400)
        .json({ success: false, message: "Host ID missing" });
    }

    const {
      weekly,
      bufferBefore,
      bufferAfter,
      durations,
      maxPerDay,
      blockedDates,
      timezone,
    } = req.body;

    const newAvailability = await Availability.create({
      hostId,
      weekly,
      bufferBefore,
      bufferAfter,
      durations,
      maxPerDay,
      blockedDates,
      timezone,
    });

    res.status(201).json({ success: true, availability: newAvailability });
  } catch (error) {
    console.error("Error adding availability:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✏️ Update Availability by ID
export const updateAvailabilityById = async (req, res) => {
  try {
    const { id } = req.params; // get availability _id
    const hostId =
      req.user?._id || req.user?.id || req.body.hostId || req.query.hostId;

    const {
      weekly,
      bufferBefore,
      bufferAfter,
      durations,
      maxPerDay,
      blockedDates,
      timezone,
    } = req.body;

    const updated = await Availability.findOneAndUpdate(
      { _id: id, hostId }, // ensure host owns this availability
      {
        weekly,
        bufferBefore,
        bufferAfter,
        durations,
        maxPerDay,
        blockedDates,
        timezone,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Availability not found or not authorized.",
      });
    }

    res.json({ success: true, availability: updated });
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ❌ Delete Availability by ID
export const deleteAvailabilityById = async (req, res) => {
  try {
    const { id } = req.params; // get availability _id
    const hostId =
      req.user?._id || req.user?.id || req.body.hostId || req.query.hostId;

    const deleted = await Availability.findOneAndDelete({ _id: id, hostId });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Availability not found or not authorized.",
      });
    }

    res.json({ success: true, message: "Availability deleted successfully." });
  } catch (error) {
    console.error("Error deleting availability:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting availability.",
    });
  }
};

// ⚙️ Update Host Settings
export const updateHostSettings = async (req, res) => {
  try {
    const hostId = req.user._id;
    const { username, timezone } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      hostId,
      { username, timezone },
      { new: true }
    );

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating host settings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get single availability by ID
export const getAvailabilityById = async (req, res) => {
  try {
    const { id } = req.params;
    const availability = await Availability.findById(id); // assuming Mongoose model Availability
    if (!availability)
      return res.status(404).json({ message: "Availability not found" });
    res.json(availability);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// import axios from "axios";

// export const updateBookingStatus = async (req, res) => {
//   const bookingId = req.params.id;
//   const { status } = req.body;

//   const allowedStatuses = ["confirmed", "cancelled", "rescheduled", "pending"];
//   if (!allowedStatuses.includes(status)) {
//     return res.status(400).json({ message: "Invalid status value" });
//   }

//   if (!mongoose.Types.ObjectId.isValid(bookingId)) {
//     return res.status(400).json({ message: "Invalid booking ID" });
//   }

//   try {
//     const booking = await Booking.findById(bookingId);
//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     // Ensure host owns this booking
//     if (!req.user || booking.hostId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: "Not authorized" });
//     }

//     booking.status = status;

//     // 🟢 If confirmed → create Daily meeting
//     if (status === "confirmed") {
//       // get host's availability to know buffer time
//       const availability = await Availability.findOne({ hostId: booking.hostId });
//       const bufferBefore = availability?.bufferBefore || 0;
//       const bufferAfter = availability?.bufferAfter || 0;

//       const startTime = new Date(booking.start);
//       const endTime = new Date(booking.end);

//       // 🕒 Adjust window for allowed access
//       const startWithBuffer = new Date(startTime.getTime() - bufferBefore * 60000);
//       const endWithBuffer = new Date(endTime.getTime() + bufferAfter * 60000);

//       // ✅ Create Daily room (Free plan–safe)
//       const response = await axios.post(
//         "https://api.daily.co/v1/rooms",
//         {
//           name: `booking-${booking._id}`,
//           properties: {
//             max_participants: 15, // ✅ Allow up to 15 participants
//             enable_screenshare: true,
//             start_audio_off: true,
//             start_video_off: true,
//             // 🟡 Optional: comment these out if you still see "add a card"
//             exp: Math.floor(endWithBuffer.getTime() / 1000),
//             nbf: Math.floor(startWithBuffer.getTime() / 1000),
//           },
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       booking.meetingLink = response.data.url;
//     }

//     await booking.save();

//     res.json({
//       message:
//         status === "confirmed"
//           ? "Booking confirmed and meeting link generated."
//           : "Booking status updated successfully.",
//       booking,
//     });
//   } catch (err) {
//     console.error("Error updating booking status:", err.response?.data || err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// export const updateBookingStatus = async (req, res) => {
//   const bookingId = req.params.id;
//   const { status } = req.body;

//   const allowedStatuses = ["confirmed", "cancelled", "rescheduled", "pending"];
//   if (!allowedStatuses.includes(status)) {
//     return res.status(400).json({ message: "Invalid status value" });
//   }

//   if (!mongoose.Types.ObjectId.isValid(bookingId)) {
//     return res.status(400).json({ message: "Invalid booking ID" });
//   }

//   try {
//     const booking = await Booking.findById(bookingId);
//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     // Ensure host owns this booking
//     if (!req.user || booking.hostId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: "Not authorized" });
//     }

//     booking.status = status;
//     await booking.save();
//     await emitHostDashboardUpdate(booking.hostId);

//     res.json({ message: "Booking status updated successfully", booking });
//   } catch (err) {
//     console.error("Error updating booking status:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// controllers/bookingController.js




export const updateBookingStatus = async (req, res) => {
  const bookingId = req.params.id;
  const { status } = req.body;

  const allowedStatuses = ["confirmed", "cancelled", "rescheduled", "pending"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return res.status(400).json({ message: "Invalid booking ID" });
  }

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // ✅ Only host can confirm/cancel
    if (!req.user || booking.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = status;

    // ✅ On confirm: set meeting room and compute access window with buffers
    if (status === "confirmed") {
      if (!booking.meetingRoom) {
        booking.meetingRoom = uuidv4();
      }
      const startTime = new Date(booking.start);
      const endTime = new Date(booking.end);
      const beforeMin = Number(booking.bufferBefore || 0);
      const afterMin = Number(booking.bufferAfter || 0);
      booking.accessStart = new Date(startTime.getTime() - beforeMin * 60000);
      booking.accessEnd = new Date(endTime.getTime() + afterMin * 60000);
    }

    await booking.save();

    // ✅ Emit real-time update to clients (safely)
    try {
      safeEmit("booking_status_updated", {
        bookingId,
        status,
        meetingRoom: booking.meetingRoom,
      });
    } catch (socketError) {
      console.warn("⚠️ Socket emit failed (non-critical):", socketError.message);
    }

    // ✅ Update host dashboard
    await emitHostDashboardUpdate(booking.hostId);

    res.json({
      message: "Booking status updated successfully",
      booking,
      meetingLink: booking.meetingRoom ? `/meeting/${booking.meetingRoom}` : null,
    });
  } catch (err) {
    console.error("Error updating booking status:", err);
    res.status(500).json({ message: "Server error" });
  }
};


import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import Availability from "../models/Availability.js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { generateProfessionalMeetingLink } from "../utils/meetingLinkGenerator.js";

// Helper to safely emit socket events
const safeEmit = (event, data) => {
  if (global.io) {
    global.io.emit(event, data);
  }
};

export const emitHostDashboardUpdate = async (hostId) => {
  try {
    const stats = await getHostStats(hostId);
    const bookings = await Booking.find({ hostId })
      .sort({ start: -1 })
      .limit(10)
      .populate("createdByUserId", "fullName email");

    safeEmit(`host_update_${hostId}`, { stats, bookings });
  } catch (err) {
    console.warn("⚠️ Dashboard emit failed:", err.message);
  }
};

const getHostStats = async (hostId) => {
  const all = await Booking.find({ hostId });
  const now = new Date();
  return {
    total: all.length,
    upcoming: all.filter((b) => b.status === "confirmed" && new Date(b.start) > now).length,
    pending: all.filter((b) => b.status === "pending").length,
    cancelled: all.filter((b) => ["cancelled", "rejected"].includes(b.status)).length,
    past: all.filter((b) => new Date(b.end) < now).length,
  };
};

export const getHostDashboard = async (req, res) => {
  try {
    const hostId = req.user._id;
    const stats = await getHostStats(hostId);
    const recentBookings = await Booking.find({ hostId })
      .sort({ start: -1 })
      .limit(20)
      .populate("createdByUserId", "fullName email");

    res.json({
      success: true,
      stats,
      recentBookings: recentBookings.map((b) => ({
        _id: b._id,
        guest: {
          name: b.guest?.name || b.createdByUserId?.fullName || "Guest",
          email: b.guest?.email || b.createdByUserId?.email || "N/A",
        },
        start: b.start,
        end: b.end,
        status: b.status,
        meetingRoom: b.meetingRoom,
      })),
      hostId: hostId.toString(),
    });
  } catch (error) {
    console.error("Host Dashboard Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getHostBookings = async (req, res) => {
  try {
    const hostId = req.user._id;
    const bookings = await Booking.find({ hostId })
      .sort({ start: -1 })
      .populate("createdByUserId", "fullName email")
      .populate("availabilityId", "timezone");

    res.json({
      success: true,
      bookings: bookings.map((b) => ({
        _id: b._id,
        guest: {
          name: b.guest?.name || b.createdByUserId?.fullName || "Guest",
          email: b.guest?.email || b.createdByUserId?.email || "N/A",
        },
        start: b.start,
        end: b.end,
        status: b.status,
        meetingRoom: b.meetingRoom,
        meetingLink: b.meetingLink,
        createdByUserId: b.createdByUserId,
        availabilityId: b.availabilityId
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = status;

    if (status === "confirmed") {
        const startTime = new Date(booking.start);
        const endTime = new Date(booking.end);
        const beforeMin = Number(booking.bufferBefore || 10);
        const afterMin = Number(booking.bufferAfter || 10);
        booking.accessStart = new Date(startTime.getTime() - beforeMin * 60000);
        booking.accessEnd = new Date(endTime.getTime() + afterMin * 60000);

        if (!booking.meetingRoom) booking.meetingRoom = uuidv4();
        if (!booking.meetingLink) booking.meetingLink = await generateProfessionalMeetingLink(booking);
    }

    await booking.save();
    await emitHostDashboardUpdate(booking.hostId);

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// 🕓 Availability Management
export const getMyAvailability = async (req, res) => {
    try {
      const hostId = req.user._id;
      const availabilityList = await Availability.find({ hostId }).sort({ day: 1 });
      res.json({ success: true, availability: availabilityList });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
};

export const addAvailability = async (req, res) => {
    try {
      const hostId = req.user._id;
      const { day, slots, timezone } = req.body;
      const newAvail = new Availability({ hostId, day, slots, timezone });
      await newAvail.save();
      res.json({ success: true, availability: newAvail });
    } catch (err) {
      res.status(500).json({ message: "Failed to add availability" });
    }
};

export const updateAvailabilityById = async (req, res) => {
    try {
      const { id } = req.params;
      const { day, slots, timezone } = req.body;
      const updated = await Availability.findByIdAndUpdate(id, { day, slots, timezone }, { new: true });
      res.json({ success: true, availability: updated });
    } catch (err) {
      res.status(500).json({ message: "Failed to update availability" });
    }
};

export const deleteAvailabilityById = async (req, res) => {
    try {
      const { id } = req.params;
      await Availability.findByIdAndDelete(id);
      res.json({ success: true, message: "Availability deleted" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete" });
    }
};

export const getAvailabilityById = async (req, res) => {
    try {
      const { id } = req.params;
      const avail = await Availability.findById(id);
      res.json({ success: true, availability: avail });
    } catch (err) {
      res.status(404).json({ message: "Not found" });
    }
};

export const updateHostSettings = async (req, res) => {
    try {
      const hostId = req.user._id;
      const { fullName, bio } = req.body;
      const updatedUser = await User.findByIdAndUpdate(hostId, { fullName, bio }, { new: true });
      res.json({ success: true, user: updatedUser });
    } catch (err) {
      res.status(500).json({ message: "Failed to update settings" });
    }
};

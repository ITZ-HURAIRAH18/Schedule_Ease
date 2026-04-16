// controllers/adminController.js
import User from "../models/User.js";       // Your User model
import Booking from "../models/Booking.js"; // Your Booking model
// No socket import needed - admin controller doesn't emit events directly

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Suspend a user
export const suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.suspended = true; // example field
    await user.save();

    res.json({ message: "User suspended successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const unsuspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.suspended = false; // example field
    await user.save();

    res.json({ message: "User suspended successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Delete a user
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin stats
export const getStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const activeHosts = await User.countDocuments({ role: "host", active: true });

    const topHosts = await Booking.aggregate([
      { $group: { _id: "$hostId", totalBookings: { $sum: 1 } } },
      { $sort: { totalBookings: -1 } },
      { $limit: 5 },
      // Join with User collection to get host details
      {
        $lookup: {
          from: "users",          // collection name in MongoDB
          localField: "_id",      // hostId from Booking
          foreignField: "_id",    // _id in User collection
          as: "hostInfo"
        }
      },
      // Unwind the joined array
      { $unwind: "$hostInfo" },
      // Project only necessary fields
      {
        $project: {
          _id: 1,
          totalBookings: 1,
          fullName: "$hostInfo.fullName"
        }
      }
    ]);

    res.json({ totalBookings, activeHosts, topHosts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getDashboard = async (req, res) => {
  try {
    // Example dashboard data
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select("fullName email role createdAt");
//  const totalBookings = await Booking.countDocuments();
      //  io.emit("dashboard_updated", { totalUsers, totalBookings, recentUsers });
    res.json({
      totalUsers,
      totalBookings,
      recentUsers
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import sendEmail from "../utils/nodemail.js";
import {
  userWelcomeTemplate,
  adminNewUserTemplate,
} from "../emails/templates.js";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import { safeEmit } from "../config/socket.js";


const generateToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      name: user.fullName,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

// Email/Password Signup
export const signup = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    if (!fullName || !email || !password || !role)
      return res.status(400).json({ message: "All fields required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res
        .status(400)
        .json({ message: "Email already registered. Please login." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
    });
    
    // Emit dashboard update safely (won't crash if socket not ready)
    try {
      const totalUsers = await User.countDocuments();
      const totalBookings = await Booking.countDocuments();
      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("fullName email role");
      safeEmit("dashboard_updated", { totalUsers, totalBookings, recentUsers });
    } catch (socketError) {
      console.warn("⚠️ Socket emit failed (non-critical):", socketError.message);
    }

    res.json({
      success: true,
      message: "Signup successful. Please login now.",
    });

    // Send welcome email to user ONLY (with error handling)
    try {
      await sendEmail(
        newUser._id,
        "🎉 Welcome to Schedulr Ease!",
        userWelcomeTemplate(newUser),
        false
      );
    } catch (emailError) {
      console.error("⚠️ Failed to send welcome email:", emailError.message);
    }

    // Send new user alert to admin ONLY (with error handling)
    try {
      await sendEmail(
        newUser._id,
        "👤 New User Registered on Schedulr Ease",
        adminNewUserTemplate(newUser),
        true
      );
    } catch (emailError) {
      console.error("⚠️ Failed to send admin notification:", emailError.message);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Email/Password Login
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role)
      return res.status(400).json({ message: "All fields required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== role)
      return res.status(403).json({ message: `You cannot login as ${role}` });
    if (user.suspended)
      return res.status(403).json({
        message: "Your account has been suspended. Please contact support.",
      });
    if (user.isGoogleAccount)
      return res.status(400).json({ message: "Use Google Sign-In" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user);
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Google Signup
export const googleSignup = async (req, res) => {
  try {
    const { token, role } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, picture } = ticket.getPayload();

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res
        .status(400)
        .json({ message: "Account already exists. Please login." });

    const allowedRole = role === "host" ? "host" : "user";
    await User.create({
      fullName: name,
      email,
      profilePicture: picture,
      isGoogleAccount: true,
      role: allowedRole,
    });
    
    // Emit dashboard update safely
    try {
      const totalUsers = await User.countDocuments();
      const totalBookings = await Booking.countDocuments();
      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("fullName email role");
      safeEmit("dashboard_updated", { totalUsers, totalBookings, recentUsers });
    } catch (socketError) {
      console.warn("⚠️ Socket emit failed (non-critical):", socketError.message);
    }
    
    res.json({
      success: true,
      message: "Signup successful. Please login with Google.",
    });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Invalid Google token", error: err.message });
  }
};

// Google Login
export const googleLogin = async (req, res) => {
  try {
    const { token, role } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email } = ticket.getPayload();

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "No account found. Please signup first." });

    if (!user.isGoogleAccount)
      return res
        .status(400)
        .json({ message: "Use password login for this account." });
    if (user.suspended)
      return res.status(403).json({
        message: "Your account has been suspended. Please contact support.",
      });

    if (user.role !== role)
      return res.status(403).json({ message: `You cannot login as ${role}` });

    const authToken = generateToken(user);
    res.json({ success: true, token: authToken, user });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Invalid Google token", error: err.message });
  }
};

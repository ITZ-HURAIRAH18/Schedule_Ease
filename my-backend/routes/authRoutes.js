import express from "express";
import { signup, login, googleSignup, googleLogin, getMe, updateProfile } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

// Separate routes for Google signup and Google login
router.post("/google-signup", googleSignup);
router.post("/google-login", googleLogin);

// Profile routes
router.get("/me", verifyToken, getMe);
router.put("/update-profile", verifyToken, updateProfile);

export default router;

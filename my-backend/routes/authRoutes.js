import express from "express";
import { signup, login, googleSignup, googleLogin, getMe, updateProfile, uploadProfileImage } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { upload } from "../utils/s3Upload.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

// Separate routes for Google signup and Google login
router.post("/google-signup", googleSignup);
router.post("/google-login", googleLogin);

// Profile routes
router.get("/me", verifyToken, getMe);
router.put("/update-profile", verifyToken, updateProfile);
router.post("/upload-profile-image", verifyToken, upload.single("profileImage"), uploadProfileImage);

export default router;

import express from "express";
import {
  googleLogin,
  getCurrentUser,
  logout,
} from "./authController.js";

const router = express.Router();

// Google OAuth login
router.post("/google", googleLogin);

// Get current user (requires authentication)
router.get("/me", getCurrentUser);

// Logout
router.post("/logout", logout);

export default router;

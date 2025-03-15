import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware";
import {
  checkLogin,
  getServiceProviders,
  getUserById,
  updateProfile,
  addToWishlist,
  removeFromWishlist,
  addNotification,
  clearNotifications,
  readNotification,
  createSupportTicket,
  upload,
} from "../controller/profileController";

const router = express.Router();

router.get("/checkLogin", authenticateToken, checkLogin);
router.post(
  "/updateProfile",
  authenticateToken,
  upload.single("profileImage"),
  updateProfile
);
router.get("/user/:userId", getUserById);
router.get("/me", authenticateToken, checkLogin);
router.get("/serviceProvider", getServiceProviders);
router.post("/addToWishlist", authenticateToken, addToWishlist);
router.post("/removeFromWishlist", authenticateToken, removeFromWishlist);
router.post("/addNotification", authenticateToken, addNotification);
router.get("/clearNotifications", authenticateToken, clearNotifications);
router.get(
  "/readNotification/:notificationId",
  authenticateToken,
  readNotification
);
router.post("/support", authenticateToken, createSupportTicket);

export default router;

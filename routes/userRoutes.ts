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
} from "../controller/profileController";

const router = express.Router();

router.get("/checkLogin", authenticateToken, checkLogin);
router.post("/updateProfile", authenticateToken, updateProfile);
router.get("/user/:userId", getUserById); // Use GET and pass userId in the URL
router.get("/me", authenticateToken, checkLogin); // ✅ Use `checkLogin` for fetching user details
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

export default router;

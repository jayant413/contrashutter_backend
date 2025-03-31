import express from "express";

import {
  loginUser,
  logoutUser,
  registerUser,
  contactUs,
  changePassword,
} from "../controller/authController";
import { authenticateToken } from "../middlewares/authMiddleware";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.post("/contact", contactUs);
router.post("/change-password", authenticateToken, changePassword);

export default router;

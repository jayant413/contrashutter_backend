import express from "express";

import {
  loginUser,
  logoutUser,
  registerUser,
  contactUs,
} from "../controller/authController";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.post("/contact", contactUs);

export default router;

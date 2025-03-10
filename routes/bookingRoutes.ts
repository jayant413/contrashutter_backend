import { Router } from "express";
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingById,
  getBookingsByUserId,
} from "../controller/bookingController";
import { authenticateToken } from "../middlewares/authMiddleware";

const router: Router = Router();

// POST route for creating a new booking
router.post("/", createBooking);

// GET route for fetching all bookings
router.get("/", getBookings);

router.get("/user/:userId", getBookingsByUserId);

// GET route for fetching a specific booking by ID
router.get("/:id", getBookingById);

// PUT route for updating a booking
router.put("/:id", authenticateToken, updateBookingById);

export default router;

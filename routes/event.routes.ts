import express from "express";
import {
  createEvent,
  getEvents,
  getEventsByServiceId,
  updateEvent,
  getEventById,
} from "../controller/event.controller";
import upload from "../middlewares/multerMiddleware";

const router = express.Router();

router.post("/", upload.single("image"), createEvent); // Endpoint for creating an event
router.get("/:eventId", getEventById);
router.get("/", getEvents); // Get all events
router.get("/service/:serviceId", getEventsByServiceId); // Get events by serviceId
// Ensure this is your correct route setup
router.put("/:eventId", upload.single("image"), updateEvent); // Update an event by ID

export default router;

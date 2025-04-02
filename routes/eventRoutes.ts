import express from "express";
import {
  createEvent,
  getEvents,
  getEventsByServiceId,
  updateEvent,
  getEventById,
} from "../controller/eventController";

const router = express.Router();

router.post("/", createEvent); // Endpoint for creating an event
router.get("/:eventId", getEventById);
router.get("/", getEvents); // Get all events
router.get("/service/:serviceId", getEventsByServiceId); // Get events by serviceId
router.put("/:eventId", updateEvent); // Update an event by ID

export default router;

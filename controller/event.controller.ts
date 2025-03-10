import { Request, Response } from "express";
import mongoose from "mongoose";
import Event from "../models/event";
import Service from "../models/service";
import path from "path";
import fs from "fs";
import multer from "multer";

// Define interface for Request with file
interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

export const createEvent = async (
  req: RequestWithFile,
  res: Response
): Promise<void> => {
  try {
    const { eventName, serviceId } = req.body;

    if (!eventName || !serviceId) {
      res
        .status(400)
        .json({ message: "Event name and serviceId are required" });
      return;
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      res.status(400).json({ message: "Service not found" });
      return;
    }

    const newEvent = new Event({
      eventName,
      serviceId,
      image: null,
    });

    await newEvent.save();
    const imagefile = req.file;

    if (imagefile) {
      const fileExt = path.extname(imagefile.originalname);
      const newFilename = `${newEvent._id}${fileExt}`;
      const newPath = path.join("uploads/images", newFilename);

      fs.renameSync(imagefile.path, newPath);

      newEvent.image = newPath;
      await newEvent.save();
    }

    service.events.push(newEvent._id);
    await service.save();

    res.status(200).json(newEvent);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error creating event", error: error.message });
  }
};

// Get all Events with Service Details
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await Event.find().populate("serviceId");
    res.json(events);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching events", error: error.message });
  }
};

export const getEventById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate("packageIds");
    res.json(event);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching event", error: error.message });
  }
};

// Get Events by Service ID
export const getEventsByServiceId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { serviceId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      res.status(400).json({ message: "Invalid service ID format" });
      return;
    }

    const events = await Event.find({ serviceId });

    if (events.length === 0) {
      res.status(404).json({ message: "No events found for this service" });
      return;
    }

    res.json(events);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching events", error: error.message });
  }
};

export const updateEvent = async (
  req: RequestWithFile,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    const { eventName } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    // Update event name if provided
    if (eventName) {
      event.eventName = eventName;
    }

    if (req.file) {
      // Delete old image if it exists
      if (event.image) {
        const oldImagePath = path.join(__dirname, "..", event.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Save new image with a relative path
      const fileExt = path.extname(req.file.originalname);
      const newFilename = `${event._id}${fileExt}`;
      const newPath = path.join("uploads", "images", newFilename);

      // Ensure the uploads/images directory exists
      const fullPath = path.join(__dirname, "..", newPath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.renameSync(req.file.path, fullPath);
      event.image = newPath; // Store the relative path
    }

    await event.save();
    res.status(200).json({ message: "Event updated successfully", event });
  } catch (error: any) {
    console.error("Error updating event:", error);
    res
      .status(500)
      .json({ message: "Error updating event", error: error.message });
  }
};

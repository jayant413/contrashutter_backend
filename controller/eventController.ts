import { Request, Response } from "express";
import mongoose from "mongoose";
import Event from "../models/event";
import Service from "../models/service";
import formidable, { Fields, Files } from "formidable";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define interface for Request with file
interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

export const createEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Configure formidable
    const form = formidable({
      keepExtensions: true,
    });

    form.parse(req, async (err, fields: Fields, files: Files) => {
      if (err) {
        console.error("Form parsing error:", err);
        res.status(500).json({ message: "Error parsing form data" });
        return;
      }

      const eventName = fields.eventName?.[0];
      const serviceId = fields.serviceId?.[0];
      const description = fields.description?.[0] || "";

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
        description,
        serviceId,
        image: null,
      });

      await newEvent.save();

      // Handle image upload
      const imageFile = files.image?.[0];

      if (imageFile) {
        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(
          imageFile.filepath,
          {
            folder: "events",
          }
        );

        // Clean up the temporary file
        fs.unlinkSync(imageFile.filepath);

        // Update event with image URL
        newEvent.image = uploadResult.secure_url;
        await newEvent.save();
      }

      service.events.push(newEvent._id);
      await service.save();

      res.status(200).json(newEvent);
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ message: "Error creating event", error: error.message });
    } else {
      res
        .status(500)
        .json({ message: "Error creating event", error: "Unknown error" });
    }
  }
};

// Get all Events with Service Details
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await Event.find().populate("serviceId");
    res.json(events);
  } catch (error: unknown) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ message: "Error fetching events", error: error.message });
    } else {
      res
        .status(500)
        .json({ message: "Error fetching events", error: "Unknown error" });
    }
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ message: "Error fetching event", error: error.message });
    } else {
      res
        .status(500)
        .json({ message: "Error fetching event", error: "Unknown error" });
    }
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ message: "Error fetching events", error: error.message });
    } else {
      res
        .status(500)
        .json({ message: "Error fetching events", error: "Unknown error" });
    }
  }
};

export const updateEvent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;

    // Configure formidable
    const form = formidable({
      keepExtensions: true,
    });

    form.parse(req, async (err, fields: Fields, files: Files) => {
      if (err) {
        console.error("Form parsing error:", err);
        res.status(500).json({ message: "Error parsing form data" });
        return;
      }

      const eventName = fields.eventName?.[0];
      const description = fields.description?.[0];

      const event = await Event.findById(eventId);
      if (!event) {
        res.status(404).json({ message: "Event not found" });
        return;
      }

      // Update event fields if provided
      if (eventName) {
        event.eventName = eventName;
      }

      if (description !== undefined) {
        event.description = description;
      }

      // Handle image upload
      const imageFile = files.image?.[0];

      if (imageFile) {
        // If there's an existing image in Cloudinary, delete it
        if (event.image && event.image.includes("cloudinary")) {
          try {
            // Extract public_id from Cloudinary URL
            const urlParts = event.image.split("/");
            // Find the folder name and file name
            const folderIndex = urlParts.findIndex((part) => part === "events");
            if (folderIndex !== -1 && folderIndex < urlParts.length - 1) {
              // Get the parts that include the folder and the filename
              const publicIdParts = urlParts.slice(folderIndex);
              // Remove file extension if present and join with '/'
              const publicId = publicIdParts.join("/").split(".")[0];

              console.log(`Attempting to delete image: ${publicId}`);
              // Delete from Cloudinary
              const result = await cloudinary.uploader.destroy(publicId);
              console.log(`Image deletion result: ${result}`);
            } else {
              console.warn(
                "Could not extract proper public_id from URL:",
                event.image
              );
            }
          } catch (error) {
            console.error("Error deleting previous image:", error);
            // Continue with the upload even if deletion fails
          }
        }

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(
          imageFile.filepath,
          {
            folder: "events",
          }
        );

        // Clean up the temporary file
        fs.unlinkSync(imageFile.filepath);

        // Update event with new image URL
        event.image = uploadResult.secure_url;
      }

      await event.save();
      res.status(200).json({ message: "Event updated successfully", event });
    });
  } catch (error: unknown) {
    console.error("Error updating event:", error);
    if (error instanceof Error) {
      res
        .status(500)
        .json({ message: "Error updating event", error: error.message });
    } else {
      res
        .status(500)
        .json({ message: "Error updating event", error: "Unknown error" });
    }
  }
};

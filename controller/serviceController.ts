import { Request, Response } from "express";
import Service from "../models/service";
import mongoose from "mongoose";

// Create a new Service (Only Name, Empty Events Array)
export const createService = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ message: "Service name is required" });
      return;
    }

    // Create service with an empty event list
    const newService = new Service({ name, events: [] });
    await newService.save();

    res.status(200).json(newService);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Error creating service", error: errorMessage });
  }
};

// Get all Services (With Linked Events)
export const getServices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const services = await Service.find().populate("events");
    res.json(services);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Error fetching services", error: errorMessage });
  }
};

// Get a Service by ID (With Linked Events)
export const getServiceById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const service = await Service.findById(req.params.id).populate("events");

    if (!service) {
      res.status(404).json({ message: "Service not found" });
      return;
    }

    res.json(service);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: "Error fetching service", error: errorMessage });
  }
};

export const updateService = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { servicesToUpdate } = req.body;

    // Check if the input data is valid
    if (!Array.isArray(servicesToUpdate) || servicesToUpdate.length === 0) {
      res.status(400).json({ message: "Invalid service update data" });
      return;
    }

    // Create an array of promises for each update
    const updatePromises = servicesToUpdate.map(
      async (service: { _id: string; name: string }) => {
        const { _id, name } = service;
        if (_id && name) {
          try {
            // Await the update operation for each service
            await Service.findByIdAndUpdate(_id, { name });
          } catch (error) {
            console.error(`Error updating service with ID ${_id}:`, error);
            // Optionally, return an error for this particular service if you want to handle it separately
          }
        }
      }
    );

    // Wait for all updates to complete using Promise.all
    await Promise.all(updatePromises);

    // After all updates are completed, send the response
    res.status(200).json({ message: "Services updated successfully" });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      message: "Error updating services",
      error: errorMessage,
    });
  }
};

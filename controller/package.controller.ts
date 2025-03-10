import { Request, Response } from "express";
import Package from "../models/package";
import Service from "../models/service";
import Event from "../models/event";

// 🆕 Get All Packages
export const getAllPackages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const packages = await Package.find().populate("serviceId eventId"); // Populating references
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching packages", error });
  }
};

// 🆕 Get Package by ID
export const getPackageById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const packageData = await Package.findById(req.params.id).populate(
      "serviceId eventId"
    );
    if (!packageData) {
      res.status(404).json({ message: "Package not found" });
      return;
    }
    res.json(packageData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching package", error });
  }
};

export const getPackagesByEventId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      res.status(400).json({ message: "Event ID is required" });
      return;
    }
    const packages = await Package.find({ eventId }).populate(
      "serviceId eventId"
    );

    if (packages.length === 0) {
      res.status(404).json({ message: "No packages found for this Event ID" });
      return;
    }
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching package", error });
  }
};

export const createPackage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      serviceId,
      eventId,
      name,
      price,
      booking_price,
      card_details,
      package_details,
      bill_details,
      category,
    } = req.body;

    // Validate if Service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      res.status(400).json({ message: "Service not found" });
      return;
    }

    // Validate if Event exists
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(400).json({ message: "Invalid Event ID" });
      return;
    }

    // Create new package
    const newPackage = new Package({
      serviceId,
      eventId,
      name,
      price,
      booking_price,
      card_details,
      package_details,
      bill_details,
      category,
    });

    await newPackage.save();

    // Update the event to include the new package ID in packageIds array
    await Event.findByIdAndUpdate(eventId, {
      $push: { packageIds: newPackage._id },
    });

    res.status(200).json(newPackage);
  } catch (error) {
    console.error("Error creating package:", error);
    res.status(500).json({ message: "Error creating package", error });
  }
};

export const updatePackage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      serviceId,
      eventId,
      name,
      price,
      booking_price,
      card_details,
      package_details,
      bill_details,
      category,
    } = req.body;

    // Basic validation
    if (!serviceId || !eventId || !name || !price || !booking_price) {
      res.status(400).json({ message: "Required fields are missing" });
      return;
    }

    // Format the data to match the schema
    const updateData = {
      serviceId,
      eventId,
      name,
      price: Number(price),
      booking_price: Number(booking_price),
      card_details: card_details.map((card: any) => ({
        product_name: card.product_name,
        quantity: card.quantity,
      })),
      package_details: package_details.map((detail: any) => ({
        title: detail.title,
        subtitle: detail.subtitle,
      })),
      bill_details: bill_details.map((bill: any) => ({
        type: bill.type,
        amount: bill.amount,
      })),
      category,
    };

    const updatedPackage = await Package.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedPackage) {
      res.status(404).json({ message: "Package not found" });
      return;
    }

    res.status(200).json({
      message: "Package updated successfully",
      package: updatedPackage,
    });
  } catch (error: any) {
    console.error("Error updating package:", error);
    res.status(500).json({
      message: "Error updating package",
      error: error.message,
    });
  }
};

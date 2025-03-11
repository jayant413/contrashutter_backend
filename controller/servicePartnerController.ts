import { Request, Response } from "express";
import ServicePartner from "../models/ServicePartner";
import User from "../models/userModel";
import mongoose from "mongoose";

// Create a new service partner
export const createServicePartner = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const servicePartner = new ServicePartner({
      ...req.body,
      partner: new mongoose.Types.ObjectId(userId),
      status: "Pending",
    });
    const savedPartner = await servicePartner.save();

    await User.findByIdAndUpdate(
      userId,
      { status: "Pending", partnerId: savedPartner._id },
      { new: true }
    );

    // Find admin users and send notifications
    const adminUsers = await User.find({ role: "Admin" });
    for (const admin of adminUsers) {
      admin.notifications.unshift({
        title: `New Service Partner Request: ${savedPartner.name}`,
        message: "New service partner requested to join program",
        redirectPath: `/admin/service-partners/${savedPartner._id}`,
        sender: new mongoose.Types.ObjectId(userId),
        read: false,
      });
      await admin.save();
    }

    res.status(200).json(savedPartner);
  } catch (error: unknown) {
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        message: "Validation error: " + error.message,
      });
    } else {
      console.error("Error creating service partner:", error);
      res.status(500).json({
        message: (error as Error).message || "Error creating service partner",
      });
    }
  }
};

// Get all service partners
export const getAllServicePartners = async (req: Request, res: Response) => {
  try {
    const servicePartners = await ServicePartner.find().populate("partner");
    res.json(servicePartners);
  } catch (error: unknown) {
    res.status(500).json({
      message: (error as Error).message || "Error fetching service partners",
    });
  }
};

// Get a single service partner by ID
export const getServicePartnerById = async (req: Request, res: Response) => {
  try {
    const servicePartner = await ServicePartner.findById(
      req.params.id
    ).populate("partner");
    if (!servicePartner) {
      return res
        .status(404)
        .json({ success: false, message: "Service Partner not found" });
    }
    res.json(servicePartner);
  } catch (error: unknown) {
    res.status(500).json({
      message: (error as Error).message || "Error fetching service partner",
    });
  }
};

// Update a service partner
export const updateServicePartner = async (req: Request, res: Response) => {
  try {
    const servicePartner = await ServicePartner.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!servicePartner) {
      return res
        .status(404)
        .json({ success: false, message: "Service Partner not found" });
    }

    // If status is being updated, also update the associated user's status and send notification
    if (req.body.status) {
      const user = await User.findById(servicePartner.partner);
      if (user) {
        user.status = req.body.status;
        user.notifications.unshift({
          title: "Service Partner Status Updated",
          message: `Your service partner status has been updated to ${req.body.status}`,
          redirectPath: "/profile",
          sender: new mongoose.Types.ObjectId(
            req.body.updatedBy || servicePartner.partner
          ),
          read: false,
        });
        await user.save();
      }
    }

    res.json(servicePartner);
  } catch (error: unknown) {
    // Handle mongoose duplicate key error for updates
    if (error instanceof mongoose.Error) {
      res.status(400).json({
        message: `This Service Partner is already registered. Please use a different Service Partner.`,
      });
    } else {
      res.status(500).json({
        message: (error as Error).message || "Error updating service partner",
      });
    }
  }
};

// Delete a service partner
export const deleteServicePartner = async (req: Request, res: Response) => {
  try {
    const servicePartner = await ServicePartner.findByIdAndDelete(
      req.params.id
    );
    if (!servicePartner) {
      return res
        .status(404)
        .json({ success: false, message: "Service Partner not found" });
    }
    res.status(200).json({ success: true, message: "Service Partner deleted" });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// Get service partner by partner ID
export const getServicePartnerByPartnerId = async (
  req: Request,
  res: Response
) => {
  try {
    const servicePartner = await ServicePartner.findOne({
      partner: req.params.partnerId,
    }).populate("partner");

    if (!servicePartner) {
      return res
        .status(404)
        .json({ success: false, message: "Service Partner not found" });
    }
    res.json(servicePartner);
  } catch (error: unknown) {
    res.status(500).json({
      message: (error as Error).message || "Error fetching service partner",
    });
  }
};

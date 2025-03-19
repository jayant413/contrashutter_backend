import { Request, Response } from "express";
import User from "../models/userModel";
import Package from "../models/package";
import SupportTicket from "../models/supportTicketModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads/user");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req: AuthRequest, file, cb) {
    const userId = req.user?.id;
    if (!userId) {
      return cb(new Error("User ID not found"), "");
    }
    const ext = path.extname(file.originalname);
    cb(null, `${userId}${ext}`);
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and JPG are allowed."));
    }
  },
});

// Middleware request type with user
interface CustomRequest extends Request {
  user?: { id: string; email: string; role: string };
}

// Check if user is logged in
export const checkLogin = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id)
      .select("-password")
      .populate("wishlist");
    if (!user) {
      res.clearCookie("token");
      res.status(404).json({
        isLoggedIn: false,
        userExistsInDb: false,
        message: "User not found in database",
      });
      return;
    }

    res.status(200).json({
      isLoggedIn: true,
      userExistsInDb: true,
      user: user,
    });
  } catch (error: unknown) {
    console.error("Error verifying login:", error);
    res
      .status(500)
      .json({ isLoggedIn: false, message: "Internal server error" });
  }
};

// Update user profile
export const updateProfile = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      fullname,
      contact,
      role,
      dateOfBirth,
      aadharCard,
      panCard,
      address,
    } = req.body;

    if (!fullname || !contact || !role) {
      res.status(400).json({ message: "Required fields are missing" });
      return;
    }

    const updateData: any = {
      fullname,
      contact,
      role,
      dateOfBirth,
      aadharCard,
      panCard,
      address,
    };

    // If there's a file upload, add profileImage to updateData
    if (req.file) {
      // Delete old profile image if it exists
      const user = await User.findById(req.user?.id);
      if (user?.profileImage) {
        const oldImagePath = path.join(process.cwd(), user.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.profileImage = `/uploads/user/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user?.id, updateData, {
      new: true,
    }).select("-password");

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params; // Get userId from the URL

    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const user = await User.findById(userId).select("fullname "); // Fetch only needed fields

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error: unknown) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      message: "Error fetching user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getServiceProviders = async (req: Request, res: Response) => {
  try {
    const serviceProviders = await User.find({ role: "Service Provider" });
    res.status(200).json(serviceProviders);
  } catch (error: unknown) {
    res.status(500).json({
      message: "Error fetching service providers",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const addToWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const { packageId } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const packageInfo = await Package.findById(packageId);
    if (!packageInfo) {
      res.status(404).json({ message: "Package not found" });
      return;
    }
    // Check if packageId already exists in the wishlist
    if (!user.wishlist.includes(packageId)) {
      user.wishlist.push(packageId);
      await user.save();
      res.status(200).json({ message: "Package added to wishlist" });
    } else {
      res.status(400).json({ message: "Package already in wishlist" });
    }
  } catch (error: unknown) {
    res.status(500).json({
      message: "Error adding wishlist",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const removeFromWishlist = async (req: AuthRequest, res: Response) => {
  try {
    const { packageId } = req.body;
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    user.wishlist = user.wishlist.filter((id) => id.toString() !== packageId);
    await user.save();
    res.status(200).json({ message: "Package removed from wishlist" });
  } catch (error: unknown) {
    res.status(500).json({
      message: "Error removing wishlist",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const addNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { title, message, redirectPath } = req.body;
    let { receiverId } = req.body;

    if (!receiverId) {
      const admin = await User.findOne({ role: "Admin" });
      receiverId = admin?._id;
    }

    if (!req.user?.id) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const user = await User.findById(receiverId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    user.notifications.unshift({
      title,
      message,
      redirectPath,
      sender: new mongoose.Types.ObjectId(req.user.id),
      read: false,
    });
    await user.save();
    res.status(200).json({ message: "Notification added" });
  } catch (error: unknown) {
    res.status(500).json({
      message: "Error adding notification",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const clearNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    user.notifications = [];
    await user.save();
    res.status(200).json({ message: "Notifications cleared" });
  } catch (error: unknown) {
    res.status(500).json({
      message: "Error clearing notifications",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const readNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { notificationId } = req.params;
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const notification = user.notifications.find((notification) =>
      notification._id?.equals(notificationId)
    );
    if (!notification) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }
    notification.read = true;
    await user.save();
    res.status(200).json({ message: "Notification read" });
  } catch (error: unknown) {
    res.status(500).json({
      message: "Error reading notification",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Add new support ticket handler
export const createSupportTicket = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { subject, message, priority } = req.body;
    const userId = req.user?.id;

    if (!subject || !message || !priority) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const supportTicket = await SupportTicket.create({
      subject,
      message,
      priority,
      userId: new mongoose.Types.ObjectId(userId),
    });

    res.status(200).json({
      message: "Support ticket created successfully",
      ticket: supportTicket,
    });
  } catch (error: unknown) {
    res.status(500).json({
      message: "Error creating support ticket",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

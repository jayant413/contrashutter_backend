import { Request, Response } from "express";
import User from "../models/userModel";
import Package from "../models/package";
import { AuthRequest } from "../middlewares/authMiddleware";
import mongoose from "mongoose";
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
  } catch (error) {
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
    const { fullname, contact, role } = req.body;

    if (!fullname || !contact || !role) {
      res.status(400).json({ message: "All fields except email are required" });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user?.id,
      { fullname, contact, role },
      { new: true }
    );

    if (!updatedUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        fullname: updatedUser.fullname,
        contact: updatedUser.contact,
        role: updatedUser.role,
        email: req.user?.email,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Internal server error" });
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
  } catch (error: any) {
    console.error("Error fetching user:", error);
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

export const getServiceProviders = async (req: Request, res: Response) => {
  try {
    const serviceProviders = await User.find({ role: "Service Provider" });
    res.status(200).json(serviceProviders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching service providers", error });
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
  } catch (error) {
    res.status(500).json({ message: "Error adding wishlist", error });
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
  } catch (error) {
    res.status(500).json({ message: "Error removing wishlist", error });
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
  } catch (error) {
    res.status(500).json({ message: "Error adding notification", error });
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
  } catch (error) {
    res.status(500).json({ message: "Error clearing notifications", error });
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
  } catch (error) {
    res.status(500).json({ message: "Error reading notification", error });
  }
};

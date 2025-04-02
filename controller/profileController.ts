import { Request, Response } from "express";
import User from "../models/userModel";
import Package from "../models/package";
import SupportTicket from "../models/supportTicketModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import formidable from "formidable";

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
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      filter: ({ name, originalFilename, mimetype }) => {
        // Keep only image files
        if (name === "profileImage") {
          return mimetype ? mimetype.includes("image") : false;
        }
        return true;
      },
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing form data:", err);
        res.status(400).json({ message: "Error processing form" });
        return;
      }

      const fullname = fields.fullname?.[0];
      const contact = fields.contact?.[0];
      const role = fields.role?.[0];
      const dateOfBirth = fields.dateOfBirth?.[0];
      const aadharCard = fields.aadharCard?.[0];
      const panCard = fields.panCard?.[0];
      const address = fields.address?.[0];

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

      // Get user id to use as public_id in Cloudinary
      const userId = req.user?.id;
      if (!userId) {
        res.status(400).json({ message: "User ID not found" });
        return;
      }

      // Get current user data to check for existing profile image
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // If there's a profile image, upload it to Cloudinary
      const profileImage = files.profileImage?.[0];
      if (profileImage && profileImage.filepath) {
        try {
          // If the user already has a profile image, delete it from Cloudinary
          if (currentUser.profileImage) {
            try {
              // Extract public_id from the existing Cloudinary URL
              const urlParts = currentUser.profileImage.split("/");
              // Find the parts that contain the folder and ID
              const folderWithId = urlParts
                .slice(urlParts.indexOf("user_profiles"))
                .join("/");
              // Remove file extension if present
              const publicId = folderWithId.split(".")[0];

              // Delete from Cloudinary
              await cloudinary.uploader.destroy(publicId);
              console.log(`Previous profile image deleted: ${publicId}`);
            } catch (deleteError) {
              console.error(
                "Error deleting previous profile image:",
                deleteError
              );
              // Continue with the upload even if deletion fails
            }
          }

          // Upload to Cloudinary directly from the file path
          const result = await cloudinary.uploader.upload(
            profileImage.filepath,
            {
              public_id: userId,
              folder: "user_profiles",
              overwrite: true,
            }
          );

          // Store Cloudinary URL in updateData
          updateData.profileImage = result.secure_url;
        } catch (uploadError) {
          console.error("Error uploading to Cloudinary:", uploadError);
          res.status(500).json({ message: "Error uploading image" });
          return;
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user?.id,
        updateData,
        {
          new: true,
        }
      ).select("-password");

      if (!updatedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
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
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Configure formidable
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      filter: ({ name, originalFilename, mimetype }) => {
        // Keep only image files for the supportImage field
        if (name === "image") {
          return mimetype ? mimetype.includes("image") : false;
        }
        return true;
      },
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing form data:", err);
        res.status(400).json({ message: "Error processing form" });
        return;
      }

      const subject = fields.subject?.[0];
      const message = fields.message?.[0];
      const priority = fields.priority?.[0];

      if (!subject || !message || !priority) {
        res.status(400).json({ message: "All fields are required" });
        return;
      }

      // Create support ticket object without image first
      const supportTicketData: any = {
        subject,
        message,
        priority,
        userId: new mongoose.Types.ObjectId(userId),
      };

      // Handle image upload if present
      const imageFile = files.image?.[0];
      if (imageFile && imageFile.filepath) {
        try {
          // Upload to Cloudinary directly from the file path
          const uploadResult = await cloudinary.uploader.upload(
            imageFile.filepath,
            {
              folder: "support_tickets",
            }
          );

          // Add Cloudinary URL to ticket data
          supportTicketData.image = uploadResult.secure_url;
        } catch (uploadError) {
          console.error("Error uploading to Cloudinary:", uploadError);
          res.status(500).json({ message: "Error uploading image" });
          return;
        }
      }

      // Create the support ticket with all data
      const supportTicket = await SupportTicket.create(supportTicketData);

      res.status(200).json({
        message: "Support ticket created successfully",
        ticket: supportTicket,
      });
    });
  } catch (error: unknown) {
    res.status(500).json({
      message: "Error creating support ticket",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

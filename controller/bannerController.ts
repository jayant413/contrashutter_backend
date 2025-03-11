import { Request, Response } from "express";
import Banner from "../models/banner";
import fs from "fs";
import path from "path";

// Extend the Request interface to include files
interface RequestWithFiles extends Request {
  files?: Express.Multer.File[];
}

export const UploadBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[]; // ✅ Type assertion

    if (!files || files.length === 0) {
      res.status(400).json({ message: "No files uploaded" });
      return;
    }

    const indexes = JSON.parse(req.body.indexes || "[]");

    if (indexes.length !== files.length) {
      res.status(400).json({ message: "Invalid or mismatched indexes array" });
      return;
    }

    // Setup directory
    const bannerDir = path.join(__dirname, "..", "uploads", "banners");
    fs.mkdirSync(bannerDir, { recursive: true });

    // Process files
    const savedBanners = await Promise.all(
      files.map(async (file, i) => {
        const newFilename = `banner-${Date.now()}-${indexes[i]}${path.extname(
          file.originalname
        )}`;
        const newPath = path.join("uploads", "banners", newFilename);
        const fullPath = path.join(__dirname, "..", newPath);

        // Move file
        fs.renameSync(file.path, fullPath);

        // Update or create banner record
        return await Banner.findOneAndUpdate(
          { index: indexes[i] },
          {
            index: indexes[i],
            image: newPath, // Store relative path
          },
          { upsert: true, new: true }
        );
      })
    );

    res.status(200).json({
      message: "Banners uploaded successfully",
      banners: savedBanners,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Upload error:", error);
      res.status(500).json({
        message: "Error uploading banners",
        error: error.message,
      });
    } else {
      console.error("Upload error:", error);
      res.status(500).json({
        message: "Error uploading banners",
        error: "Unknown error",
      });
    }
  }
};

export const GetBanners = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const banners = await Banner.find().sort("index");
    const bannersWithUrls = banners.map((banner) => ({
      _id: banner._id,
      url: banner.image, // Ensure this is the correct path
      index: banner.index,
    }));

    res.status(200).json({
      message: "Banners fetched successfully",
      banners: bannersWithUrls,
    });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ message: "Error fetching banners" });
  }
};

export const DeleteBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      res.status(404).json({ message: "Banner not found" });
      return;
    }

    // Remove the file from the folder
    const filePath = path.join(__dirname, "..", banner.image);
    fs.unlinkSync(filePath);

    await Banner.findByIdAndDelete(id);
    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Error deleting banner" });
  }
};

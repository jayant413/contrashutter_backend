import { Request, Response } from "express";
import Banner from "../models/banner";
import { v2 as cloudinary } from "cloudinary";
import formidable, { Fields, Files } from "formidable";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const UploadBanner = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Configure formidable
    const form = formidable({
      multiples: true,
      keepExtensions: true,
    });

    form.parse(req, async (err, fields: Fields, files: Files) => {
      if (err) {
        console.error("Form parsing error:", err);
        res.status(500).json({ message: "Error parsing form data" });
        return;
      }

      const filesArray = Array.isArray(files.files)
        ? files.files
        : files.files
        ? [files.files]
        : [];

      if (filesArray.length === 0) {
        res.status(400).json({ message: "No files uploaded" });
        return;
      }

      const indexes = JSON.parse(fields.indexes?.[0] ?? "[]");
      const titles = JSON.parse(fields.titles?.[0] ?? "[]");
      const subtitles = JSON.parse(fields.subtitles?.[0] ?? "[]");

      if (indexes.length !== filesArray.length) {
        res
          .status(400)
          .json({ message: "Invalid or mismatched indexes array" });
        return;
      }

      // Process files
      const savedBanners = await Promise.all(
        filesArray.map(async (file, i) => {
          // Upload to Cloudinary
          const uploadResult = await cloudinary.uploader.upload(file.filepath, {
            folder: "banners",
          });

          // Clean up the temporary file
          fs.unlinkSync(file.filepath);

          // Update or create banner record
          return await Banner.findOneAndUpdate(
            { index: indexes[i] },
            {
              index: indexes[i],
              image: uploadResult.secure_url,
              title: titles[i] || "",
              subtitle: subtitles[i] || "",
            },
            { upsert: true, new: true }
          );
        })
      );

      res.status(200).json({
        message: "Banners uploaded successfully",
        banners: savedBanners,
      });
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
      url: banner.image,
      title: banner.title,
      subtitle: banner.subtitle,
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

    // Extract public_id from Cloudinary URL
    const urlParts = banner.image.split("/");
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = `banners/${publicIdWithExtension.split(".")[0]}`;

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    await Banner.findByIdAndDelete(id);
    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Error deleting banner" });
  }
};

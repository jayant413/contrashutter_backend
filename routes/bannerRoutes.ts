import express from "express";
import {
  UploadBanner,
  GetBanners,
  DeleteBanner,
} from "../controller/bannerController";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Ensure temp upload directory exists
const tempDir = path.join(__dirname, "..", "uploads", "temp");
fs.mkdirSync(tempDir, { recursive: true });

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage: storage });

router.post("/", upload.array("files"), UploadBanner);
router.get("/", GetBanners);
router.delete("/:id", DeleteBanner);
export default router;

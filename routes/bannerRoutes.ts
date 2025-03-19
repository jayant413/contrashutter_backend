import express, { Request } from "express";
import {
  UploadBanner,
  GetBanners,
  DeleteBanner,
} from "../controller/bannerController";
import multer from "multer";
import path from "path";
import fs from "fs";

// Define types for the request and file
type UploadRequest = Request & {
  files: Express.Multer.File[]; // Change this line to use the correct type
};

const router = express.Router();

// Ensure temp upload directory exists
const tempDir = path.join(__dirname, "../uploads/temp");
fs.mkdirSync(tempDir, { recursive: true });

// Configure multer
const storage = multer.diskStorage({
  destination: function (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, destination: string) => void
  ) {
    callback(null, tempDir);
  },
  filename: function (
    req: UploadRequest,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) {
    cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage: storage });

router.post("/", upload.array("files"), UploadBanner);
router.get("/", GetBanners);
router.delete("/:id", DeleteBanner);
export default router;

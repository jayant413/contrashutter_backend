import express, { Request, Response } from "express";
import {
  UploadBanner,
  GetBanners,
  DeleteBanner,
} from "../controller/bannerController";
import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs";

// Define types for the request and file
type UploadRequest = Request & {
  files: Express.Multer.File[];
};

const router = express.Router();

// Ensure temp upload directory exists
const tempDir = path.join(__dirname, "..", "uploads", "temp");
fs.mkdirSync(tempDir, { recursive: true });

// Configure multer
const storage: StorageEngine = multer.diskStorage({
  destination: function (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, destination: string) => void
  ) {
    callback(null, tempDir);
  },
  filename: function (req: UploadRequest, file: Express.Multer.File, cb) {
    cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage: storage });

router.post("/", upload.array("files"), UploadBanner);
router.get("/", GetBanners);
router.delete("/:id", DeleteBanner);
export default router;

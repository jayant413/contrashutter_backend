import multer, { StorageEngine } from "multer";
import path from "path";
import { Request } from "express";

// Define types for the file and callback
type FileCallback = (error: Error | null, filename: string) => void;

// Define storage engine for Multer
const storage: StorageEngine = multer.diskStorage({
  destination: function (
    req: Request,
    file: Express.Multer.File,
    cb: FileCallback
  ) {
    cb(null, "./uploads/images"); // Directory to store images
  },
  filename: function (
    req: Request,
    file: Express.Multer.File,
    cb: FileCallback
  ) {
    cb(null, "temp-" + Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

// Create Multer upload middleware with the defined storage
const upload = multer({ storage: storage });

export default upload;

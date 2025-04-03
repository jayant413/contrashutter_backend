import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import path from "path";

import connectDB from "./config/db";
import serviceRoutes from "./routes/serviceRoutes";
import eventRoutes from "./routes/eventRoutes";
import packageRoutes from "./routes/packageRoutes";
import bookingRoutes from "./routes/bookingRoutes"; // Booking routes import
import paymentRoutes from "./routes/paymentRoutes"; // Payment routes import
import formRoutes from "./routes/formRoutes";
import scheduleEndpointCall from "./cron/endpointCron"; // Import cron job

import servicePartnerRoutes from "./routes/servicePartnerRoutes";
import bannerRoutes from "./routes/bannerRoutes";
import { v2 as cloudinary } from "cloudinary";

// Import models (no need to export them globally)
import "./models/package"; // Ensure Package model is loaded
import "./models/service"; // Ensure Service model is loaded
import "./models/event"; // Ensure Event model is loaded
import "./models/booking"; // Ensure Booking model is loaded
import "./models/banner";
import "./models/formModel";
dotenv.config();

const app = express();

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS, // Replace with your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();

app.get("/", (req, res) => {
  res.send("Welcome to the Contrashutter APIs");
});
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/bookings", bookingRoutes); // Booking API route
app.use("/api/payment", paymentRoutes);
app.use("/api/service-partners", servicePartnerRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/forms", formRoutes);

// Initialize cron job
scheduleEndpointCall();

// Start Server
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});

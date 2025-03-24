import express, { RequestHandler } from "express";
import mongoose from "mongoose";
import {
  createServicePartner,
  getAllServicePartners,
  getServicePartnerById,
  updateServicePartner,
  deleteServicePartner,
  getServicePartnerByPartnerId,
} from "../controller/servicePartnerController";
import ServicePartner from "../models/ServicePartner";
import { authenticateToken } from "../middlewares/authMiddleware";

const router = express.Router();

// Test route to check database connection and collection
router.get("/test", async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      throw new Error("Database not connected");
    }

    // Get collection stats
    const count = await ServicePartner.countDocuments();
    const model = ServicePartner.collection;

    res.json({
      connectionState: mongoose.connection.readyState,
      databaseName: mongoose.connection.name,
      collectionName: model.collectionName,
      documentCount: count,
      modelName: ServicePartner.modelName,
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      error: "Error testing database connection",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Create a new service partner
router.post(
  "/:userId",
  authenticateToken,
  createServicePartner as RequestHandler
);

// Get all service partners
router.get("/", getAllServicePartners);

// Get a service partner by ID
router.get("/:id", getServicePartnerById as RequestHandler);

// Update a service partner
router.put("/:id", updateServicePartner as RequestHandler);

// Delete a service partner
//router.delete('/:id', deleteServicePartner);

// Get service partner by partner ID
router.get(
  "/partner/:partnerId",
  getServicePartnerByPartnerId as RequestHandler
);

export default router;

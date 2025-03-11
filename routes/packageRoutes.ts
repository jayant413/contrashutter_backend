import express from "express";
import {
  createPackage,
  getAllPackages,
  getPackageById,
  getPackagesByEventId,
  updatePackage,
} from "../controller/packageController";

const router = express.Router();

router.post("/", createPackage);
router.get("/", getAllPackages);
router.get("/event/:eventId", getPackagesByEventId);
router.get("/:id", getPackageById);
router.put("/:id", updatePackage);

export default router;

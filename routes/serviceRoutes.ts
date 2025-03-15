import express from "express";
import {
  createService,
  getServices,
  getServiceById,
  updateService,
} from "../controller/serviceController";

const router = express.Router();

router.post("/", createService);
router.get("/", getServices);
router.get("/:id", getServiceById);
router.put("/", updateService);

export default router;

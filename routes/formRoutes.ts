import express from "express";
import {
  createForm,
  updateForm,
  getFormByEventType,
} from "../controller/formController";

const router = express.Router();

router.post("/", createForm);
router.put("/:formId", updateForm);
router.get("/event/:eventType", getFormByEventType);

export default router;

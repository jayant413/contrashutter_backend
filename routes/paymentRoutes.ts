import express from "express";
import { createOrder, verifyPayment } from "../controller/paymentController";

const router = express.Router();

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);

export default router;

import express from "express";
import {
  UploadBanner,
  GetBanners,
  DeleteBanner,
} from "../controller/bannerController";

const router = express.Router();

router.post("/", UploadBanner);
router.get("/", GetBanners);
router.delete("/:id", DeleteBanner);

export default router;

import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createBid,
  hireBid,
  getBidsByGig,
} from "../controllers/bid.controller.js";

const router = express.Router();

router.post("/", protect, createBid);
router.get("/:gigId", protect, getBidsByGig);
router.patch("/:bidId/hire", protect, hireBid);

export default router;

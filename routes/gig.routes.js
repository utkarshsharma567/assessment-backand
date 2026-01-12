import express from "express";
import { createGig, getGigs } from "../controllers/gig.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getGigs);
router.post("/", protect, createGig);

export default router;
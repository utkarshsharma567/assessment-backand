import Bid from "../models/Bid.js";
import Gig from "../models/Gig.js";
import mongoose from "mongoose";

/**
 * @desc    Create a bid on a gig
 * @route   POST /api/bids
 * @access  Private
 */
export const createBid = async (req, res) => {
  try {
    const { gigId, message, price } = req.body;

    if (!gigId || !price) {
      return res.status(400).json({ msg: "GigId and price are required" });
    }

    const bid = await Bid.create({
      gigId,
      message,
      price,
      freelancerId: req.userId,
    });

    res.status(201).json(bid);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * @desc    Get all bids for a gig (ONLY gig owner)
 * @route   GET /api/bids/:gigId
 * @access  Private
 */
export const getBidsByGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.gigId);

    if (!gig) return res.status(404).json({ msg: "Gig not found" });

    if (gig.ownerId.toString() !== req.userId) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    const bids = await Bid.find({ gigId: gig._id })
      .populate("freelancerId", "name email");

    res.json(bids);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

/**
 * @desc    Hire a freelancer (CRITICAL LOGIC)
 * @route   PATCH /api/bids/:bidId/hire
 * @access  Private
 */
export const hireBid = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bid = await Bid.findById(req.params.bidId).session(session);
    if (!bid) throw new Error("Bid not found");

    const gig = await Gig.findById(bid.gigId).session(session);
    if (!gig) throw new Error("Gig not found");

    // Only owner can hire
    if (gig.ownerId.toString() !== req.userId) {
      throw new Error("Not authorized to hire");
    }

    // Prevent double hiring
    if (gig.status === "assigned") {
      throw new Error("Freelancer already hired");
    }

    // Update gig
    gig.status = "assigned";
    await gig.save({ session });

    // Update selected bid
    bid.status = "hired";
    await bid.save({ session });

    // Reject all other bids
    await Bid.updateMany(
      { gigId: gig._id, _id: { $ne: bid._id } },
      { status: "rejected" },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({ msg: "Freelancer hired successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ msg: error.message });
  }
};

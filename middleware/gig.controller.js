import Gig from "../models/Gig.js";

export const createGig = async (req, res) => {
  const gig = await Gig.create({
    ...req.body,
    ownerId: req.userId,
  });
  res.json(gig);
};

export const getGigs = async (req, res) => {
  const search = req.query.search || "";
  const gigs = await Gig.find({
    status: "open",
    title: { $regex: search, $options: "i" },
  });
  res.json(gigs);
};
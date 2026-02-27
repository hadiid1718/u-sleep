import Comparison from "../models/comparison.model.js";

// GET all active comparisons (public)
export const getComparisons = async (req, res, next) => {
  try {
    const comparisons = await Comparison.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json({ success: true, data: comparisons });
  } catch (error) {
    next(error);
  }
};

// GET all comparisons including inactive (admin)
export const getAllComparisons = async (req, res, next) => {
  try {
    const comparisons = await Comparison.find().sort({ order: 1 });
    res.status(200).json({ success: true, data: comparisons });
  } catch (error) {
    next(error);
  }
};

// CREATE a new comparison row (admin)
export const createComparison = async (req, res, next) => {
  try {
    const { feature, uSleep, human, order } = req.body;

    if (!feature || !uSleep || !human) {
      const error = new Error("Feature, uSleep, and human values are required");
      error.statusCode = 400;
      throw error;
    }

    const comparison = await Comparison.create({ feature, uSleep, human, order: order ?? 0 });
    res.status(201).json({ success: true, data: comparison });
  } catch (error) {
    next(error);
  }
};

// UPDATE a comparison row (admin)
export const updateComparison = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const comparison = await Comparison.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!comparison) {
      const error = new Error("Comparison not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: comparison });
  } catch (error) {
    next(error);
  }
};

// DELETE a comparison row (admin)
export const deleteComparison = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comparison = await Comparison.findByIdAndDelete(id);

    if (!comparison) {
      const error = new Error("Comparison not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, message: "Comparison deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// SEED default comparisons if collection is empty
export const seedComparisons = async (req, res, next) => {
  try {
    const count = await Comparison.countDocuments();
    if (count > 0) {
      const error = new Error("Comparisons already exist. Delete them first to re-seed.");
      error.statusCode = 400;
      throw error;
    }

    const defaults = [
      { feature: "Average revenue saved", uSleep: "45%", human: "0%", order: 1 },
      { feature: "Learning", uSleep: "$0", human: "$0+ per freelance call", order: 2 },
      { feature: "Proposal writing", uSleep: "$0", human: "$0+ per opportunity", order: 3 },
      { feature: "Client outreach", uSleep: "$0+ per opportunity", human: "$0", order: 4 },
      { feature: "Overall work", uSleep: "$0+ per freelance work", human: "$45+ per hour", order: 5 },
      { feature: "Work anxiety", uSleep: "$0 resolved", human: "Panic attacks", order: 6 },
      { feature: "Upwork commission", uSleep: "$450 Dollars", human: "$450+ Dollars", order: 7 },
      { feature: "Cost per sale", uSleep: "$12.50", human: "$65.97", order: 8 },
      { feature: "Pipeline", uSleep: "$12.50", human: "$45.97", order: 9 },
    ];

    const comparisons = await Comparison.insertMany(defaults);
    res.status(201).json({ success: true, data: comparisons, message: "Default comparisons seeded successfully" });
  } catch (error) {
    next(error);
  }
};

import Comparison from "../models/comparison.model.js";

// GET all active comparisons (public)
export const getComparisons = async (req, res) => {
  try {
    const comparisons = await Comparison.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json({ success: true, data: comparisons });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch comparisons", error: error.message });
  }
};

// GET all comparisons including inactive (admin)
export const getAllComparisons = async (req, res) => {
  try {
    const comparisons = await Comparison.find().sort({ order: 1 });
    res.status(200).json({ success: true, data: comparisons });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch comparisons", error: error.message });
  }
};

// CREATE a new comparison row (admin)
export const createComparison = async (req, res) => {
  try {
    const { feature, uSleep, human, order } = req.body;

    if (!feature || !uSleep || !human) {
      return res.status(400).json({ success: false, message: "Feature, uSleep, and human values are required" });
    }

    const comparison = await Comparison.create({ feature, uSleep, human, order: order ?? 0 });
    res.status(201).json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create comparison", error: error.message });
  }
};

// UPDATE a comparison row (admin)
export const updateComparison = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const comparison = await Comparison.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!comparison) {
      return res.status(404).json({ success: false, message: "Comparison not found" });
    }

    res.status(200).json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update comparison", error: error.message });
  }
};

// DELETE a comparison row (admin)
export const deleteComparison = async (req, res) => {
  try {
    const { id } = req.params;
    const comparison = await Comparison.findByIdAndDelete(id);

    if (!comparison) {
      return res.status(404).json({ success: false, message: "Comparison not found" });
    }

    res.status(200).json({ success: true, message: "Comparison deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete comparison", error: error.message });
  }
};

// SEED default comparisons if collection is empty
export const seedComparisons = async (req, res) => {
  try {
    const count = await Comparison.countDocuments();
    if (count > 0) {
      return res.status(400).json({ success: false, message: "Comparisons already exist. Delete them first to re-seed." });
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
    res.status(500).json({ success: false, message: "Failed to seed comparisons", error: error.message });
  }
};

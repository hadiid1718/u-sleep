import { Router } from "express";
import {
  getComparisons,
  getAllComparisons,
  createComparison,
  updateComparison,
  deleteComparison,
  seedComparisons,
} from "../controller/comparison.controller.js";
import authorize from "../middleware/auth.middleware.js";

const comparisonRouter = Router();

// Public
comparisonRouter.get("/", getComparisons);

// Admin only
comparisonRouter.get("/all", authorize, getAllComparisons);
comparisonRouter.post("/", authorize, createComparison);
comparisonRouter.post("/seed", authorize, seedComparisons);
comparisonRouter.put("/:id", authorize, updateComparison);
comparisonRouter.delete("/:id", authorize, deleteComparison);

export default comparisonRouter;

import mongoose from "mongoose";

const comparisonSchema = new mongoose.Schema(
  {
    feature: {
      type: String,
      required: [true, "Feature/metric name is required"],
      trim: true,
    },
    uSleep: {
      type: String,
      required: [true, "U Sleep value is required"],
      trim: true,
    },
    human: {
      type: String,
      required: [true, "Human value is required"],
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Comparison = mongoose.model("Comparison", comparisonSchema);

export default Comparison;

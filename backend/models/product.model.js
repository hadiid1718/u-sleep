import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tag: {
      type: String,
      default: '',
      trim: true,
    },
    // Pricing
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    annualPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    annualDiscount: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    // Legacy field kept for backward compatibility
    price: {
      type: String,
      default: '',
    },
    features: {
      type: [String],
      default: [],
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

export default Product;

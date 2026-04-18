import Product from '../models/product.model.js';
import { getEffectiveAnnualPrice } from '../utils/pricing.js';

// GET /api/v1/products — Public: Get all active products
export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ order: 1 })
      .lean();
    const normalized = products.map(product => ({
      ...product,
      annualPrice: getEffectiveAnnualPrice(product),
    }));
    res.status(200).json({ success: true, data: normalized });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/products/:id — Get single product by ID
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      success: true,
      data: {
        ...product,
        annualPrice: getEffectiveAnnualPrice(product),
      },
    });
  } catch (error) {
    next(error);
  }
};

import { Router } from 'express';
import {
  getProducts,
  getProductById,
} from '../controller/product.controller.js';

const productRouter = Router();

/**
 * GET /api/v1/products
 * Public: Get all active products (for pricing page)
 */
productRouter.get('/', getProducts);

/**
 * GET /api/v1/products/:id
 * Get single product by ID
 */
productRouter.get('/:id', getProductById);

export default productRouter;

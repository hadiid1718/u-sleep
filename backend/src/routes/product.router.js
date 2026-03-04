import { Router } from 'express';
import {
  getProducts,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  seedProducts,
} from '../controller/product.controller.js';
import authorize from '../middleware/auth.middleware.js';

const productRouter = Router();

/**
 * GET /api/v1/products
 * Public: Get all active products (for pricing page)
 */
productRouter.get('/', getProducts);

/**
 * GET /api/v1/products/all
 * Admin: Get all products including inactive
 */
productRouter.get('/all', authorize, getAllProducts);

/**
 * POST /api/v1/products/seed
 * Admin: Seed default products
 */
productRouter.post('/seed', authorize, seedProducts);

/**
 * GET /api/v1/products/:id
 * Get single product by ID
 */
productRouter.get('/:id', getProductById);

/**
 * POST /api/v1/products
 * Admin: Create a new product
 */
productRouter.post('/', authorize, createProduct);

/**
 * PUT /api/v1/products/:id
 * Admin: Update a product
 */
productRouter.put('/:id', authorize, updateProduct);

/**
 * DELETE /api/v1/products/:id
 * Admin: Delete a product
 */
productRouter.delete('/:id', authorize, deleteProduct);

export default productRouter;

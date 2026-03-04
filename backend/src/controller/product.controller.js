import Product from '../models/product.model.js';

// GET /api/v1/products — Public: Get all active products
export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/products/all — Admin: Get all products (including inactive)
export const getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ order: 1 });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/products/:id — Get single product by ID
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/products — Admin: Create a new product
export const createProduct = async (req, res, next) => {
  try {
    const {
      key,
      name,
      price,
      monthlyPrice,
      annualPrice,
      annualDiscount,
      tag,
      features,
      isPopular,
      isActive,
      order,
      description,
    } = req.body;

    if (!key || !name || !price) {
      const error = new Error('Key, name, and price are required');
      error.statusCode = 400;
      throw error;
    }

    // Check for duplicate key
    const existing = await Product.findOne({ key });
    if (existing) {
      const error = new Error(`Product with key "${key}" already exists`);
      error.statusCode = 409;
      throw error;
    }

    const product = await Product.create({
      key,
      name,
      tag: tag || '',
      monthlyPrice: monthlyPrice ?? 0,
      annualPrice: annualPrice ?? 0,
      annualDiscount: annualDiscount ?? 20,
      price: price || `$${monthlyPrice}/month`,
      features: features || [],
      isPopular: isPopular || false,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      description: description || '',
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/products/:id — Admin: Update a product
export const updateProduct = async (req, res, next) => {
  try {
    const {
      key,
      name,
      price,
      monthlyPrice,
      annualPrice,
      annualDiscount,
      tag,
      features,
      isPopular,
      isActive,
      order,
      description,
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    // If key is being changed, check for duplicates
    if (key && key !== product.key) {
      const existing = await Product.findOne({ key });
      if (existing) {
        const error = new Error(`Product with key "${key}" already exists`);
        error.statusCode = 409;
        throw error;
      }
    }

    if (key !== undefined) product.key = key;
    if (name !== undefined) product.name = name;
    if (tag !== undefined) product.tag = tag;
    if (monthlyPrice !== undefined) product.monthlyPrice = monthlyPrice;
    if (annualPrice !== undefined) product.annualPrice = annualPrice;
    if (annualDiscount !== undefined) product.annualDiscount = annualDiscount;
    if (price !== undefined) product.price = price;
    if (features !== undefined) product.features = features;
    if (isPopular !== undefined) product.isPopular = isPopular;
    if (isActive !== undefined) product.isActive = isActive;
    if (order !== undefined) product.order = order;
    if (description !== undefined) product.description = description;

    await product.save();

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/products/:id — Admin: Delete a product
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    res
      .status(200)
      .json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/products/seed — Admin: Seed default products
export const seedProducts = async (req, res, next) => {
  try {
    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      return res.status(200).json({
        success: true,
        message: 'Products already exist, skipping seed',
        data: await Product.find().sort({ order: 1 }),
      });
    }

    const defaultProducts = [
      {
        key: 'manual',
        name: 'Manual job responding',
        tag: 'Starter',
        monthlyPrice: 5000,
        annualPrice: 5030,
        annualDiscount: 20,
        price: '$50/month',
        features: [
          'Job hunting and job filtering',
          'AI responds for all prospects',
          'Connect with prospects',
        ],
        isPopular: false,
        isActive: true,
        order: 1,
      },
      {
        key: 'auto',
        name: 'Auto responder',
        tag: 'Pro',
        monthlyPrice: 125,
        annualPrice: 6050,
        annualDiscount: 20,
        price: '$1.25/response',
        features: [
          'Everything from manual',
          'Auto upload to Upwork daily',
          'Advanced filtering options',
        ],
        isPopular: true,
        isActive: true,
        order: 2,
      },
    ];

    const products = await Product.insertMany(defaultProducts);
    res.status(201).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

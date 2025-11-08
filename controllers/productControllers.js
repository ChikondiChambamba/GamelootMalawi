const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, featured } = req.query;
    
    const result = await Product.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      search,
      featured: featured === 'true' ? true : featured === 'false' ? false : null
    });

    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching products' 
    });
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.findFeatured();
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching featured products' 
    });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching product' 
    });
  }
};

// Create new product (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const productData = {
      ...req.body,
      image_url: req.file ? `/uploads/products/${req.file.filename}` : req.body.image_url
    };

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating product' 
    });
  }
};

// Update product (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const existingProduct = await Product.findById(productId);
    
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const updateData = { ...req.body };
    if (req.file) {
      updateData.image_url = `/uploads/products/${req.file.filename}`;
    }

    const product = await Product.update(productId, updateData);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating product' 
    });
  }
};

// Delete product (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const existingProduct = await Product.findById(productId);
    
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await Product.delete(productId);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting product' 
    });
  }
};
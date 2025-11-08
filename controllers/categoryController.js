const Category = require('../models/Category');
const { validationResult } = require('express-validator');

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findWithProductsCount();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching categories' 
    });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching category' 
    });
  }
};

// Get category by slug
exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findBySlug(req.params.slug);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching category' 
    });
  }
};

// Create new category (Admin only)
exports.createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating category' 
    });
  }
};

// Update category (Admin only)
exports.updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const existingCategory = await Category.findById(categoryId);
    
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const category = await Category.update(categoryId, req.body);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating category' 
    });
  }
};

// Delete category (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const existingCategory = await Category.findById(categoryId);
    
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    await Category.delete(categoryId);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting category' 
    });
  }
};
/**
 * INSTRUCTIONS: Add this admin dashboard route to app.js
 * 
 * Location: Insert AFTER line 840 (after the order status update route)
 * and BEFORE the global error handler (app.use((err, req, res, next)...))
 * 
 * This creates a unified admin interface with tabs for:
 * - Products management
 * - Categories management  
 * - Price calculator tool
 */

// Admin Dashboard Route (unified interface with tabs)
app.get('/admin', isAdmin, async (req, res) => {
  try {
    // Get products with proper error handling
    let productsList = [];
    try {
      const products = await Product.findAll({ page: 1, limit: 100 });
      productsList = products.products || [];
    } catch (err) {
      console.error('Error loading products:', err);
    }

    // Get categories with proper error handling
    let categoriesList = [];
    try {
      const [categories] = await db.execute('SELECT * FROM categories ORDER BY name ASC');
      categoriesList = categories || [];
    } catch (err) {
      console.error('Error loading categories:', err);
    }
    
    res.render('layout', {
      title: 'Admin Dashboard - GameLootMalawi',
      content: 'pages/admin-dashboard',
      products: productsList,
      categories: categoriesList,
      success: req.flash('success'),
      error: req.flash('error'),
      currentUser: req.session.user
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    req.flash('error', 'Error loading admin dashboard');
    res.redirect('/');
  }
});

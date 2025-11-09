const db = require('./config/database');

async function checkTables() {
  try {
    console.log('Checking database tables...\n');

    // Check Categories
    const [categories] = await db.execute('SELECT COUNT(*) as count FROM categories');
    console.log('Categories count:', categories[0].count);
    
    if (categories[0].count === 0) {
      console.log('Warning: No categories found. Adding default categories...');
      await db.execute(`
        INSERT INTO categories (name, description, icon, slug) VALUES
        ('Consoles', 'Gaming consoles and hardware', 'fas fa-gamepad', 'consoles'),
        ('Games', 'Video games for all platforms', 'fas fa-compact-disc', 'games'),
        ('Accessories', 'Gaming accessories and peripherals', 'fas fa-headphones', 'accessories'),
        ('Electronics', 'General electronics and gadgets', 'fas fa-mobile-alt', 'electronics')
      `);
      console.log('Added default categories.');
    }

    // Check Products
    const [products] = await db.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_active = TRUE
      LIMIT 5
    `);
    console.log('\nProducts found:', products.length);
    if (products.length > 0) {
      console.log('Sample product:', {
        name: products[0].name,
        category: products[0].category_name,
        price: products[0].price
      });
    }

    // Check table structure
    const [tables] = await db.execute(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'gamelootmalawi'
      AND table_name IN ('products', 'categories')
      ORDER BY table_name, ordinal_position
    `);
    console.log('\nTable structure:', tables.length, 'columns found');

  } catch (error) {
    console.error('Database check error:', error);
  } finally {
    process.exit();
  }
}

checkTables();
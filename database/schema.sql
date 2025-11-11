-- =============================================
-- GameLootMalawi Database Setup
-- =============================================

-- Create database
CREATE DATABASE IF NOT EXISTS gamelootmalawi;
USE gamelootmalawi;

-- =============================================
-- Table: categories
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    slug VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- Table: products
-- =============================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    category_id INT NOT NULL,
    image_url VARCHAR(500),
    images JSON,
    specifications JSON,
    stock_quantity INT DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    badge ENUM('new', 'sale', 'hot', 'none') DEFAULT 'none',
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_category (category_id),
    INDEX idx_featured (is_featured),
    INDEX idx_active (is_active),
    INDEX idx_sku (sku)
);

-- =============================================
-- Table: users
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- =============================================
-- Table: orders
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    shipping_address TEXT,
    billing_address TEXT,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    payment_method ENUM('credit_card', 'apple_pay', 'shop_pay', 'cash_on_delivery') DEFAULT 'credit_card',
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_order_number (order_number)
);

-- =============================================
-- Table: order_items
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
);

-- =============================================
-- Table: cart_items
-- =============================================
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id),
    INDEX idx_user (user_id)
);

-- =============================================
-- Insert Sample Data
-- =============================================

-- Insert categories
INSERT INTO categories (name, description, icon, slug) VALUES
('Consoles', 'PS5, PS4, Xbox & Nintendo gaming consoles', 'fas fa-gamepad', 'consoles'),
('Games', 'Latest video game titles and classics for all platforms', 'fas fa-compact-disc', 'games'),
('Accessories', 'Controllers, headsets, chairs and gaming accessories', 'fas fa-headphones', 'accessories'),
('Electronics', 'Smartphones, tablets, gadgets and tech gear', 'fas fa-mobile-alt', 'electronics');

-- Insert products
INSERT INTO products (name, description, short_description, price, original_price, category_id, image_url, sku, badge, is_featured, stock_quantity) VALUES
(
    'PlayStation 5 Console',
    'Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback, adaptive triggers and 3D Audio, and an all-new generation of incredible PlayStation games.',
    'Next-gen gaming console with ultra-high speed SSD',
    1250000.00,
    1400000.00,
    (SELECT id FROM categories WHERE slug = 'consoles'),
    'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'PS5-CONSOLE-001',
    'new',
    TRUE,
    15
),
(
    'DualSense Wireless Controller',
    'Discover a deeper, highly immersive gaming experience with the innovative DualSense wireless controller for PS5.',
    'Wireless controller with haptic feedback and adaptive triggers',
    250000.00,
    300000.00,
    (SELECT id FROM categories WHERE slug = 'accessories'),
    'https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'DS-CONTROLLER-001',
    'sale',
    TRUE,
    25
),
(
    'God of War: Ragnarök',
    'Embark on an epic and heartfelt journey as Kratos and Atreus struggle with holding on and letting go.',
    'Epic action-adventure game for PlayStation',
    150000.00,
    NULL,
    (SELECT id FROM categories WHERE slug = 'games'),
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'GOW-RAGNAROK-001',
    'none',
    TRUE,
    30
),
(
    'Wireless Gaming Headset',
    'Immerse yourself in your games with high-quality sound, comfortable design, and long battery life.',
    'Premium wireless gaming headset with surround sound',
    180000.00,
    220000.00,
    (SELECT id FROM categories WHERE slug = 'accessories'),
    'https://images.unsplash.com/photo-1607853554439-0069ec0f29b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'WIRELESS-HEADSET-001',
    'hot',
    TRUE,
    20
),
(
    'iPhone 15 Pro Max',
    'The most advanced iPhone with titanium design, A17 Pro chip, and professional camera system.',
    'Latest iPhone with titanium design and pro camera',
    2800000.00,
    3200000.00,
    (SELECT id FROM categories WHERE slug = 'electronics'),
    'https://images.unsplash.com/photo-1512054502232-10a0a035d672?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'IPHONE15-PROMAX-001',
    'none',
    TRUE,
    8
),
(
    'Premium Gaming Chair',
    'Ergonomic gaming chair with lumbar support, adjustable armrests, and premium materials for long gaming sessions.',
    'Comfortable ergonomic gaming chair with lumbar support',
    650000.00,
    NULL,
    (SELECT id FROM categories WHERE slug = 'accessories'),
    'https://images.unsplash.com/photo-1600003263720-95b45a4035d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'GAMING-CHAIR-001',
    'none',
    TRUE,
    12
),
(
    'Xbox Series X',
    'The fastest, most powerful Xbox ever with true 4K gaming, 120 FPS, and next-gen performance.',
    'Next-gen Xbox console with 4K gaming',
    1100000.00,
    1300000.00,
    (SELECT id FROM categories WHERE slug = 'consoles'),
    'https://images.unsplash.com/photo-1621259182978-fbf83296f7c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'XBOX-SERIES-X-001',
    'sale',
    TRUE,
    10
),
(
    'Nintendo Switch OLED',
    'The Nintendo Switch system with a vibrant 7-inch OLED screen, wide adjustable stand, and enhanced audio.',
    'Nintendo Switch with OLED display',
    850000.00,
    950000.00,
    (SELECT id FROM categories WHERE slug = 'consoles'),
    'https://images.unsplash.com/photo-1556009114-f6f6d3ad67d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'SWITCH-OLED-001',
    'new',
    TRUE,
    18
);

-- Insert admin user (password: admin123)
INSERT INTO users (name, email, password, phone, address, role) VALUES
(
    'Admin User', 
    'admin@gamelootmalawi.com', 
    '$2a$10$8F8X8c8X8c8X8c8X8c8X8.X8c8X8c8X8c8X8c8X8c8X8c8X8c8X8c', 
    '+265 991 234 567', 
    'Lilongwe, Malawi', 
    'admin'
);

-- Insert sample customer user (password: customer123)
INSERT INTO users (name, email, password, phone, address) VALUES
(
    'John Banda', 
    'john.banda@email.com', 
    '$2a$10$CUSTOMERpasswordHASHcustomer123', 
    '+265 992 345 678', 
    'Area 3, Lilongwe, Malawi'
);

-- =============================================
-- Update product specifications (JSON data)
-- =============================================
UPDATE products SET specifications = '[
    {"name": "CPU", "value": "8x Zen 2 Cores at 3.5GHz"},
    {"name": "GPU", "value": "10.28 TFLOPs, 36 CUs at 2.23GHz"},
    {"name": "Memory", "value": "16GB GDDR6/256-bit"},
    {"name": "Storage", "value": "825GB Custom SSD"},
    {"name": "Resolution", "value": "Up to 8K"},
    {"name": "Frame Rate", "value": "Up to 120fps"},
    {"name": "Ray Tracing", "value": "Yes"},
    {"name": "Backwards Compatibility", "value": "PS4 games"}
]' WHERE sku = 'PS5-CONSOLE-001';

UPDATE products SET specifications = '[
    {"name": "Battery Life", "value": "Up to 12 hours"},
    {"name": "Connectivity", "value": "Bluetooth 5.1, USB-C"},
    {"name": "Haptic Feedback", "value": "Yes"},
    {"name": "Adaptive Triggers", "value": "Yes"},
    {"name": "Built-in Microphone", "value": "Yes"},
    {"name": "Headphone Jack", "value": "3.5mm"}
]' WHERE sku = 'DS-CONTROLLER-001';

UPDATE products SET specifications = '[
    {"name": "Platform", "value": "PlayStation 5, PlayStation 4"},
    {"name": "Genre", "value": "Action-Adventure"},
    {"name": "Rating", "value": "Mature 17+"},
    {"name": "Developer", "value": "Santa Monica Studio"},
    {"name": "Publisher", "value": "Sony Interactive Entertainment"},
    {"name": "Release Date", "value": "November 9, 2022"}
]' WHERE sku = 'GOW-RAGNAROK-001';

-- =============================================
-- Create Views for Common Queries
-- =============================================

-- View for product catalog with category info
CREATE OR REPLACE VIEW product_catalog AS
SELECT 
    p.id,
    p.name,
    p.short_description,
    p.description,
    p.price,
    p.original_price,
    p.image_url,
    p.sku,
    p.badge,
    p.stock_quantity,
    p.is_featured,
    p.created_at,
    c.name as category_name,
    c.slug as category_slug,
    c.icon as category_icon
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.is_active = TRUE AND c.is_active = TRUE;

-- View for category product counts
CREATE OR REPLACE VIEW category_stats AS
SELECT 
    c.id,
    c.name,
    c.slug,
    c.icon,
    COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
WHERE c.is_active = TRUE
GROUP BY c.id, c.name, c.slug, c.icon;

-- =============================================
-- Create Stored Procedures
-- =============================================

-- Procedure to get featured products
DELIMITER //
CREATE PROCEDURE GetFeaturedProducts(IN limit_count INT)
BEGIN
    SELECT * FROM product_catalog 
    WHERE is_featured = TRUE 
    ORDER BY created_at DESC 
    LIMIT limit_count;
END //
DELIMITER ;

-- Procedure to get products by category
DELIMITER //
CREATE PROCEDURE GetProductsByCategory(IN category_slug VARCHAR(255), IN page INT, IN page_size INT)
BEGIN
    DECLARE offset_val INT;
    SET offset_val = (page - 1) * page_size;
    
    SELECT * FROM product_catalog 
    WHERE category_slug = category_slug 
    ORDER BY created_at DESC 
    LIMIT page_size OFFSET offset_val;
END //
DELIMITER ;

-- Procedure to create a new order
DELIMITER //
CREATE PROCEDURE CreateOrder(
    IN p_user_id INT,
    IN p_customer_name VARCHAR(255),
    IN p_customer_email VARCHAR(255),
    IN p_customer_phone VARCHAR(20),
    IN p_shipping_address TEXT,
    IN p_billing_address TEXT,
    IN p_payment_method ENUM('credit_card', 'apple_pay', 'shop_pay', 'cash_on_delivery')
)
BEGIN
    DECLARE order_number VARCHAR(100);
    DECLARE new_order_id INT;
    
    -- Generate order number
    SET order_number = CONCAT('GLM', DATE_FORMAT(NOW(), '%Y%m%d'), '-', FLOOR(RAND() * 10000));
    
    -- Insert order
    INSERT INTO orders (user_id, order_number, customer_name, customer_email, customer_phone, shipping_address, billing_address, payment_method)
    VALUES (p_user_id, order_number, p_customer_name, p_customer_email, p_customer_phone, p_shipping_address, p_billing_address, p_payment_method);
    
    SET new_order_id = LAST_INSERT_ID();
    
    -- Return the new order ID and number
    SELECT new_order_id as order_id, order_number;
END //
DELIMITER ;

-- =============================================
-- Create Triggers
-- =============================================

-- Trigger to update product stock after order is created
DELIMITER //
CREATE TRIGGER AfterOrderItemInsert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE products 
    SET stock_quantity = stock_quantity - NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
END //
DELIMITER ;

-- Trigger to update order total when items are added
DELIMITER //
CREATE TRIGGER AfterOrderItemInsertUpdateTotal
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders 
    SET total_amount = (
        SELECT SUM(total_price) 
        FROM order_items 
        WHERE order_id = NEW.order_id
    )
    WHERE id = NEW.order_id;
END //
DELIMITER ;

-- =============================================
-- Sample Order Data (for testing)
-- =============================================

-- Insert a sample order
INSERT INTO orders (user_id, order_number, total_amount, status, shipping_address, billing_address, customer_name, customer_email, customer_phone, payment_method, payment_status) 
VALUES (
    (SELECT id FROM users WHERE email = 'john.banda@email.com'),
    'GLM20241201-0001',
    1400000.00,
    'confirmed',
    'Area 3, Lilongwe, Malawi',
    'Area 3, Lilongwe, Malawi',
    'John Banda',
    'john.banda@email.com',
    '+265 992 345 678',
    'cash_on_delivery',
    'paid'
);

-- Insert order items for the sample order
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) 
VALUES 
(
    (SELECT id FROM orders WHERE order_number = 'GLM20241201-0001'),
    (SELECT id FROM products WHERE sku = 'PS5-CONSOLE-001'),
    1,
    1250000.00,
    1250000.00
),
(
    (SELECT id FROM orders WHERE order_number = 'GLM20241201-0001'),
    (SELECT id FROM products WHERE sku = 'DS-CONTROLLER-001'),
    1,
    250000.00,
    250000.00
);

-- =============================================
-- Database User Creation (Optional)
-- =============================================

-- Create a dedicated database user (run these separately in MySQL Workbench)
/*
CREATE USER 'gamelootmalawi_user'@'localhost' IDENTIFIED BY 'secure_password_123';
GRANT SELECT, INSERT, UPDATE, DELETE ON gamelootmalawi.* TO 'gamelootmalawi_user'@'localhost';
FLUSH PRIVILEGES;
*/

-- =============================================
-- Verification Queries
-- =============================================

-- Verify categories
SELECT 'Categories:' as '';
SELECT * FROM categories;

-- Verify products
SELECT 'Products:' as '';
SELECT p.name, p.price, c.name as category, p.stock_quantity 
FROM products p 
JOIN categories c ON p.category_id = c.id;

-- Verify users
SELECT 'Users:' as '';
SELECT name, email, role FROM users;

-- Verify product catalog view
SELECT 'Product Catalog:' as '';
SELECT name, price, category_name, stock_quantity 
FROM product_catalog 
LIMIT 5;

-- Verify category stats
SELECT 'Category Statistics:' as '';
SELECT * FROM category_stats;

-- Test stored procedure
SELECT 'Featured Products:' as '';
CALL GetFeaturedProducts(3);

SELECT 'Console Products:' as '';
CALL GetProductsByCategory('consoles', 1, 5);
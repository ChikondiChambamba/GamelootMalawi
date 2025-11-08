-- Create database
CREATE DATABASE IF NOT EXISTS gamelootmalawi;
USE gamelootmalawi;

-- Categories table
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

-- Products table
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
    INDEX idx_active (is_active)
);

-- Users table
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
    INDEX idx_email (email)
);

-- Orders table
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
    INDEX idx_status (status)
);

-- Order items table
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
    INDEX idx_order (order_id)
);

-- Cart table (for logged-in users)
CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id)
);

-- Insert sample categories
INSERT IGNORE INTO categories (name, description, icon, slug) VALUES
('Consoles', 'PS5, PS4, Xbox & Nintendo', 'fas fa-gamepad', 'consoles'),
('Games', 'Latest titles & classics', 'fas fa-compact-disc', 'games'),
('Accessories', 'Controllers, headsets & more', 'fas fa-headphones', 'accessories'),
('Electronics', 'Phones, gadgets & gear', 'fas fa-mobile-alt', 'electronics');

-- Insert sample products
INSERT IGNORE INTO products (name, description, short_description, price, original_price, category_id, image_url, sku, badge, is_featured) VALUES
(
    'PlayStation 5 Console',
    'Experience lightning-fast loading with an ultra-high speed SSD, deeper immersion with support for haptic feedback, adaptive triggers and 3D Audio, and an all-new generation of incredible PlayStation games.',
    'Next-gen gaming console with ultra-high speed SSD',
    1250000.00,
    1400000.00,
    1,
    'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'PS5-CONSOLE-001',
    'new',
    TRUE
),
(
    'DualSense Wireless Controller',
    'Discover a deeper, highly immersive gaming experience with the innovative DualSense wireless controller.',
    'Wireless controller with haptic feedback',
    250000.00,
    300000.00,
    3,
    'https://images.unsplash.com/photo-1593305841991-05c297ba4575?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'DS-CONTROLLER-001',
    'sale',
    TRUE
),
(
    'God of War: Ragnarök',
    'Embark on an epic and heartfelt journey as Kratos and Atreus struggle with holding on and letting go.',
    'Epic action-adventure game',
    150000.00,
    NULL,
    2,
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'GOW-RAGNAROK-001',
    'none',
    TRUE
),
(
    'Wireless Gaming Headset',
    'Immerse yourself in your games with high-quality sound and comfortable design.',
    'Premium wireless gaming headset',
    180000.00,
    220000.00,
    3,
    'https://images.unsplash.com/photo-1607853554439-0069ec0f29b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'WIRELESS-HEADSET-001',
    'hot',
    TRUE
),
(
    'iPhone 15 Pro Max',
    'The most advanced iPhone with titanium design, A17 Pro chip, and professional camera system.',
    'Latest iPhone with titanium design',
    2800000.00,
    3200000.00,
    4,
    'https://images.unsplash.com/photo-1512054502232-10a0a035d672?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'IPHONE15-PROMAX-001',
    'none',
    TRUE
),
(
    'Premium Gaming Chair',
    'Ergonomic gaming chair with lumbar support and adjustable features for long gaming sessions.',
    'Comfortable ergonomic gaming chair',
    650000.00,
    NULL,
    3,
    'https://images.unsplash.com/photo-1600003263720-95b45a4035d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
    'GAMING-CHAIR-001',
    'none',
    TRUE
);

-- Create admin user (password: admin123)
INSERT IGNORE INTO users (name, email, password, role) VALUES
('Admin User', 'admin@gamelootmalawi.com', '$2a$10$8F8X8c8X8c8X8c8X8c8X8.X8c8X8c8X8c8X8c8X8c8X8c8X8c8X8c', 'admin');
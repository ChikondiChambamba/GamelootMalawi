// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            // toggle body scroll when menu open
            document.body.classList.toggle('nav-open');
        });
    }

    // Cart functionality
    const cartIcon = document.getElementById('cart-icon');
    const cartCount = document.querySelector('.cart-count');
    
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            addToCart(productId, 1);
        });
    });

    // Wishlist functionality removed — favorite buttons no longer present

    // View details buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            viewProductDetails(productId);
        });
    });

    // User dropdown: toggle on click instead of hover
    const userDropdown = document.querySelector('.user-dropdown');
    if (userDropdown) {
        userDropdown.addEventListener('click', function(e) {
            // Toggle open class
            this.classList.toggle('open');
            e.stopPropagation();
        });

        // Close when clicking outside
        document.addEventListener('click', function() {
            if (userDropdown.classList.contains('open')) {
                userDropdown.classList.remove('open');
            }
        });

        // Close on Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && userDropdown.classList.contains('open')) {
                userDropdown.classList.remove('open');
            }
        });
    }

    // Delegated handlers for cart controls (works even if cart HTML rendered later)
    document.addEventListener('click', function(e) {
        const dec = e.target.closest('.decrease-quantity');
        const inc = e.target.closest('.increase-quantity');
        const removeBtn = e.target.closest('.cart-item-remove');

        if (dec) {
            const productId = dec.getAttribute('data-product-id');
            const input = document.querySelector(`.quantity-input[data-product-id="${productId}"]`);
            let qty = parseInt(input.value) || 1;
            if (qty > 1) updateCartItemServer(productId, qty - 1);
            return;
        }

        if (inc) {
            const productId = inc.getAttribute('data-product-id');
            const input = document.querySelector(`.quantity-input[data-product-id="${productId}"]`);
            let qty = parseInt(input.value) || 0;
            updateCartItemServer(productId, qty + 1);
            return;
        }

        if (removeBtn) {
            const productId = removeBtn.getAttribute('data-product-id');
            removeFromCartServer(productId);
            return;
        }
    });

    // Delegated handler for quantity input changes
    document.addEventListener('change', function(e) {
        const input = e.target.closest('.quantity-input');
        if (input) {
            const productId = input.getAttribute('data-product-id');
            const qty = parseInt(input.value) || 1;
            if (qty > 0) updateCartItemServer(productId, qty);
        }
    });

    // Search functionality
// Add to cart function
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            const searchInput = this.querySelector('input[name="search"]');
            if (!searchInput.value.trim()) {
                e.preventDefault();
            }
        });
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // In a real implementation, this would filter the products
            // For now, we'll just show a message
            console.log('Filter applied:', this.textContent);
        });
    });

    // Initialize any other components
    initComponents();
});

// Add to cart function
function addToCart(productId, quantity = 1) {
    fetch('/cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update cart count
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                cartCount.textContent = data.cartCount;
            }
            
            // Show success message
            showNotification(data.message, 'success');
            
            // Optional: Open cart sidebar
            // openCartSidebar();
        } else {
            if (data.requireLogin) {
                // Show login required message and redirect to login
                showNotification(data.message, 'error');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            } else {
                showNotification(data.message, 'error');
            }
        }
    })
    .catch(error => {
        console.error('Error adding to cart:', error);
        showNotification('Error adding product to cart', 'error');
    });
}

// Update cart item on server
function updateCartItemServer(productId, quantity) {
    fetch('/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            const cartCountEl = document.querySelector('.cart-count');
            if (cartCountEl && typeof data.cartCount !== 'undefined') cartCountEl.textContent = data.cartCount;
            // reload to ensure totals update correctly
            location.reload();
        } else {
            showNotification(data.message || 'Error updating cart', 'error');
        }
    })
    .catch(err => {
        console.error('Update cart error:', err);
        showNotification('Error updating cart', 'error');
    });
}

// Remove cart item on server
function removeFromCartServer(productId) {
    fetch('/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            const cartCountEl = document.querySelector('.cart-count');
            if (cartCountEl && typeof data.cartCount !== 'undefined') cartCountEl.textContent = data.cartCount;
            location.reload();
        } else {
            showNotification(data.message || 'Error removing item', 'error');
        }
    })
    .catch(err => {
        console.error('Remove cart error:', err);
        showNotification('Error removing item from cart', 'error');
    });
}

// View product details
function viewProductDetails(productId) {
    // Redirect to product detail page
    window.location.href = `/product/${productId}`;
}


// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `flash-message ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
        <button class="flash-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to flash messages container
    const flashContainer = document.querySelector('.flash-messages');
    if (!flashContainer) {
        // Create container if it doesn't exist
        const container = document.createElement('div');
        container.className = 'flash-messages';
        document.body.appendChild(container);
        container.appendChild(notification);
    } else {
        flashContainer.appendChild(notification);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Initialize components
function initComponents() {
    // Any additional component initialization
    console.log('GameLootMalawi initialized');
}

// Utility function to format currency
function formatCurrency(amount) {
    return 'MK ' + amount.toLocaleString();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { addToCart, showNotification, formatCurrency };
}

// IntersectionObserver for animate-on-scroll
document.addEventListener('DOMContentLoaded', function() {
    const animated = document.querySelectorAll('.animate-on-scroll');
    const hero = document.querySelector('.hero-content');

    if (hero) {
        setTimeout(() => hero.classList.add('visible'), 150);
    }

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        animated.forEach(el => io.observe(el));
    } else {
        // fallback: just show
        animated.forEach(el => el.classList.add('in-view'));
    }
});
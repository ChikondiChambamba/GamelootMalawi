// Main JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
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

    // View details buttons
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            viewProductDetails(productId);
        });
    });

    // Search functionality
    const searchForm = document.querySelector('.search-form');
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
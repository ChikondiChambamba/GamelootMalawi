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
    const searchForm = document.querySelector('.search-form');
    const heroController = document.querySelector('.hero-controller');
    const heroSection = document.querySelector('.hero');

    if (heroController && heroSection) {
        initCatchMeController(heroController, heroSection);
    }
    
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
            if (!input) return;
            let qty = parseInt(input.value) || 1;
            if (qty > 1) updateCartItemServer(productId, qty - 1);
            return;
        }

        if (inc) {
            const productId = inc.getAttribute('data-product-id');
            const input = document.querySelector(`.quantity-input[data-product-id="${productId}"]`);
            if (!input) return;
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
        <button class="flash-close" type="button">
            <i class="fas fa-times"></i>
        </button>
    `;
    const closeBtn = notification.querySelector('.flash-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            notification.remove();
        });
    }
    
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

function initCatchMeController(controller, hero) {
    let x = 24;
    let y = 24;
    let vx = 260;
    let vy = 210;
    let lastTs = performance.now();
    let nextWobbleAt = lastTs + 900;
    let locked = false;
    const margin = 8;
    const fastSpeed = 360;

    function bounds() {
        const maxX = Math.max(margin, hero.clientWidth - controller.offsetWidth - margin);
        const maxY = Math.max(margin, hero.clientHeight - controller.offsetHeight - margin);
        return { maxX, maxY };
    }

    function clampPosition() {
        const { maxX, maxY } = bounds();
        x = Math.max(margin, Math.min(maxX, x));
        y = Math.max(margin, Math.min(maxY, y));
    }

    function setPosition() {
        controller.style.left = `${Math.round(x)}px`;
        controller.style.top = `${Math.round(y)}px`;
    }

    function randomizeVelocity(boost = 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (fastSpeed + Math.random() * 190) * boost;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
    }

    function evadeFrom(px, py, teleportChance = 0.35) {
        const rect = controller.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = cx - px;
        let dy = cy - py;
        const len = Math.max(1, Math.hypot(dx, dy));
        dx /= len;
        dy /= len;
        vx = dx * (fastSpeed + Math.random() * 260);
        vy = dy * (fastSpeed + Math.random() * 260);

        if (Math.random() < teleportChance) {
            const { maxX, maxY } = bounds();
            x = margin + Math.random() * (maxX - margin);
            y = margin + Math.random() * (maxY - margin);
            setPosition();
        }
    }

    function setProgressText(progress) {
        const label = controller.querySelector('.hero-controller-text');
        if (!label || !progress) return;
        label.textContent = `Catch me and win a reward (${progress.coupons}/100)`;
    }

    async function loadProgress() {
        try {
            const response = await fetch('/rewards/status');
            const data = await response.json();
            if (data.success && data.progress) setProgressText(data.progress);
        } catch (err) {
            // intentionally silent for UX
        }
    }

    async function tryClaimCoupon() {
        if (locked) return;
        locked = true;
        try {
            const response = await fetch('/rewards/catch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await response.json();

            if (data.requireLogin) {
                showNotification('Login required to claim coupons', 'error');
                setTimeout(() => { window.location.href = '/login'; }, 1200);
                return;
            }

            if (data.progress) setProgressText(data.progress);
            if (data.success) {
                showNotification(data.message || 'Coupon captured!', 'success');
            } else if (data.cooldown) {
                showNotification(data.message || 'Too fast, try again shortly.', 'error');
            } else {
                showNotification(data.message || 'Could not claim coupon', 'error');
            }
        } catch (err) {
            console.error('Claim coupon error:', err);
            showNotification('Could not claim coupon', 'error');
        } finally {
            setTimeout(() => { locked = false; }, 250);
        }
    }

    controller.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        tryClaimCoupon();
    });

    // Make it difficult to click: most pointer downs trigger an evade burst.
    controller.addEventListener('pointerdown', function(e) {
        if (Math.random() < 0.82) {
            evadeFrom(e.clientX, e.clientY, 0.5);
            e.preventDefault();
            e.stopPropagation();
        }
    });

    hero.addEventListener('mousemove', function(e) {
        const rect = controller.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(cx - e.clientX, cy - e.clientY);
        if (dist < 220) {
            evadeFrom(e.clientX, e.clientY, 0.25);
        }
    });

    hero.addEventListener('touchmove', function(e) {
        const t = e.touches && e.touches[0];
        if (!t) return;
        const rect = controller.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(cx - t.clientX, cy - t.clientY);
        if (dist < 170) {
            evadeFrom(t.clientX, t.clientY, 0.35);
        }
    }, { passive: true });

    function tick(ts) {
        const dt = Math.min(0.03, (ts - lastTs) / 1000);
        lastTs = ts;

        if (ts > nextWobbleAt) {
            vx += (Math.random() - 0.5) * 240;
            vy += (Math.random() - 0.5) * 240;
            nextWobbleAt = ts + 700 + Math.random() * 1000;
        }

        x += vx * dt;
        y += vy * dt;

        const { maxX, maxY } = bounds();
        if (x <= margin || x >= maxX) {
            vx *= -1;
            x = Math.max(margin, Math.min(maxX, x));
        }
        if (y <= margin || y >= maxY) {
            vy *= -1;
            y = Math.max(margin, Math.min(maxY, y));
        }

        const spin = Math.sin(ts / 160) * 8;
        controller.style.transform = `rotate(${spin}deg)`;
        setPosition();
        requestAnimationFrame(tick);
    }

    clampPosition();
    setPosition();
    randomizeVelocity(1);
    loadProgress();
    requestAnimationFrame(tick);

    window.addEventListener('resize', function() {
        clampPosition();
        setPosition();
    });
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

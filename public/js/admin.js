// Admin-specific JavaScript
(function() {
    console.error('🔴 ADMIN.JS INITIALIZING - Check browser console NOW');
    
    // Check if script is running
    window.adminJsLoaded = true;
    
    // Immediate DOM checks
    const adminContainer = document.querySelector('[data-admin-products]');
    if (adminContainer) {
        console.error('✓ Admin Products container found');
    } else {
        console.error('✗ Admin Products container NOT found - checking for modals instead');
        const modals = document.querySelectorAll('.modal');
        console.error('Found ' + modals.length + ' modals on page');
    }
})();

// Wait for DOM when adding listeners
document.addEventListener('DOMContentLoaded', function() {
    console.error('🟢 DOMContentLoaded - Setting up event listeners');
    
    // Initialize Bootstrap modals
    try {
        const modals = document.querySelectorAll('.modal');
        console.log('Found ' + modals.length + ' modals to initialize');
        modals.forEach(function(modalEl) {
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                new bootstrap.Modal(modalEl);
                console.log('Initialized modal:', modalEl.id);
            }
        });
    } catch (err) {
        console.warn('Could not initialize modals:', err);
    }

    // Helper function to open modal by ID
    function openModal(modalId) {
        const modalEl = document.getElementById(modalId);
        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modal.show();
            console.log('Opened modal:', modalId);
        } else {
            console.warn('Could not open modal:', modalId);
        }
    }
    
    // Helper function to close modal by ID
    function closeModal(modalId) {
        const modalEl = document.getElementById(modalId);
        if (modalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) {
                modal.hide();
                console.log('Closed modal:', modalId);
            }
        }
    }

    // Edit Product handlers - use event delegation
    document.addEventListener('click', function(e) {
        const editBtn = e.target.closest('.edit-product');
        if (!editBtn) return;
        
        console.log('Edit button clicked');
        const productJson = editBtn.getAttribute('data-product');
        if (!productJson) {
            console.error('No product data found on edit button');
            return;
        }

        let product;
        try {
            product = JSON.parse(productJson);
        } catch (err) {
            console.error('Failed to parse product JSON for edit modal', err, productJson);
            return;
        }

        // Fill hidden id field
        const editProductId = document.getElementById('editProductId');
        if (editProductId) editProductId.value = product.id || '';

        // Fill simple fields
        const form = document.getElementById('editProductForm');
        if (!form) {
            console.error('Edit form not found');
            return;
        }

        form.elements['name'].value = product.name || '';
        form.elements['price'].value = product.price || '';
        form.elements['original_price'].value = product.original_price || '';
        form.elements['stock_quantity'].value = product.stock_quantity || '';
        form.elements['short_description'].value = product.short_description || '';
        form.elements['description'].value = product.description || '';
        if (form.elements['badge']) form.elements['badge'].value = product.badge || '';

        // Category select expects category name
        if (form.elements['category_name']) {
            form.elements['category_name'].value = product.category_name || '';
        }

        // is_featured checkbox
        const featuredInput = form.querySelector('input[name="is_featured"]');
        if (featuredInput) {
            featuredInput.checked = !!product.is_featured;
        }

        // Current image preview
        const previewContainer = document.querySelector('.current-image-preview');
        if (previewContainer) {
            previewContainer.innerHTML = '';
            const img = document.createElement('img');
            img.src = product.image_url || '/images/no-image.png';
            img.alt = product.name || '';
            img.style.maxWidth = '150px';
            previewContainer.appendChild(img);
        }

        // Specifications (if available and simple array/object)
        try {
            const specsContainer = document.querySelector('#editSpecificationsContainer .specifications-list');
            if (specsContainer) {
                specsContainer.innerHTML = '';
                let specs = product.specifications || null;
                if (typeof specs === 'string') specs = JSON.parse(specs || '[]');
                if (Array.isArray(specs)) {
                    specs.forEach(spec => {
                        const row = document.createElement('div');
                        row.className = 'specification-row mb-2';
                        row.innerHTML = `
                            <div class="row">
                                <div class="col-5">
                                    <input type="text" class="form-control" name="spec_names[]" value="${(spec.name||'')}" required>
                                </div>
                                <div class="col-5">
                                    <input type="text" class="form-control" name="spec_values[]" value="${(spec.value||'')}" required>
                                </div>
                                <div class="col-2">
                                    <button type="button" class="btn btn-danger btn-sm remove-spec">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                        specsContainer.appendChild(row);
                    });
                }
            }
        } catch (err) {
            console.warn('Could not populate specifications for edit modal', err);
        }
        
        // Open edit modal
        openModal('editProductModal');
    });

        // Add Specification Button Handler
        const addSpecBtn = document.getElementById('addSpecification');
        if (addSpecBtn) {
            addSpecBtn.addEventListener('click', function() {
                const specList = document.querySelector('.specifications-list');
                const specRow = document.createElement('div');
                specRow.className = 'specification-row mb-2';
                specRow.innerHTML = `
                    <div class="row">
                        <div class="col-5">
                            <input type="text" class="form-control" name="spec_names[]" placeholder="Name" required>
                        </div>
                        <div class="col-5">
                            <input type="text" class="form-control" name="spec_values[]" placeholder="Value" required>
                        </div>
                        <div class="col-2">
                            <button type="button" class="btn btn-danger btn-sm remove-spec">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                `;
                specList.appendChild(specRow);
            });
        }

        // Handle Specification Removal - use event delegation
        document.addEventListener('click', function(e) {
            if (e.target.closest('.remove-spec')) {
                e.target.closest('.specification-row').remove();
            }
        });

        // Add Product Form Handling
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        console.log('Add product form found, attaching handlers');
        addProductForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Add product form submitted');
            
                // Validate form
                if (!this.checkValidity()) {
                    this.reportValidity();
                    return;
                }
            
            // Get form data
            const formData = new FormData(this);
            
            try {
                const response = await fetch('/admin/products', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                console.log('Add product response:', result);
                
                if (result.success) {
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
                    modal.hide();
                    
                    // Show success message (non-blocking)
                    console.log('Product added successfully!');
                    
                    // Reload page to show new product
                    window.location.reload();
                } else {
                    console.error(result.message || 'Error adding product');
                }
            } catch (error) {
                console.error('Error:', error);
                console.error('Error adding product. Please try again.');
            }
        });
    }

    // Support clicking the modal footer button which is type="button".
    const submitAddBtn = document.getElementById('submitAddProduct');
    if (submitAddBtn) {
        console.log('Add product submit button found, attaching listener');
        submitAddBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Add product submit button clicked');
            const addProductForm = document.getElementById('addProductForm');
            if (addProductForm) {
                // Use requestSubmit if available to trigger form submit and validation
                if (typeof addProductForm.requestSubmit === 'function') {
                    console.log('Calling requestSubmit on add form');
                    addProductForm.requestSubmit();
                } else {
                    // Fallback: trigger submit event
                    console.log('Dispatching submit event on add form');
                    addProductForm.dispatchEvent(new Event('submit', { cancelable: true }));
                }
            } else {
                console.error('Add product form not found');
            }
        });
    } else {
        console.warn('Add product submit button not found');
    }

    // Edit product form handling (modal footer button is a button, so handle click)
    const editProductForm = document.getElementById('editProductForm');
    const submitEditBtn = document.getElementById('submitEditProduct');
    if (editProductForm && submitEditBtn) {
        console.log('Edit product button found, attaching click handler');
        submitEditBtn.addEventListener('click', async function() {
            console.log('Edit product button clicked');
            // Basic validation
            if (!editProductForm.checkValidity()) {
                editProductForm.reportValidity();
                return;
            }

            const formData = new FormData(editProductForm);
            const productId = editProductForm.elements.productId ? editProductForm.elements.productId.value : null;
            if (!productId) {
                console.error('Missing product id');
                return;
            }

            try {
                const response = await fetch(`/admin/products/${productId}`, {
                    method: 'PUT',
                    body: formData
                });

                const result = await response.json();
                console.log('Edit product response:', result);
                if (result.success) {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
                    if (modal) modal.hide();
                    console.log('Product updated successfully');
                    window.location.reload();
                } else {
                    console.error(result.message || 'Error updating product');
                }
            } catch (err) {
                console.error('Error updating product:', err);
                console.error('Error updating product');
            }
        });
    }

        // Product deletion - use event delegation
        document.addEventListener('click', async function(e) {
            const deleteBtn = e.target.closest('.delete-product');
            if (!deleteBtn) return;
            
            console.log('Delete button clicked');
            const productId = deleteBtn.dataset.productId;
            const productName = deleteBtn.dataset.productName;
        
            if (confirm(`Are you sure you want to delete "${productName}"?`)) {
                try {
                    const response = await fetch(`/admin/products/${productId}`, {
                        method: 'DELETE'
                    });
                
                    const result = await response.json();
                    console.log('Delete response:', result);
                
                    if (result.success) {
                        console.log('Product deleted successfully!');
                        window.location.reload();
                    } else {
                        console.error(result.message || 'Error deleting product');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    console.error('Error deleting product. Please try again.');
                }
            }
        });

    console.log('Admin.js initialization complete');
});
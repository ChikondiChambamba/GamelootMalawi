// Admin-specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modals
    var modals = document.querySelectorAll('.modal');
    modals.forEach(function(modal) {
        new bootstrap.Modal(modal);
    });

    // Populate Edit Product Modal when an edit button is clicked
    document.querySelectorAll('.edit-product').forEach(function(button) {
        button.addEventListener('click', function() {
            const productJson = this.getAttribute('data-product');
            if (!productJson) return;

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
            if (!form) return;

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
                // ignore spec parsing errors
                console.warn('Could not populate specifications for edit modal', err);
            }
        });
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

        // Handle Specification Removal
        document.addEventListener('click', function(e) {
            if (e.target.closest('.remove-spec')) {
                e.target.closest('.specification-row').remove();
            }
        });

        // Add Product Form Handling
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
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
                
                if (result.success) {
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
                    modal.hide();
                    
                    // Show success message
                    alert('Product added successfully!');
                    
                    // Reload page to show new product
                    window.location.reload();
                } else {
                    alert(result.message || 'Error adding product');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error adding product. Please try again.');
            }
        });
    }

    // Support clicking the modal footer button which is type="button".
    const submitAddBtn = document.getElementById('submitAddProduct');
    if (submitAddBtn && addProductForm) {
        submitAddBtn.addEventListener('click', function() {
            // Use requestSubmit if available to trigger form submit and validation
            if (typeof addProductForm.requestSubmit === 'function') {
                addProductForm.requestSubmit();
            } else {
                // Fallback: trigger submit event
                addProductForm.dispatchEvent(new Event('submit', { cancelable: true }));
            }
        });
    }

    // Edit product form handling (modal footer button is a button, so handle click)
    const editProductForm = document.getElementById('editProductForm');
    const submitEditBtn = document.getElementById('submitEditProduct');
    if (editProductForm && submitEditBtn) {
        submitEditBtn.addEventListener('click', async function() {
            // Basic validation
            if (!editProductForm.checkValidity()) {
                editProductForm.reportValidity();
                return;
            }

            const formData = new FormData(editProductForm);
            const productId = editProductForm.elements.productId ? editProductForm.elements.productId.value : null;
            if (!productId) {
                alert('Missing product id');
                return;
            }

            try {
                const response = await fetch(`/admin/products/${productId}`, {
                    method: 'PUT',
                    body: formData
                });

                const result = await response.json();
                if (result.success) {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
                    if (modal) modal.hide();
                    alert('Product updated successfully');
                    window.location.reload();
                } else {
                    alert(result.message || 'Error updating product');
                }
            } catch (err) {
                console.error('Error updating product:', err);
                alert('Error updating product');
            }
        });
    }

        // Product deletion
        const deleteButtons = document.querySelectorAll('.delete-product');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async function() {
                const productId = this.dataset.productId;
                const productName = this.dataset.productName;
            
                if (confirm(`Are you sure you want to delete "${productName}"?`)) {
                    try {
                        const response = await fetch(`/admin/products/${productId}`, {
                            method: 'DELETE'
                        });
                    
                        const result = await response.json();
                    
                        if (result.success) {
                            alert('Product deleted successfully!');
                            window.location.reload();
                        } else {
                            alert(result.message || 'Error deleting product');
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Error deleting product. Please try again.');
                    }
                }
            });
        });
});
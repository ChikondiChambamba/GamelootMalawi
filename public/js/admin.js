// Admin-specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modals
    var modals = document.querySelectorAll('.modal');
    modals.forEach(function(modal) {
        new bootstrap.Modal(modal);
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
(function () {
  function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  }

  function adminFetch(url, options = {}) {
    const opts = { ...options };
    opts.headers = { ...(options.headers || {}) };
    const token = getCsrfToken();
    if (token) opts.headers['X-CSRF-Token'] = token;
    return fetch(url, opts);
  }

  function openModal(modalId) {
    const modalEl = document.getElementById(modalId);
    if (!modalEl || typeof bootstrap === 'undefined' || !bootstrap.Modal) return;
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.show();
  }

  function closeModal(modalId) {
    const modalEl = document.getElementById(modalId);
    if (!modalEl || typeof bootstrap === 'undefined' || !bootstrap.Modal) return;
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }

  function safeJsonParse(text, fallback = null) {
    try {
      return JSON.parse(text);
    } catch (e) {
      return fallback;
    }
  }

  function initModals() {
    if (typeof bootstrap === 'undefined' || !bootstrap.Modal) return;
    document.querySelectorAll('.modal').forEach((modalEl) => {
      // eslint-disable-next-line no-new
      new bootstrap.Modal(modalEl);
    });
  }

  function initEditButtons() {
    document.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.edit-product');
      if (!editBtn) return;

      const product = safeJsonParse(editBtn.getAttribute('data-product'));
      if (!product) return;

      const form = document.getElementById('editProductForm');
      if (!form) return;

      const editProductId = document.getElementById('editProductId');
      if (editProductId) editProductId.value = product.id || '';

      if (form.elements.name) form.elements.name.value = product.name || '';
      if (form.elements.price) form.elements.price.value = product.price || '';
      if (form.elements.original_price) form.elements.original_price.value = product.original_price || '';
      if (form.elements.stock_quantity) form.elements.stock_quantity.value = product.stock_quantity || '';
      if (form.elements.short_description) form.elements.short_description.value = product.short_description || '';
      if (form.elements.description) form.elements.description.value = product.description || '';
      if (form.elements.badge) form.elements.badge.value = product.badge || '';
      if (form.elements.category_name) form.elements.category_name.value = product.category_name || '';

      const featuredInput = form.querySelector('input[name="is_featured"]');
      if (featuredInput) featuredInput.checked = !!product.is_featured;

      const previewContainer = document.querySelector('.current-image-preview');
      if (previewContainer) {
        previewContainer.innerHTML = '';
        const img = document.createElement('img');
        img.src = product.image_url || '/images/no-image.png';
        img.alt = product.name || '';
        img.style.maxWidth = '150px';
        previewContainer.appendChild(img);
      }

      const specsContainer = document.querySelector('#editSpecificationsContainer .specifications-list');
      if (specsContainer) {
        specsContainer.innerHTML = '';
        let specs = product.specifications || [];
        if (typeof specs === 'string') specs = safeJsonParse(specs, []);
        if (!Array.isArray(specs)) specs = [];

        specs.forEach((spec) => {
          const row = document.createElement('div');
          row.className = 'specification-row mb-2';
          row.innerHTML = `
            <div class="row">
              <div class="col-5">
                <input type="text" class="form-control" name="spec_names[]" value="${(spec.name || '')}" required>
              </div>
              <div class="col-5">
                <input type="text" class="form-control" name="spec_values[]" value="${(spec.value || '')}" required>
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

      openModal('editProductModal');
    });
  }

  function initSpecificationControls() {
    const addSpecBtn = document.getElementById('addSpecification');
    if (addSpecBtn) {
      addSpecBtn.addEventListener('click', () => {
        const specList = document.querySelector('.specifications-list');
        if (!specList) return;
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

    document.addEventListener('click', (e) => {
      if (e.target.closest('.remove-spec')) {
        const row = e.target.closest('.specification-row');
        if (row) row.remove();
      }
    });
  }

  function initAddProductSubmit() {
    const addProductForm = document.getElementById('addProductForm');
    if (!addProductForm) return;

    addProductForm.addEventListener('submit', async function onAddProductSubmit(e) {
      e.preventDefault();
      if (!this.checkValidity()) {
        this.reportValidity();
        return;
      }

      const formData = new FormData(this);
      try {
        const response = await adminFetch('/admin/products', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        if (result.success) {
          closeModal('addProductModal');
          window.location.reload();
        }
      } catch (err) {
        // no-op
      }
    });

    const submitAddBtn = document.getElementById('submitAddProduct');
    if (submitAddBtn) {
      submitAddBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof addProductForm.requestSubmit === 'function') addProductForm.requestSubmit();
        else addProductForm.dispatchEvent(new Event('submit', { cancelable: true }));
      });
    }
  }

  function initEditProductSubmit() {
    const editProductForm = document.getElementById('editProductForm');
    const submitEditBtn = document.getElementById('submitEditProduct');
    if (!editProductForm || !submitEditBtn) return;

    submitEditBtn.addEventListener('click', async () => {
      if (!editProductForm.checkValidity()) {
        editProductForm.reportValidity();
        return;
      }

      const formData = new FormData(editProductForm);
      const productId = editProductForm.elements.productId ? editProductForm.elements.productId.value : null;
      if (!productId) return;

      try {
        const response = await adminFetch(`/admin/products/${productId}`, {
          method: 'PUT',
          body: formData
        });
        const result = await response.json();
        if (result.success) {
          closeModal('editProductModal');
          window.location.reload();
        }
      } catch (err) {
        // no-op
      }
    });
  }

  function initDeleteProduct() {
    document.addEventListener('click', async (e) => {
      const deleteBtn = e.target.closest('.delete-product');
      if (!deleteBtn) return;

      const productId = deleteBtn.dataset.productId;
      const productName = deleteBtn.dataset.productName;
      if (!productId) return;

      if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;
      try {
        const response = await adminFetch(`/admin/products/${productId}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) window.location.reload();
      } catch (err) {
        // no-op
      }
    });
  }

  function initAdminOrders() {
    const ordersRoot = document.querySelector('[data-admin-orders]');
    if (!ordersRoot) return;

    document.addEventListener('click', async (e) => {
      const viewBtn = e.target.closest('.view-order');
      if (viewBtn) {
        e.preventDefault();
        const id = viewBtn.getAttribute('data-order-id');
        if (id) window.location.href = `/orders/${id}`;
        return;
      }

      const statusBtn = e.target.closest('.change-status');
      if (!statusBtn) return;
      e.preventDefault();

      const id = statusBtn.getAttribute('data-order-id');
      if (!id) return;
      const newStatus = prompt('Enter new status (pending, confirmed, shipped, delivered, cancelled):');
      if (!newStatus) return;

      try {
        const response = await adminFetch(`/admin/orders/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        const json = await response.json();
        if (json.success) window.location.reload();
      } catch (err) {
        // no-op
      }
    });
  }

  function initAdminOrderDetail() {
    const detailRoot = document.querySelector('[data-admin-order-detail]');
    if (!detailRoot) return;

    const saveBtn = document.getElementById('save-status');
    const select = document.getElementById('status-select');
    const orderId = detailRoot.getAttribute('data-order-id');
    if (!saveBtn || !select || !orderId) return;

    saveBtn.addEventListener('click', async () => {
      try {
        const response = await adminFetch(`/admin/orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: select.value })
        });
        const json = await response.json();
        if (json.success) window.location.reload();
      } catch (err) {
        // no-op
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initModals();
    initEditButtons();
    initSpecificationControls();
    initAddProductSubmit();
    initEditProductSubmit();
    initDeleteProduct();
    initAdminOrders();
    initAdminOrderDetail();
  });
})();

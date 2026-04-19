function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(value) {
  return Number(value || 0).toLocaleString();
}

function buildSalesReportExcel({ records = [], summary = {}, filters = {} } = {}) {
  const rows = records.map((record) => `
    <tr>
      <td>${escapeHtml(record.order_number || record.order_id)}</td>
      <td>${escapeHtml(record.created_at ? new Date(record.created_at).toLocaleString() : '')}</td>
      <td>${escapeHtml(record.product_name)}</td>
      <td>${escapeHtml(record.buyer_name)}</td>
      <td>${escapeHtml(record.buyer_email)}</td>
      <td>${escapeHtml(record.buyer_phone)}</td>
      <td>${escapeHtml(record.quantity)}</td>
      <td>${escapeHtml(money(record.unit_price))}</td>
      <td>${escapeHtml(money(record.total_price))}</td>
      <td>${escapeHtml(record.status)}</td>
      <td>${escapeHtml(record.payment_method)}</td>
    </tr>
  `).join('');

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #cfcfd6; padding: 8px; text-align: left; }
          th { background: #111111; color: #ffffff; }
          .meta td { border: none; padding: 4px 6px; }
          .summary { margin-bottom: 18px; }
        </style>
      </head>
      <body>
        <table class="meta summary">
          <tr><td><strong>GameLootMalawi</strong></td><td><strong>Sales Report Export</strong></td></tr>
          <tr><td>Status Filter</td><td>${escapeHtml(filters.status || 'active')}</td></tr>
          <tr><td>Date From</td><td>${escapeHtml(filters.dateFrom || 'Any')}</td></tr>
          <tr><td>Date To</td><td>${escapeHtml(filters.dateTo || 'Any')}</td></tr>
          <tr><td>Orders</td><td>${escapeHtml(summary.totalOrders || 0)}</td></tr>
          <tr><td>Customers</td><td>${escapeHtml(summary.totalCustomers || 0)}</td></tr>
          <tr><td>Units Sold</td><td>${escapeHtml(summary.totalUnits || 0)}</td></tr>
          <tr><td>Revenue (MWK)</td><td>${escapeHtml(money(summary.totalRevenue))}</td></tr>
        </table>

        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Product</th>
              <th>Buyer</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Quantity</th>
              <th>Unit Price (MWK)</th>
              <th>Line Total (MWK)</th>
              <th>Status</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="11">No sales records found.</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `.trim();
}

module.exports = { buildSalesReportExcel };

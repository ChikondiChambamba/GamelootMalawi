const PDFDocument = require('pdfkit');
const { applyBrandedPdfHeader } = require('./pdfBranding');

function money(value) {
  return `MWK ${Number(value || 0).toLocaleString()}`;
}

function buildFilterLabel(filters = {}) {
  const labels = [];
  if (filters.status && filters.status !== 'active') labels.push(`Status: ${filters.status}`);
  if (filters.status === 'active') labels.push('Status: active sales');
  if (filters.dateFrom) labels.push(`From: ${filters.dateFrom}`);
  if (filters.dateTo) labels.push(`To: ${filters.dateTo}`);
  return labels.join(' | ') || 'All recorded sold products';
}

function truncate(value, max = 28) {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

async function buildSalesReportPdf({ records = [], summary = {}, filters = {} } = {}) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  applyBrandedPdfHeader(doc, { title: 'Sales Report' });

  const drawTableHeader = () => {
    const y = doc.y;
    const columns = [
      { key: 'date', label: 'Date', x: 36, width: 78 },
      { key: 'order', label: 'Order #', x: 114, width: 82 },
      { key: 'product', label: 'Product', x: 196, width: 190 },
      { key: 'buyer', label: 'Buyer', x: 386, width: 155 },
      { key: 'qty', label: 'Qty', x: 541, width: 40 },
      { key: 'unit', label: 'Unit', x: 581, width: 84 },
      { key: 'total', label: 'Line Total', x: 665, width: 92 },
      { key: 'status', label: 'Status', x: 757, width: 50 }
    ];

    doc.roundedRect(36, y, 771, 24, 6).fill('#111111');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
    columns.forEach((col) => {
      doc.text(col.label, col.x + 4, y + 7, { width: col.width - 8, align: col.key === 'qty' ? 'center' : 'left' });
    });
    doc.fillColor('#111111').font('Helvetica');
    doc.y = y + 32;
    return columns;
  };

  doc.fontSize(10).fillColor('#555555').text(buildFilterLabel(filters));
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#111111').text('Summary');
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(10);
  doc.text(`Recorded rows: ${Number(summary.totalRecords || 0).toLocaleString()}`);
  doc.text(`Orders: ${Number(summary.totalOrders || 0).toLocaleString()}`);
  doc.text(`Customers: ${Number(summary.totalCustomers || 0).toLocaleString()}`);
  doc.text(`Units sold: ${Number(summary.totalUnits || 0).toLocaleString()}`);
  doc.text(`Revenue: ${money(summary.totalRevenue)}`);
  doc.moveDown(0.8);

  let columns = drawTableHeader();
  let rowY = doc.y;

  records.forEach((record, index) => {
    if (rowY > doc.page.height - 52) {
      doc.addPage();
      columns = drawTableHeader();
      rowY = doc.y;
    }

    if (index % 2 === 0) {
      doc.rect(36, rowY - 3, 771, 22).fill('#f7f7fa');
      doc.fillColor('#111111');
    }

    const values = {
      date: record.created_at ? new Date(record.created_at).toLocaleDateString() : '',
      order: record.order_number || record.order_id,
      product: truncate(record.product_name, 34),
      buyer: truncate(record.buyer_name, 26),
      qty: Number(record.quantity || 0).toLocaleString(),
      unit: money(record.unit_price),
      total: money(record.total_price),
      status: truncate(record.status, 12)
    };

    doc.fontSize(8.5).font('Helvetica').fillColor('#111111');
    columns.forEach((col) => {
      doc.text(String(values[col.key] || ''), col.x + 4, rowY + 3, {
        width: col.width - 8,
        align: col.key === 'qty' ? 'center' : 'left'
      });
    });

    rowY += 22;
  });

  doc.end();
  return await new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

module.exports = { buildSalesReportPdf };

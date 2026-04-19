const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { applyBrandedPdfHeader } = require('./pdfBranding');

async function loadImageBuffer(imageUrl) {
  if (!imageUrl) return null;

  try {
    if (imageUrl.startsWith('/')) {
      const localPath = path.join(process.cwd(), 'public', imageUrl.replace(/^\//, ''));
      if (fs.existsSync(localPath)) return fs.readFileSync(localPath);
      return null;
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const response = await fetch(imageUrl);
      if (!response.ok) return null;
      const ab = await response.arrayBuffer();
      return Buffer.from(ab);
    }
  } catch (err) {
    return null;
  }

  return null;
}

function money(value) {
  return `MWK ${Number(value || 0).toLocaleString()}`;
}

async function buildInvoicePdf({ order, items, shippingAddress }) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  applyBrandedPdfHeader(doc, { title: 'Invoice' });

  doc.fontSize(21).text('Invoice', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#666').text(`Order #: ${order.order_number || order.id}`);
  doc.text(`Date: ${new Date().toLocaleString()}`);
  doc.text(`Customer: ${order.customer_name || 'Customer'}`);
  doc.text(`Email: ${order.customer_email || ''}`);
  doc.text(`Phone: ${order.customer_phone || ''}`);
  doc.text(`Payment Method: ${order.payment_method || 'N/A'}`);
  doc.text(`Shipping: ${shippingAddress || ''}`);
  doc.moveDown(0.8);
  doc.fillColor('#111').fontSize(12).text('Items');
  doc.moveDown(0.4);

  let y = doc.y;
  for (const item of items) {
    if (y > 710) {
      doc.addPage();
      y = doc.y;
    }

    doc.roundedRect(40, y, 515, 84, 8).lineWidth(1).strokeColor('#e6e6e6').stroke();

    const img = await loadImageBuffer(item.image_url);
    if (img) {
      try {
        doc.image(img, 48, y + 8, { fit: [66, 66], align: 'center', valign: 'center' });
      } catch (e) {
        doc.rect(48, y + 8, 66, 66).lineWidth(1).strokeColor('#ddd').stroke();
      }
    } else {
      doc.rect(48, y + 8, 66, 66).lineWidth(1).strokeColor('#ddd').stroke();
      doc.fontSize(8).fillColor('#888').text('No image', 62, y + 38);
    }

    const qty = Number(item.quantity || 1);
    const unit = Number(item.price || item.unit_price || 0);
    const line = qty * unit;

    doc.fillColor('#111').fontSize(11).text(item.name || item.product_name || 'Item', 124, y + 12, { width: 270 });
    doc.fillColor('#555').fontSize(10).text(`Qty: ${qty}`, 124, y + 34);
    doc.text(`Unit: ${money(unit)}`, 124, y + 50);
    doc.fillColor('#111').fontSize(11).text(money(line), 435, y + 33, { width: 110, align: 'right' });

    y += 92;
  }

  if (y > 720) {
    doc.addPage();
    y = doc.y;
  }
  doc.y = y + 6;
  doc.moveDown(0.6);
  doc.fontSize(13).fillColor('#111').text(`Total: ${money(order.total_amount)}`, { align: 'right' });
  doc.moveDown(0.4);
  doc.fontSize(9).fillColor('#777').text('Thank you for shopping with GameLootMalawi.', { align: 'right' });
  doc.end();

  return await new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

module.exports = { buildInvoicePdf };

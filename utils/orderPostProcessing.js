const fs = require('fs');
const logger = require('./logger');
const mailer = require('./mailer');
const { buildInvoicePdf } = require('./invoicePdf');

function resolvePublicUrl(value, siteBaseUrl) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${siteBaseUrl || ''}${raw}`;
}

async function runOrderPostProcessing(payload) {
  const {
    order,
    orderData,
    items,
    totalAmount,
    shippingAddress,
    customerEmail,
    paymentReceiptUrl,
    siteBaseUrl,
    receiptFile
  } = payload || {};

  if (!order || !orderData || !Array.isArray(items) || !customerEmail) {
    throw new Error('Missing required order post-processing payload.');
  }

  const orderRef = order.order_number || order.id;
  const receiptPublicUrl = resolvePublicUrl(paymentReceiptUrl, siteBaseUrl);
  const listItems = items
    .map((item, index) => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.price) || Number(item.unit_price) || 0;
      const lineTotal = qty * unitPrice;
      return `<li>${index + 1}. ${item.name} - Qty ${qty} x MWK ${unitPrice.toLocaleString()} = MWK ${lineTotal.toLocaleString()}</li>`;
    })
    .join('');

  const invoicePdf = await buildInvoicePdf({
    order: {
      ...orderData,
      order_number: orderRef
    },
    items,
    shippingAddress
  });

  const invoiceAttachment = {
    filename: `invoice-${orderRef}.pdf`,
    content: invoicePdf,
    contentType: 'application/pdf'
  };

  const customerHtml = `
    <h2>Order Confirmation</h2>
    <p>Hi ${orderData.customer_name}, your order has been placed successfully.</p>
    <p><strong>Order #:</strong> ${orderRef}</p>
    <p><strong>Total:</strong> MWK ${Number(totalAmount).toLocaleString()}</p>
    <p><strong>Payment Method:</strong> ${orderData.payment_method}</p>
    <p><strong>Shipping Address:</strong> ${shippingAddress}</p>
    ${receiptPublicUrl ? `<p><strong>Payment Receipt:</strong> <a href="${receiptPublicUrl}">View uploaded receipt</a></p>` : ''}
    <h4>Order Items</h4>
    <ul>${listItems}</ul>
  `;

  try {
    await mailer.sendMail(
      customerEmail,
      `GameLootMalawi Order Confirmation - ${orderRef}`,
      customerHtml,
      { attachments: [invoiceAttachment] }
    );
  } catch (mailErr) {
    logger.error('order_confirmation_email_failed', {
      orderNumber: orderRef,
      recipient: customerEmail,
      error: mailErr && mailErr.message ? mailErr.message : String(mailErr),
      mailer: mailer.getMailerStatus()
    });
  }

  const adminEmail = process.env.ADMIN_INVOICE_EMAIL || process.env.SMTP_USER || process.env.SMTP_FROM;
  if (!adminEmail) {
    logger.warn('admin_invoice_email_skipped', { orderNumber: orderRef });
    return;
  }

  const adminHtml = `
    <h2>New Order Invoice</h2>
    <p><strong>Order #:</strong> ${orderRef}</p>
    <p><strong>Customer:</strong> ${orderData.customer_name} (${customerEmail})</p>
    <p><strong>Phone:</strong> ${orderData.customer_phone || 'N/A'}</p>
    <p><strong>Payment Method:</strong> ${orderData.payment_method}</p>
    <p><strong>Shipping Address:</strong> ${shippingAddress}</p>
    ${receiptPublicUrl ? `<p><strong>Payment Receipt:</strong> <a href="${receiptPublicUrl}">${receiptPublicUrl}</a></p>` : ''}
    <p><strong>Total:</strong> MWK ${Number(totalAmount).toLocaleString()}</p>
    <h4>Items</h4>
    <ul>${listItems}</ul>
  `;

  try {
    const attachments = [invoiceAttachment];
    const receiptAttachmentPath = String((receiptFile && (receiptFile.url || receiptFile.path)) || '').trim();
    if (receiptAttachmentPath) {
      if (/^https?:\/\//i.test(receiptAttachmentPath)) {
        attachments.push({
          filename: receiptFile.originalname || 'payment-receipt',
          path: receiptAttachmentPath
        });
      } else if (fs.existsSync(receiptAttachmentPath)) {
        attachments.push({
          filename: receiptFile.originalname || 'payment-receipt',
          path: receiptAttachmentPath
        });
      } else {
        logger.warn('payment_receipt_attachment_missing', {
          orderNumber: orderRef,
          expectedPath: receiptAttachmentPath
        });
      }
    }

    await mailer.sendMail(
      adminEmail,
      `Invoice - New Order ${orderRef}`,
      adminHtml,
      { attachments }
    );
  } catch (mailErr) {
    logger.error('admin_invoice_email_failed', {
      orderNumber: orderRef,
      recipient: adminEmail,
      error: mailErr && mailErr.message ? mailErr.message : String(mailErr),
      mailer: mailer.getMailerStatus()
    });
  }
}

module.exports = {
  runOrderPostProcessing
};

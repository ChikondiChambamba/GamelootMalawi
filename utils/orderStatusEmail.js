const mailer = require('./mailer');

function prettyStatus(status) {
  const map = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  return map[status] || String(status || '').trim();
}

async function sendOrderStatusUpdateEmail(order, previousStatus, nextStatus) {
  if (!order || !order.customer_email || previousStatus === nextStatus) return;

  const orderRef = order.order_number || order.id;
  const prev = prettyStatus(previousStatus);
  const next = prettyStatus(nextStatus);
  const customerName = order.customer_name || 'Customer';
  const siteUrl = process.env.APP_BASE_URL || '';
  const orderLink = siteUrl ? `${siteUrl}/orders/${order.id}` : '';

  const html = `
    <h2>Order Status Updated</h2>
    <p>Hi ${customerName},</p>
    <p>Your order <strong>#${orderRef}</strong> status has changed.</p>
    <p><strong>Previous status:</strong> ${prev}</p>
    <p><strong>New status:</strong> ${next}</p>
    ${orderLink ? `<p>You can view your order here: <a href="${orderLink}">${orderLink}</a></p>` : ''}
    <p>Thank you for shopping with GameLootMalawi.</p>
  `;

  await mailer.sendMail(
    order.customer_email,
    `GameLootMalawi: Order #${orderRef} is now ${next}`,
    html
  );
}

module.exports = {
  sendOrderStatusUpdateEmail
};

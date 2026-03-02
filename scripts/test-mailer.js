const mailer = require('../utils/mailer');

async function run() {
  const to = process.env.MAIL_TEST_TO || process.env.ADMIN_INVOICE_EMAIL || process.env.SMTP_USER;
  if (!to) {
    console.error('Set MAIL_TEST_TO (or ADMIN_INVOICE_EMAIL / SMTP_USER) before running test-mailer.');
    process.exit(1);
  }

  try {
    const res = await mailer.sendMail(
      to,
      'Test email from GameLootMalawi',
      '<p>This is a test email from deployment test-mailer script.</p>'
    );
    console.log('Mailer result:', res);
  } catch (err) {
    console.error('Mailer error:', err);
    process.exit(1);
  }
}

run();

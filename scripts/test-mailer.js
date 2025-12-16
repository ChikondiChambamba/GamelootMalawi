const mailer = require('../utils/mailer');

async function run() {
  try {
    const res = await mailer.sendMail('test@example.com', 'Test email from GameLootMalawi', '<p>This is a test email from local test-mailer script.</p>');
    console.log('Mailer result:', res);
  } catch (err) {
    console.error('Mailer error:', err);
  }
}

run();

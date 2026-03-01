const nodemailer = require('nodemailer');
const env = require('../config/env');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SMTP_HOST = process.env.SMTP_HOST || env.SMTP_HOST;
const SMTP_USER = process.env.SMTP_USER || process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.SMTP_PASS;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || false;

let transporter = null;
let useFallback = false;

if (SMTP_HOST && SMTP_USER && SMTP_PASS && SMTP_HOST !== 'smtp.example.com') {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10) || 587,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  // verify transporter but don't throw on failure during startup
  transporter.verify().catch(err => {
    console.warn('SMTP verify failed, falling back to log-only mailer:', err && err.message);
    transporter = null;
    useFallback = true;
  });
} else {
  useFallback = true;
}

// Ensure tmp dir exists for local email logs
const tmpDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)) {
  try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (e) { /* ignore */ }
}

async function sendMail(to, subject, html, options = {}) {
  const from = process.env.SMTP_FROM || 'no-reply@gamelootmalawi.com';
  const attachments = Array.isArray(options.attachments) ? options.attachments : [];

  if (!transporter || useFallback) {
    const attachmentList = attachments.length
      ? `\nAttachments: ${attachments.map((a) => a.filename || 'file').join(', ')}\n`
      : '\n';
    const entry = `--\nTo: ${to}\nFrom: ${from}\nSubject: ${subject}\nDate: ${new Date().toISOString()}${attachmentList}\n${html}\n`;
    // log to console for developers
    console.log('[MAILER FALLBACK] Email content:\n', entry);
    // append to file for easier inspection
    try {
      fs.appendFileSync(path.join(tmpDir, 'emails.log'), entry, 'utf8');
    } catch (err) {
      console.error('Failed to write fallback email to tmp/emails.log:', err && err.message);
    }
    return Promise.resolve({ accepted: [to], fallback: true });
  }

  const mailOptions = { from, to, subject, html, attachments };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendMail };

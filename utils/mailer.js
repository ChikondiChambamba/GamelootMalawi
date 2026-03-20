const nodemailer = require('nodemailer');
const env = require('../config/env');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function clean(value) {
  return String(value || '').trim();
}

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  const v = String(value).trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

const SMTP_HOST = clean(process.env.SMTP_HOST || env.SMTP_HOST);
const SMTP_USER = clean(process.env.SMTP_USER || env.SMTP_USER);
let SMTP_PASS = clean(process.env.SMTP_PASS || env.SMTP_PASS);
const SMTP_PORT = parseInt(clean(process.env.SMTP_PORT || 587), 10) || 587;
const SMTP_SECURE = parseBool(process.env.SMTP_SECURE, SMTP_PORT === 465);
const SMTP_DEBUG = parseBool(process.env.SMTP_DEBUG, false);
const isProd = process.env.NODE_ENV === 'production';
const SMTP_FROM = clean(process.env.SMTP_FROM || SMTP_USER || 'no-reply@gamelootmalawi@gmail.com');

if (SMTP_HOST === 'smtp.gmail.com' && /\s/.test(SMTP_PASS)) {
  SMTP_PASS = SMTP_PASS.replace(/\s+/g, '');
}

let transporter = null;
let useFallback = false;
let lastVerifyError = null;
let lastSendError = null;
let lastSendOkAt = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS && SMTP_HOST !== 'smtp.example.com') {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    debug: SMTP_DEBUG,
    logger: SMTP_DEBUG
  });

  // Verify transporter but do not disable delivery in production based on startup timing/network blips.
  transporter.verify().catch(err => {
    lastVerifyError = err && (err.message || String(err));
    console.warn('SMTP verify failed:', err && err.message);
    if (!isProd) {
      transporter = null;
      useFallback = true;
      console.warn('Non-production mode: using log-only fallback mailer.');
    }
  });
} else {
  if (isProd) {
    console.error('SMTP is not fully configured in production. Emails will fail until SMTP_* variables are set.');
  } else {
    useFallback = true;
  }
}

// Ensure tmp dir exists for local email logs
const tmpDir = path.join(process.cwd(), 'tmp');
if (!fs.existsSync(tmpDir)) {
  try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (e) { /* ignore */ }
}

async function sendMail(to, subject, html, options = {}) {
  const from = SMTP_FROM;
  const attachments = Array.isArray(options.attachments) ? options.attachments : [];

  if (!transporter || useFallback) {
    if (isProd) {
      throw new Error('SMTP transporter unavailable in production. Check SMTP configuration.');
    }
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
  try {
    const result = await transporter.sendMail(mailOptions);
    lastSendError = null;
    lastSendOkAt = new Date().toISOString();
    return result;
  } catch (err) {
    lastSendError = err && (err.message || String(err));
    throw err;
  }
}

function getMailerStatus() {
  return {
    configured: Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS),
    mode: useFallback ? 'fallback' : 'smtp',
    host: SMTP_HOST || null,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    debug: SMTP_DEBUG,
    from: SMTP_FROM || null,
    lastVerifyError,
    lastSendError,
    lastSendOkAt
  };
}

module.exports = { sendMail, getMailerStatus };

/**
 * Unified notification service for Car Hive.
 *
 * Supports four channels:
 *   - in-app  : persisted Notification row (always on)
 *   - email   : SMTP via nodemailer
 *   - sms     : generic HTTP SMS gateway (Twilio-compatible by default)
 *   - whatsapp: WhatsApp Cloud API / Twilio WhatsApp
 *
 * Every external channel degrades gracefully: when the relevant credentials
 * are missing the message is logged to the console instead of throwing, so the
 * platform stays fully functional in development without provider accounts.
 */
const { Notification } = require('../models');

let nodemailer = null;
try {
  // Optional dependency — only used when SMTP is configured.
  nodemailer = require('nodemailer');
} catch (_) {
  nodemailer = null;
}

let transporter = null;
const getTransporter = () => {
  if (transporter) return transporter;
  if (!nodemailer || !process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined
  });
  return transporter;
};

const sendEmail = async ({ to, subject, html, text, attachments }) => {
  try {
    const tx = getTransporter();
    if (!tx || !to) {
      console.log(`[EMAIL:skipped] -> ${to} | ${subject}`);
      return { ok: false, skipped: true };
    }
    await tx.sendMail({
      from: process.env.SMTP_FROM || `"Car Hive" <${process.env.SMTP_USER}>`,
      to, subject, html, text: text || (html ? html.replace(/<[^>]+>/g, ' ') : ''),
      attachments
    });
    console.log(`[EMAIL:sent] -> ${to} | ${subject}`);
    return { ok: true };
  } catch (err) {
    console.error('[EMAIL:error]', err.message);
    return { ok: false, error: err.message };
  }
};

// Generic SMS gateway. Defaults to Twilio's REST API shape; override
// SMS_API_URL / SMS_API_KEY to point at any HTTP SMS provider.
const sendSMS = async ({ to, message }) => {
  try {
    if (!process.env.SMS_API_URL || !to) {
      console.log(`[SMS:skipped] -> ${to} | ${message}`);
      return { ok: false, skipped: true };
    }
    const res = await fetch(process.env.SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.SMS_API_KEY ? { Authorization: `Bearer ${process.env.SMS_API_KEY}` } : {})
      },
      body: JSON.stringify({ to, from: process.env.SMS_SENDER_ID || 'CARHIVE', message })
    });
    console.log(`[SMS:sent] -> ${to} (status ${res.status})`);
    return { ok: res.ok };
  } catch (err) {
    console.error('[SMS:error]', err.message);
    return { ok: false, error: err.message };
  }
};

// WhatsApp via Meta Cloud API (graph.facebook.com) when configured.
const sendWhatsApp = async ({ to, message }) => {
  try {
    if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_TOKEN || !to) {
      console.log(`[WHATSAPP:skipped] -> ${to} | ${message}`);
      return { ok: false, skipped: true };
    }
    const res = await fetch(process.env.WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: String(to).replace(/[^0-9]/g, ''),
        type: 'text',
        text: { body: message }
      })
    });
    console.log(`[WHATSAPP:sent] -> ${to} (status ${res.status})`);
    return { ok: res.ok };
  } catch (err) {
    console.error('[WHATSAPP:error]', err.message);
    return { ok: false, error: err.message };
  }
};

/**
 * High-level helper: persist an in-app notification and fan out to the
 * requested external channels. Never throws — failures are logged so the
 * primary request flow is never blocked by a notification error.
 *
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.type='info']
 * @param {string[]} [opts.channels=['in-app']]  any of in-app|email|sms|whatsapp
 * @param {string} [opts.email]   recipient email (required for email channel)
 * @param {string} [opts.mobile]  recipient phone (required for sms/whatsapp)
 * @param {string} [opts.emailHtml] custom HTML body for email
 * @param {string} [opts.subject]   custom email subject (defaults to title)
 */
const notify = async (opts) => {
  const {
    userId, title, message, type = 'info',
    channels = ['in-app'], email, mobile, emailHtml, subject, attachments
  } = opts;

  const results = {};

  if (channels.includes('in-app') && userId) {
    try {
      await Notification.create({ userId, title, message, type, channels: channels.join(',') });
      results.inApp = true;
    } catch (err) {
      console.error('[NOTIFY:in-app:error]', err.message);
    }
  }

  const tasks = [];
  if (channels.includes('email') && email) {
    tasks.push(sendEmail({ to: email, subject: subject || title, html: emailHtml || `<p>${message}</p>`, attachments }).then(r => { results.email = r; }));
  }
  if (channels.includes('sms') && mobile) {
    tasks.push(sendSMS({ to: mobile, message: `${title}: ${message}` }).then(r => { results.sms = r; }));
  }
  if (channels.includes('whatsapp') && mobile) {
    tasks.push(sendWhatsApp({ to: mobile, message: `*${title}*\n${message}` }).then(r => { results.whatsapp = r; }));
  }

  await Promise.allSettled(tasks);
  return results;
};

module.exports = { sendEmail, sendSMS, sendWhatsApp, notify };

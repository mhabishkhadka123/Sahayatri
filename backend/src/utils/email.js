/**
 * Email utility using Nodemailer.
 * 
 * TODO: Configure the following in your .env file:
 *   EMAIL_HOST=smtp.gmail.com
 *   EMAIL_PORT=587
 *   EMAIL_USER=your-email@gmail.com
 *   EMAIL_PASS=your-app-password  (use Gmail App Passwords, not your main password)
 *   EMAIL_FROM=Sahayatra <noreply@sahayatra.com>
 * 
 * For Gmail: Enable 2FA → Generate App Password → Use that as EMAIL_PASS
 * Alternative providers: SendGrid, Resend, Mailgun — change host/port accordingly.
 */

import nodemailer from 'nodemailer';
import config from '../config/index.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!config.email.isConfigured) {
    // Development: log emails to console instead of sending
    console.info(
      '📧 Email service not configured. Set EMAIL_USER and EMAIL_PASS in .env to enable real emails.\n' +
      '   For now, email content will be logged to console.'
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  return transporter;
};

/**
 * Send an email.
 * Falls back to console logging if email is not configured.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Plain text fallback
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const transport = getTransporter();

  if (!transport) {
    // Development fallback: log to console
    console.info('─────────────────────────────────');
    console.info('📧 EMAIL (Not sent — configure .env to enable)');
    console.info(`To: ${to}`);
    console.info(`Subject: ${subject}`);
    console.info(`Body:\n${text || html?.replace(/<[^>]*>/g, '')}`);
    console.info('─────────────────────────────────');
    return { messageId: 'dev-' + Date.now() };
  }

  const info = await transport.sendMail({
    from: config.email.from,
    to,
    subject,
    html,
    text: text || html?.replace(/<[^>]*>/g, ''),
  });

  console.info(`📧 Email sent: ${info.messageId}`);
  return info;
};

import nodemailer from "nodemailer";
import { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } from "./env.js";

/**
 * Nodemailer transporter configuration
 * Supports any SMTP provider (Gmail, SendGrid, Mailgun, etc.)
 */
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT) || 587,
  secure: Number(EMAIL_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/*** Send an email using the configured transporter. */

export const sendMail = async ({ to, subject, text, html }) => {
  return transporter.sendMail({
    from: EMAIL_FROM || `"U-Sleep" <${EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

export default transporter;

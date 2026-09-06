import nodemailer from 'nodemailer';
import env from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter = null;

/**
 * Initialize the email transporter.
 * In development: uses Ethereal (fake SMTP that captures emails).
 * In production: uses configured SMTP credentials.
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  if (env.EMAIL_HOST && env.EMAIL_USER) {
    // Production SMTP
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
    });
  } else {
    // Development: use Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info(`Ethereal email account: ${testAccount.user}`);
  }

  return transporter;
};

/**
 * Send an email.
 * @param {object} options - { to, subject, html }
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: `"MyChat" <${env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });

    // In development, log the Ethereal preview URL
    if (env.isDevelopment) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info(`Email preview URL: ${previewUrl}`);
      }
    }

    return info;
  } catch (error) {
    logger.error('Failed to send email:', { error: error.message });
    throw error;
  }
};

/**
 * Send email verification link.
 */
export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${env.CLIENT_URL}/verify-email/${token}`;

  await sendEmail({
    to: email,
    subject: 'Verify your MyChat account',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 MyChat</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">End-to-End Encrypted Messaging</p>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
          <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email</h2>
          <p style="color: #4b5563; line-height: 1.6;">Welcome to MyChat! Please verify your email address to activate your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 13px;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });
};

/**
 * Send password reset link.
 */
export const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${env.CLIENT_URL}/reset-password/${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset your MyChat password',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 MyChat</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">End-to-End Encrypted Messaging</p>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
          <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
          <p style="color: #4b5563; line-height: 1.6;">We received a password reset request for your account. Click the button below to set a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });
};

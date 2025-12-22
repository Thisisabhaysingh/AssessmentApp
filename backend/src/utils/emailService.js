import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Create transporter only if credentials are provided
let transporter = null;

if (env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('SMTP connection error:', error);
      console.log('⚠️  Email service disabled. Add SMTP credentials to .env to enable.');
    } else {
      console.log('✅ SMTP server is ready to send emails');
    }
  });
} else {
  console.log('⚠️  SMTP credentials not configured. Email service disabled.');
  console.log('   Add SMTP_USER and SMTP_PASS to backend/.env to enable email features.');
}

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"Automation Assessment" <${env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset OTP - Automation Assessment',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #ef4444;
            margin: 0;
          }
          .otp-box {
            background: white;
            border: 2px dashed #ef4444;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .otp {
            font-size: 32px;
            font-weight: bold;
            color: #ef4444;
            letter-spacing: 8px;
            margin: 10px 0;
          }
          .info {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          
          <p>Hello,</p>
          <p>We received a request to reset your password for your Automation Assessment account.</p>
          
          <div class="otp-box">
            <p style="margin: 0; color: #666;">Your OTP Code:</p>
            <div class="otp">${otp}</div>
            <p style="margin: 0; color: #666; font-size: 14px;">Valid for 10 minutes</p>
          </div>
          
          <div class="info">
            <strong>⚠️ Security Notice:</strong>
            <ul style="margin: 10px 0;">
              <li>This OTP is valid for <strong>10 minutes</strong> only</li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>
          
          <p>Enter this OTP on the password reset page to continue.</p>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Automation Assessment. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

// Send password change confirmation email
export const sendPasswordChangeEmail = async (email, userName) => {
  const mailOptions = {
    from: `"Automation Assessment" <${env.SMTP_USER}>`,
    to: email,
    subject: 'Password Changed Successfully - Automation Assessment',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #10b981;
            margin: 0;
          }
          .success-box {
            background: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Password Changed Successfully</h1>
          </div>
          
          <p>Hello ${userName},</p>
          
          <div class="success-box">
            <p style="margin: 0;"><strong>Your password has been changed successfully.</strong></p>
            <p style="margin: 10px 0 0 0;">You can now log in with your new password.</p>
          </div>
          
          <p>If you did not make this change, please contact your administrator immediately.</p>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Automation Assessment. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password change confirmation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password change email:', error);
    throw error;
  }
};

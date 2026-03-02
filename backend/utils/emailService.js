const nodemailer = require('nodemailer');

// Configure your email service (use environment variables)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: '"Yt2 Store" <noreply@meterostore.com>',
    to: email,
    subject: 'Verify Your Email - Yt2 Store',
    html: `
      <h1>Welcome to Yt2 Store!</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}" style="padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create an account, ignore this email.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};
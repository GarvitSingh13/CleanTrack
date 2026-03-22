const nodemailer = require("nodemailer");

/**
 * Sends a unified verification email for all roles.
 * @param {string} email - Recipient email
 * @param {string} code - 6-digit verification code
 * @param {string} role - user, admin, or collector
 */
const sendVerificationEmail = async (email, code, role) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS
    }
  });

  // Role-specific branding
  const branding = {
    user: { title: "CleanTrack User", icon: "♻️", subtitle: "Welcome to the CleanTrack community!" },
    admin: { title: "CleanTrack Admin", icon: "🔒", subtitle: "Secure Administrative Access Setup" },
    collector: { title: "CleanTrack Collector", icon: "🚚", subtitle: "Welcome to the Waste Collection Network!" }
  };

  const { title, icon, subtitle } = branding[role] || branding.user;

  await transporter.sendMail({
    from: `"CleanTrack Support" <${process.env.EMAIL}>`,
    to: email,
    subject: `[CleanTrack] ${title} Verification Code ${icon}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; text-align: center; color: #333; padding: 40px 20px; max-width: 500px; margin: auto; border: 1px solid #f0f0f0; border-radius: 16px; background-color: #ffffff;">
        <div style="margin-bottom: 20px;">
          <span style="font-size: 48px;">${icon}</span>
        </div>
        <h1 style="color: #1f8f55; margin: 0; font-size: 24px; font-weight: 800;">${title}</h1>
        <p style="color: #64748b; font-size: 16px; margin: 10px 0 30px;">${subtitle}</p>
        
        <div style="background-color: #f8fafc; padding: 30px; border-radius: 12px; display: inline-block; border: 1px solid #e2e8f0; margin-bottom: 30px;">
          <p style="text-transform: uppercase; font-size: 12px; font-weight: 700; color: #94a3b8; margin: 0 0 10px; letter-spacing: 1px;">Your Verification Code</p>
          <h2 style="font-size: 36px; letter-spacing: 10px; color: #1f8f55; margin: 0; font-family: monospace;">${code}</h2>
        </div>
        
        <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
          Enter this code on the verification page to complete your signup. 
          For security, do not share this code with anyone.
        </p>
        
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 40px 0;" />
        
        <p style="font-size: 12px; color: #94a3b8;">
          &copy; 2026 CleanTrack Smart Waste Management.<br>
          Helping keep our cities clean and sustainable.
        </p>
      </div>
    `
  });
};

module.exports = { sendVerificationEmail };

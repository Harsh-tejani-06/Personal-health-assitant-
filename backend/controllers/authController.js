import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import Otp from "../models/Otp.js";

// ======================== Token ========================
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d"
  });
};

// ======================== Email transporter ========================
// Uses Gmail SMTP. Set EMAIL_USER and EMAIL_PASS in .env
// For Gmail: use an App Password (not your regular password)
// https://myaccount.google.com/apppasswords
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ======================== SIGNUP ========================
export const signup = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullname,
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    res.json({
      token: generateToken(user._id),
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================== LOGIN ========================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.json({
      token: generateToken(user._id),
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================== FORGOT PASSWORD — Send OTP ========================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    // Delete any existing OTPs for this email
    await Otp.deleteMany({ email: normalizedEmail });

    // Generate and save OTP (valid for 10 minutes)
    const otp = generateOTP();
    await Otp.create({
      email: normalizedEmail,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 min
    });

    // Send email
    const mailOptions = {
      from: `"Health Assistant" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: "Password Reset OTP - Health Assistant",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #10b981); border-radius: 12px; padding: 12px; margin-bottom: 12px;">
              <span style="font-size: 28px;">🏥</span>
            </div>
            <h1 style="color: #1e293b; font-size: 22px; margin: 0;">Health Assistant</h1>
          </div>

          <div style="background: white; border-radius: 12px; padding: 28px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
            <h2 style="color: #334155; font-size: 18px; margin: 0 0 12px;">Password Reset Request</h2>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              Hi <strong>${user.fullname}</strong>, use the OTP below to reset your password. This code is valid for <strong>10 minutes</strong>.
            </p>

            <div style="background: linear-gradient(135deg, #06b6d4, #0891b2); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
              <span style="font-size: 32px; font-weight: 800; color: white; letter-spacing: 8px;">${otp}</span>
            </div>

            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
              If you didn't request this, please ignore this email. Your password will remain unchanged.
            </p>
          </div>

          <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 20px;">
            © ${new Date().getFullYear()} Health Assistant — Your wellness companion
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "OTP sent to your email" });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

// ======================== VERIFY OTP ========================
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      otp,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    res.json({ success: true, message: "OTP verified successfully" });

  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

// ======================== RESET PASSWORD ========================
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP is valid and was verified
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      otp,
      verified: true,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP. Please request a new one." });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate(
      { email: normalizedEmail },
      { password: hashedPassword }
    );

    // Delete all OTPs for this email
    await Otp.deleteMany({ email: normalizedEmail });

    res.json({ success: true, message: "Password reset successfully! You can now login." });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

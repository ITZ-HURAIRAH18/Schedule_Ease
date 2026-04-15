import dotenv from "dotenv";
dotenv.config();


import nodemailer from "nodemailer";
import User from "../models/User.js";

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});


/**
 * Send email with subject + custom HTML template
 *
 * @param {string} userId - MongoDB user ID
 * @param {string} subject - Email subject
 * @param {string} htmlTemplate - Email HTML content
 * @param {boolean} sendToAdmin - If true, send copy to admin
 */
export const sendEmail = async (userId, subject, htmlTemplate, sendToAdmin = false) => {
  const user = await User.findById(userId);
  if (!user) {
    console.warn("⚠️ User not found, cannot send email to:", userId);
    return { success: false, message: "User not found" };
  }

  try {
    // 1️⃣ Send to user
    const userMailOptions = {
      from: `"${process.env.EMAIL_NAME}" <${process.env.EMAIL}>`,
      to: user.email,
      subject,
      html: htmlTemplate,
    };
    await transport.sendMail(userMailOptions);
    console.log("✅ Email sent to:", user.email);

    // 2️⃣ Send separately to admin (if enabled)
    if (sendToAdmin && process.env.ADMIN_EMAIL) {
      const adminMailOptions = {
        from: `"${process.env.EMAIL_NAME}" <${process.env.EMAIL}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `[ADMIN COPY] ${subject}`,
        html: htmlTemplate,
      };
      await transport.sendMail(adminMailOptions);
      console.log("✅ Admin copy sent to:", process.env.ADMIN_EMAIL);
    }

    return { success: true, message: "Emails sent successfully" };
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    // Return error info instead of throwing
    return { success: false, message: error.message };
  }
};

/**
 * Send email directly to a given address (bypass user lookup)
 */
export const sendDirectEmail = async (to, subject, htmlTemplate) => {
  if (!to) throw new Error("Recipient email is required");
  const mailOptions = {
    from: `"${process.env.EMAIL_NAME}" <${process.env.EMAIL}>`,
    to,
    subject,
    html: htmlTemplate,
  };
  await transport.sendMail(mailOptions);
  return { success: true };
};

export default sendEmail;
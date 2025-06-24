import nodemailer from "nodemailer"

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number.parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  // Send email
  const info = await transporter.sendMail({
    from: from || process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  })

  console.log("Email sent:", info.messageId)
  return info
}

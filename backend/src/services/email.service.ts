import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Healthcare Manager" <noreply@healthcaremanager.com>',
      to,
      subject,
      text,
    });
    console.log(`Message sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    // Throw error so BullMQ retries the job
    throw error;
  }
};

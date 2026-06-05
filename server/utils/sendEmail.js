const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
  // Check if SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n[Email Warning] SMTP variables missing in .env. Logging email to terminal instead:');
    console.log('----------------------------------------------------');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text:\n${text}`);
    console.log('----------------------------------------------------\n');
    return { mock: true, messageId: 'mock-id' };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT) || 2525,
    secure: process.env.SMTP_PORT === '465', // true for port 465, false for others
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Force IPv4 to prevent ENETUNREACH errors on Render/cloud providers
    family: 4,
  });

  const mailOptions = {
    from: process.env.FROM_EMAIL || '"ByteRoom" <noreply@byteroom.com>',
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email via SMTP:', error.message);
    throw error;
  }
};

module.exports = sendEmail;

const nodemailer = require('nodemailer');

async function sendTestEmail() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;
  const recipients = process.env.ALERT_RECIPIENTS;

  if (!gmailUser || !gmailPassword || !recipients) {
    throw new Error('Missing Gmail or recipient information.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword
    }
  });

  console.log('Connecting to Gmail...');

  const info = await transporter.sendMail({
    from: `"Broadneck Weather Alerts" <${gmailUser}>`,
    to: recipients,
    subject: 'TEST — Broadneck Weather Alert System',
    text: `
This is a test of the Broadneck Weather Alert System.

If you received this email, the Gmail connection is working correctly.

No weather alert has been issued.
    `.trim()
  });

  console.log('TEST EMAIL SENT SUCCESSFULLY');
  console.log(`Message ID: ${info.messageId}`);
}

sendTestEmail().catch(error => {
  console.error('EMAIL TEST FAILED');
  console.error(error);
  process.exit(1);
});

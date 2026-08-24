const nodemailer = require('nodemailer');

async function sendTestWeatherAlert() {
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

  const subject = 'WEATHER ALERT — Broadneck High School';

  const message = `
Broadneck Weather Alert System

Location: Broadneck High School

Previous Status:
No Alert

Current Status:
TEST WEATHER ALERT

Earth Networks Connection:
Up

The Earth Networks alert status has changed.

View the live Earth Networks status:
https://oas.earthnetworks.com/widget/ResOASWidget.html?widgetId=53a22493-1a2e-4968-9974-e32868ef58a5

THIS IS A TEST MESSAGE.
No actual weather alert has been issued.
  `.trim();

  console.log('Sending fake weather alert email...');

  const info = await transporter.sendMail({
    from: `"Broadneck Weather Alerts" <${gmailUser}>`,
    to: recipients,
    subject: subject,
    text: message
  });

  console.log('TEST WEATHER ALERT SENT SUCCESSFULLY');
  console.log(`Message ID: ${info.messageId}`);
}

sendTestWeatherAlert().catch(error => {
  console.error('TEST WEATHER ALERT FAILED');
  console.error(error);
  process.exit(1);
});

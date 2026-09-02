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

  const LOCATION = 'Broadneck Area Fields';

  const subject =
    `[TEST] BAYS WEATHER ALERT — ALL CLEAR — ${LOCATION}`;

  const message = `
*** THIS IS A TEST MESSAGE ***
No actual weather alert or field status change has been issued.

BAYS Weather Alert System

Location:
${LOCATION}

Current Status:
NO ALERT

NO LIGHTNING-RELATED FIELD CLOSURE

The current Earth Networks status is NO ALERT.

There is no lightning-related field closure in effect.

Fields are again OPEN unless separate direction has been issued indicating otherwise.

Any questions, please reach out to your sport's respective Commissioner/Director.

----------------------------------------

Previous Status:
Active

Earth Networks Connection:
Up

View the live Earth Networks status:
https://oas.earthnetworks.com/widget/ResOASWidget.html?widgetId=53a22493-1a2e-4968-9974-e32868ef58a5

----------------------------------------

This is an automated notification from the BAYS Weather Alert System.

*** TEST ONLY — NO ACTUAL FIELD STATUS CHANGE ***
  `.trim();

  console.log('Sending test ALL CLEAR weather alert email...');

  const info = await transporter.sendMail({
    from: `"BAYS Weather Alert System" <${gmailUser}>`,
    to: recipients,
    subject: subject,
    text: message
  });

  console.log('TEST ALL CLEAR WEATHER ALERT SENT SUCCESSFULLY');
  console.log(`Message ID: ${info.messageId}`);
}

sendTestWeatherAlert().catch(error => {
  console.error('TEST WEATHER ALERT FAILED');
  console.error(error);
  process.exit(1);
});

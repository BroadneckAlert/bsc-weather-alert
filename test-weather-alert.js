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
    `[TEST] BAYS WEATHER ALERT — FIELDS CLOSED — ${LOCATION}`;

  const message = `
*** THIS IS A TEST MESSAGE ***
No actual weather alert has been issued.

BAYS Weather Alert System

Location:
${LOCATION}

Current Status:
ACTIVE

FIELDS ARE CLOSED

A lightning alert is currently ACTIVE for the Broadneck area.

All BAYS fields are CLOSED.

No players, coaches, families, or spectators should be on the fields.

Everyone should immediately seek appropriate shelter.

Fields will remain CLOSED until the current Earth Networks status changes to NO ALERT.

Any questions, please reach out to your sport's respective Commissioner/Director.

----------------------------------------

Previous Status:
No Alert

Earth Networks Connection:
Up

View the live Earth Networks status:
https://oas.earthnetworks.com/widget/ResOASWidget.html?widgetId=53a22493-1a2e-4968-9974-e32868ef58a5

----------------------------------------

This is an automated notification from the BAYS Weather Alert System.

*** TEST ONLY — NO ACTUAL FIELD CLOSURE ***
  `.trim();

  console.log('Sending test ACTIVE weather alert email...');

  const info = await transporter.sendMail({
    from: `"BAYS Weather Alert System" <${gmailUser}>`,
    to: recipients,
    subject: subject,
    text: message
  });

  console.log('TEST ACTIVE WEATHER ALERT SENT SUCCESSFULLY');
  console.log(`Message ID: ${info.messageId}`);
}

sendTestWeatherAlert().catch(error => {
  console.error('TEST WEATHER ALERT FAILED');
  console.error(error);
  process.exit(1);
});

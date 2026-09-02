const { chromium } = require('playwright');
const nodemailer = require('nodemailer');
const fs = require('fs');

const WIDGET_URL =
  'https://oas.earthnetworks.com/widget/ResOASWidget.html?widgetId=53a22493-1a2e-4968-9974-e32868ef58a5';

const LOCATION = 'Broadneck Area Fields';

function isWithinSystemHours() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());

  const hour = Number(
    parts.find(part => part.type === 'hour').value
  );

  // Earth Networks system hours:
  // 7:00 AM through 10:00 PM Eastern
  return hour >= 7 && hour < 22;
}

async function sendAlertEmail(
  previousStatus,
  currentStatus,
  connectionStatus
) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;
  const recipients = process.env.ALERT_RECIPIENTS;

  if (!gmailUser || !gmailPassword || !recipients) {
    throw new Error(
      'Missing Gmail or recipient information.'
    );
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword
    }
  });

  const normalizedStatus =
    currentStatus.toLowerCase().trim();

  const isActive =
    normalizedStatus === 'active';

  const isAllClear =
    normalizedStatus === 'no alert';

  let subject;
  let statusMessage;

  // --------------------------------------------------
  // ACTIVE LIGHTNING ALERT
  // --------------------------------------------------

  if (isActive) {
    subject =
      `BAYS WEATHER ALERT — FIELDS CLOSED — ${LOCATION}`;

    statusMessage = `
FIELDS ARE CLOSED

A lightning alert is currently ACTIVE for the Broadneck area.

All BAYS fields are CLOSED.

No players, coaches, families, or spectators should be on the fields.

Everyone should immediately seek appropriate shelter.

Fields will remain CLOSED until the current Earth Networks status changes to NO ALERT.

Any questions, please reach out to your sport's respective Commissioner/Director.
    `.trim();
  }

  // --------------------------------------------------
  // NO ALERT / ALL CLEAR
  // --------------------------------------------------

  else if (isAllClear) {
    subject =
      `BAYS WEATHER ALERT — ALL CLEAR — ${LOCATION}`;

    statusMessage = `
NO LIGHTNING-RELATED FIELD CLOSURE

The current Earth Networks status is NO ALERT.

There is no lightning-related field closure in effect.

Fields are again OPEN unless separate direction has been issued indicating otherwise.

Any questions, please reach out to your sport's respective Commissioner/Director.
    `.trim();
  }

  // --------------------------------------------------
  // UNKNOWN / OTHER STATUS
  // --------------------------------------------------

  else {
    subject =
      `BAYS WEATHER STATUS CHANGE — ${LOCATION}`;

    statusMessage = `
WEATHER STATUS CHANGE

The Earth Networks weather status has changed.

Please review the current status below and use appropriate caution.

Any questions, please reach out to your sport's respective Commissioner/Director.
    `.trim();
  }

  const message = `
BAYS Weather Alert System

Location:
${LOCATION}

Current Status:
${currentStatus}

${statusMessage}

----------------------------------------

Previous Status:
${previousStatus}

Earth Networks Connection:
${connectionStatus}

View the live Earth Networks status:
${WIDGET_URL}

----------------------------------------

This is an automated notification from the BAYS Weather Alert System.
  `.trim();

  console.log('');
  console.log('Sending status-change email...');

  const info = await transporter.sendMail({
    from: `"BAYS Weather Alert System" <${gmailUser}>`,
    to: recipients,
    subject: subject,
    text: message
  });

  console.log('EMAIL SENT SUCCESSFULLY');
  console.log(`Message ID: ${info.messageId}`);
}

async function checkWidget() {
  console.log('Starting Earth Networks check...');

  // Do nothing outside official Earth Networks system hours.
  if (!isWithinSystemHours()) {
    console.log('');
    console.log(
      'Earth Networks system is outside operating hours.'
    );
    console.log(
      'System hours are 7:00 AM - 10:00 PM Eastern.'
    );
    console.log(
      'No weather check or email will be performed.'
    );

    fs.writeFileSync(
      'status-changed.txt',
      'NO'
    );

    return;
  }

  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  try {
    console.log(
      'Opening Earth Networks widget...'
    );

    await page.goto(WIDGET_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log(
      'Waiting for live weather data...'
    );

    await page.waitForTimeout(15000);

    const pageText =
      await page.locator('body').innerText();

    const lines = pageText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // -----------------------------
    // READ CONNECTION STATUS FIRST
    // -----------------------------

    const connectionLabelPosition =
      lines.findIndex(
        line =>
          line.toLowerCase() === 'connection'
      );

    let connectionStatus = 'Unknown';

    if (
      connectionLabelPosition !== -1 &&
      lines[connectionLabelPosition + 1]
    ) {
      connectionStatus =
        lines[connectionLabelPosition + 1];
    }

    console.log(
      `Earth Networks Connection: ${connectionStatus}`
    );

    // If the Earth Networks system is not connected,
    // DO NOT send an alert and DO NOT change the saved status.
    if (
      connectionStatus.toLowerCase() !== 'up'
    ) {
      console.log('');
      console.log(
        'EARTH NETWORKS CONNECTION IS NOT UP.'
      );
      console.log(
        'Weather status will NOT be processed.'
      );
      console.log(
        'No email will be sent.'
      );
      console.log(
        'Saved alert status will NOT be changed.'
      );

      fs.writeFileSync(
        'status-changed.txt',
        'NO'
      );

      await page.screenshot({
        path: 'widget-screenshot.png',
        fullPage: true
      });

      return;
    }

    // -----------------------------
    // READ ALERT STATUS
    // -----------------------------

    const alertLabelPosition =
      lines.findIndex(
        line =>
          line.toLowerCase() === 'alerts'
      );

    if (alertLabelPosition === -1) {
      throw new Error(
        'Could not find the Alerts section on the page.'
      );
    }

    const currentStatus =
      lines[alertLabelPosition + 1];

    if (!currentStatus) {
      throw new Error(
        'Could not determine the current alert status.'
      );
    }

    // -----------------------------
    // READ PREVIOUS SAVED STATUS
    // -----------------------------

    let previousStatus = 'UNKNOWN';

    if (
      fs.existsSync('last-status.txt')
    ) {
      previousStatus = fs
        .readFileSync(
          'last-status.txt',
          'utf8'
        )
        .trim();
    }

    const statusChanged =
      previousStatus !== currentStatus;

    console.log('');
    console.log(
      '================================'
    );
    console.log(
      'EARTH NETWORKS STATUS'
    );
    console.log(
      '================================'
    );
    console.log(
      `Location: ${LOCATION}`
    );
    console.log(
      `Previous Status: ${previousStatus}`
    );
    console.log(
      `Current Status: ${currentStatus}`
    );
    console.log(
      `Connection: ${connectionStatus}`
    );
    console.log(
      '================================'
    );

    // -----------------------------
    // STATUS CHANGED
    // -----------------------------

    if (statusChanged) {
      console.log('');
      console.log(
        'STATUS CHANGED!'
      );
      console.log(
        `${previousStatus} --> ${currentStatus}`
      );

      /*
       * Send the email BEFORE saving the new status.
       *
       * If Gmail fails, the status is NOT updated.
       * The monitor can therefore try again during
       * the next scheduled check.
       */

      await sendAlertEmail(
        previousStatus,
        currentStatus,
        connectionStatus
      );

      fs.writeFileSync(
        'last-status.txt',
        currentStatus
      );

      fs.writeFileSync(
        'status-changed.txt',
        'YES'
      );
    } else {
      console.log('');
      console.log(
        'No status change.'
      );
      console.log(
        'No email will be sent.'
      );

      fs.writeFileSync(
        'status-changed.txt',
        'NO'
      );
    }

    // Save screenshot for troubleshooting/manual runs.
    await page.screenshot({
      path: 'widget-screenshot.png',
      fullPage: true
    });

    console.log('');
    console.log(
      'SUCCESS: Weather status check completed.'
    );

  } catch (error) {
    console.error('');
    console.error(
      'ERROR CHECKING EARTH NETWORKS:'
    );
    console.error(error);

    process.exitCode = 1;

  } finally {
    await browser.close();
  }
}

checkWidget();

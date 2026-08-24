const { chromium } = require('playwright');
const fs = require('fs');

const WIDGET_URL =
  'https://oas.earthnetworks.com/widget/ResOASWidget.html?widgetId=53a22493-1a2e-4968-9974-e32868ef58a5';

async function checkWidget() {
  console.log('Starting Earth Networks check...');

  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  try {
    console.log('Opening Earth Networks widget...');

    await page.goto(WIDGET_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('Waiting for live weather data...');
    await page.waitForTimeout(15000);

    const pageText = await page.locator('body').innerText();

    const lines = pageText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const alertLabelPosition = lines.findIndex(
      line => line.toLowerCase() === 'alerts'
    );

    if (alertLabelPosition === -1) {
      throw new Error('Could not find the Alerts section on the page.');
    }

    const currentStatus = lines[alertLabelPosition + 1];

    if (!currentStatus) {
      throw new Error('Could not determine the current alert status.');
    }

    const connectionLabelPosition = lines.findIndex(
      line => line.toLowerCase() === 'connection'
    );

    let connectionStatus = 'Unknown';

    if (connectionLabelPosition !== -1 && lines[connectionLabelPosition + 1]) {
      connectionStatus = lines[connectionLabelPosition + 1];
    }

    let previousStatus = 'UNKNOWN';

    if (fs.existsSync('last-status.txt')) {
      previousStatus = fs.readFileSync('last-status.txt', 'utf8').trim();
    }

    const statusChanged = previousStatus !== currentStatus;

    console.log('');
    console.log('================================');
    console.log('EARTH NETWORKS STATUS');
    console.log('================================');
    console.log('Location: Broadneck High School');
    console.log(`Previous Status: ${previousStatus}`);
    console.log(`Current Status: ${currentStatus}`);
    console.log(`Connection: ${connectionStatus}`);
    console.log('================================');

    if (statusChanged) {
      console.log('');
      console.log('STATUS CHANGED!');
      console.log(`${previousStatus} --> ${currentStatus}`);

      fs.writeFileSync('last-status.txt', currentStatus);
      fs.writeFileSync('status-changed.txt', 'YES');
    } else {
      console.log('');
      console.log('No status change.');
      fs.writeFileSync('status-changed.txt', 'NO');
    }

    await page.screenshot({
      path: 'widget-screenshot.png',
      fullPage: true
    });

    console.log('');
    console.log('SUCCESS: Weather status check completed.');

  } catch (error) {
    console.error('');
    console.error('ERROR CHECKING EARTH NETWORKS:');
    console.error(error);
    process.exitCode = 1;

  } finally {
    await browser.close();
  }
}

checkWidget();

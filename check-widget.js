const { chromium } = require('playwright');

const WIDGET_URL =
  'https://oas.earthnetworks.com/widget/ResOASWidget.html?widgetId=53a22493-1a2e-4968-9974-e32868ef58a5';

async function checkWidget() {
  console.log('Starting Earth Networks check...');
  console.log(`Opening: ${WIDGET_URL}`);

  const browser = await chromium.launch({
    headless: true
  });

  const page = await browser.newPage();

  try {
    await page.goto(WIDGET_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('Page opened successfully.');

    // Give Earth Networks time to load the live information.
    console.log('Waiting for live Earth Networks data...');
    await page.waitForTimeout(15000);

    const title = await page.title();
    const pageText = await page.locator('body').innerText();

    console.log('');
    console.log('==============================');
    console.log('PAGE TITLE');
    console.log('==============================');
    console.log(title);

    console.log('');
    console.log('==============================');
    console.log('EARTH NETWORKS PAGE TEXT');
    console.log('==============================');
    console.log(pageText);

    console.log('');
    console.log('==============================');
    console.log('END OF PAGE TEXT');
    console.log('==============================');

    await page.screenshot({
      path: 'widget-screenshot.png',
      fullPage: true
    });

    console.log('');
    console.log('Screenshot created successfully.');
    console.log('Widget check finished.');
  } catch (error) {
    console.error('ERROR CHECKING WIDGET:');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

checkWidget();

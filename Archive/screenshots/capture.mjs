import { chromium } from 'playwright-core';

const url = 'https://itspatmorgan.com/';
const shots = [
  { file: 'desktop-1440.png', width: 1440, height: 900 },
  { file: 'tablet-768.png', width: 768, height: 1024 },
  { file: 'mobile-390.png', width: 390, height: 844 },
];

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
});

for (const shot of shots) {
  const context = await browser.newContext({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: shot.file, fullPage: true });
  await page.screenshot({
    path: shot.file.replace('.png', '-viewport.png'),
    fullPage: false,
  });
  console.log(`Saved ${shot.file}`);
  await context.close();
}

await browser.close();
console.log('Done');

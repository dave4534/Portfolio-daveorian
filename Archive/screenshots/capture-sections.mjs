import { chromium } from 'playwright-core';

const url = 'https://itspatmorgan.com/';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(3000);

// Scroll through the page to trigger lazy content, pausing along the way
const totalHeight = await page.evaluate(async () => {
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  let y = 0;
  const step = 600;
  const max = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );
  while (y < max) {
    window.scrollTo(0, y);
    await delay(400);
    y += step;
  }
  window.scrollTo(0, max);
  await delay(800);
  return Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );
});
console.log('Total height:', totalHeight);

await page.screenshot({ path: 'desktop-1440-scrolled.png', fullPage: true });

// Find section headings and screenshot around them
const sections = await page.evaluate(() => {
  const els = [...document.querySelectorAll('h2, h3, [class*="section"], section')];
  const interesting = [];
  for (const el of els) {
    const text = (el.innerText || '').trim().slice(0, 40);
    if (!text) continue;
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    interesting.push({ text, top, tag: el.tagName });
  }
  // Also look for elements containing WORK LAB WRITING COMMUNITY
  for (const label of ['WORK', 'LAB', 'WRITING', 'COMMUNITY', 'COLOPHON']) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent && node.textContent.trim().toUpperCase() === label) {
        const parent = node.parentElement;
        if (!parent) continue;
        const r = parent.getBoundingClientRect();
        interesting.push({
          text: label,
          top: r.top + window.scrollY,
          tag: parent.tagName,
        });
        break;
      }
    }
  }
  return interesting;
});
console.log('Sections found:', JSON.stringify(sections, null, 2));

for (const label of ['WORK', 'LAB', 'WRITING', 'COMMUNITY']) {
  const match = sections.find((s) => s.text.toUpperCase().includes(label));
  if (!match) {
    console.log('Missing', label);
    continue;
  }
  await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 80)), match.top);
  await page.waitForTimeout(600);
  await page.screenshot({
    path: `section-${label.toLowerCase()}.png`,
    fullPage: false,
  });
  console.log('Saved section', label);
}

await browser.close();

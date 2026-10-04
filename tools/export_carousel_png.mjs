import playwright from '/Users/ulianatsvirko/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const source = '/Users/ulianatsvirko/Downloads/Кулисы - карусель (standalone).html';
const outDir = '/Users/ulianatsvirko/Downloads/Кулисы — PNG';
const { chromium } = playwright;
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(source).href, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.addStyleTag({ content: 'button { visibility: hidden !important; }' });

for (let index = 0; index < 10; index++) {
  await page.evaluate((i) => {
    const buttons = [...document.querySelectorAll('button')];
    const dots = buttons.filter((button) => button.textContent?.trim() === '');
    if (!dots[i]) throw new Error(`Slide dot ${i + 1} not found`);
    dots[i].click();
  }, index);
  await page.waitForTimeout(250);
  const slides = page.locator('[data-document-role="page"]');
  await slides.nth(index).screenshot({ path: path.join(outDir, `Кулисы — ${String(index + 1).padStart(2, '0')}.png`) });
}

await browser.close();
console.log(outDir);

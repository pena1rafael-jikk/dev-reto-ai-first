'use strict';
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:4200';

async function dumpPage(page, label) {
  const fields = await page.evaluate(() => {
    const els = [];
    document.querySelectorAll('input, select, textarea, button, [contenteditable], a').forEach(el => {
      if (el.offsetParent !== null) {
        const obj = {
          tag: el.tagName,
          type: el.type || '',
          name: el.name || '',
          placeholder: el.placeholder || '',
          text: el.textContent?.trim().substring(0, 60) || '',
          class: el.className?.substring(0, 50) || '',
        };
        if (el.tagName === 'SELECT') {
          obj.options = Array.from(el.options).map(o => ({ value: o.value, text: o.text }));
        }
        els.push(obj);
      }
    });
    return els;
  });
  console.log(`\n=== ${label} (${page.url()}) ===`);
  console.log(JSON.stringify(fields, null, 2));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // 1. Login page
  await page.goto(`${BASE_URL}/login`);
  await page.waitForTimeout(2000);
  await dumpPage(page, 'LOGIN PAGE');

  // 2. Register page
  await page.goto(`${BASE_URL}/register`);
  await page.waitForTimeout(2000);
  await dumpPage(page, 'REGISTER PAGE');

  // 3. Register a demo user
  const email = `demo_video@portal-test.com`;
  const password = 'Demo1234!';
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  const nameField = page.locator('input[formcontrolname="full_name"], input[placeholder*="ombre"]').first();
  if (await nameField.isVisible().catch(() => false)) {
    await nameField.fill('Demo User');
  }
  const confirmField = page.locator('input[formcontrolname="confirmPassword"], input[placeholder*="onfirm"]').first();
  if (await confirmField.isVisible().catch(() => false)) {
    await confirmField.fill(password);
  }
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3000);
  console.log('\n=== After register, URL:', page.url(), '===');

  // If redirect to login, login manually
  if (page.url().includes('/login')) {
    await page.locator('input[type="email"]').first().fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(3000);
  }

  console.log('\n=== Authenticated, URL:', page.url(), '===');

  // 4. Convocatorias list
  await page.goto(`${BASE_URL}/convocatorias`);
  await page.waitForTimeout(4000);
  await dumpPage(page, 'CONVOCATORIAS LIST');

  // 5. Bookmarks
  await page.goto(`${BASE_URL}/bookmarks`);
  await page.waitForTimeout(2000);
  await dumpPage(page, 'BOOKMARKS PAGE');

  // 6. Profile
  await page.goto(`${BASE_URL}/profile`);
  await page.waitForTimeout(2000);
  await dumpPage(page, 'PROFILE PAGE');

  await browser.close();
  console.log('\n=== DISCOVERY COMPLETE ===');
})();

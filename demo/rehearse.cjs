'use strict';
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:4200';
const DEMO_EMAIL = `demo_video_${Date.now()}@portal-test.com`;
const DEMO_PASSWORD = 'Demo1234!';
const DEMO_NAME = 'Rafael Demo';

async function ensureVisible(page, locator, label) {
  const el = typeof locator === 'string' ? page.locator(locator).first() : locator;
  const visible = await el.isVisible().catch(() => false);
  if (!visible) {
    const found = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button, input, select, textarea, a'))
        .filter(el => el.offsetParent !== null)
        .map(el => `${el.tagName}[${el.type || ''}] "${el.textContent?.trim().substring(0, 30)}" placeholder="${el.placeholder || ''}"`)
        .join('\n  ')
    );
    console.error(`REHEARSAL FAIL: "${label}"`);
    console.error('  Visible elements:\n  ' + found);
    return false;
  }
  console.log(`REHEARSAL OK: "${label}"`);
  return true;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  let allOk = true;

  // --- REGISTER PAGE ---
  await page.goto(`${BASE_URL}/register`);
  await page.waitForTimeout(2000);

  allOk &= await ensureVisible(page, 'input[placeholder="Tu nombre"]', 'Register: full_name field');
  allOk &= await ensureVisible(page, 'input[type="email"]', 'Register: email field');
  allOk &= await ensureVisible(page, 'input[placeholder="Mínimo 8 caracteres"]', 'Register: password field');
  allOk &= await ensureVisible(page, 'button[type="submit"]', 'Register: Crear cuenta button');

  // Fill and submit
  await page.locator('input[placeholder="Tu nombre"]').fill(DEMO_NAME);
  await page.locator('input[type="email"]').fill(DEMO_EMAIL);
  await page.locator('input[placeholder="Mínimo 8 caracteres"]').fill(DEMO_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);

  if (!page.url().includes('/convocatorias')) {
    console.error(`REHEARSAL FAIL: Register redirect — expected /convocatorias, got ${page.url()}`);
    allOk = false;
  } else {
    console.log(`REHEARSAL OK: Register redirect -> ${page.url()}`);
  }

  // Wait for SECOP data
  await page.waitForTimeout(3000);

  // --- CONVOCATORIAS LIST ---
  allOk &= await ensureVisible(page, 'input[placeholder="Palabra clave..."]', 'Convocatorias: search input');
  allOk &= await ensureVisible(page, 'input[placeholder="Nombre de entidad"]', 'Convocatorias: entidad filter');
  allOk &= await ensureVisible(page, 'button:has-text("Buscar")', 'Convocatorias: Buscar button');
  allOk &= await ensureVisible(page, 'a.btn-ghost', 'Convocatorias: Ver detalle link');
  allOk &= await ensureVisible(page, 'button.btn-outline', 'Convocatorias: Guardar button');

  // Grab detail URL
  const detailHref = await page.locator('a.btn-ghost').first().getAttribute('href').catch(() => null);
  console.log(`REHEARSAL INFO: Ver detalle href = "${detailHref}"`);

  // --- SAVE A BOOKMARK ---
  await page.locator('button.btn-outline').first().click();
  await page.waitForTimeout(3000);
  console.log(`REHEARSAL INFO: After Guardar click, URL = ${page.url()}`);

  // --- BOOKMARKS PAGE ---
  await page.goto(`${BASE_URL}/bookmarks`);
  await page.waitForTimeout(2000);
  allOk &= await ensureVisible(page, 'a:has-text("Guardados")', 'Navbar: Guardados link');

  const bookmarkCard = page.locator('.bookmark-card, .card, article').first();
  const hasBookmark = await bookmarkCard.isVisible().catch(() => false);
  if (hasBookmark) {
    console.log('REHEARSAL OK: Bookmark card visible after save');
    const hasDelete = await page.locator('button:has-text("Eliminar")').first().isVisible().catch(() => false);
    console.log(`REHEARSAL INFO: Eliminar button visible = ${hasDelete}`);
  } else {
    console.warn('REHEARSAL WARN: No bookmark card visible yet');
  }

  // --- PROFILE PAGE ---
  await page.goto(`${BASE_URL}/profile`);
  await page.waitForTimeout(2000);
  allOk &= await ensureVisible(page, 'input[placeholder="Tu nombre"]', 'Profile: full_name input');
  allOk &= await ensureVisible(page, 'button:has-text("Guardar cambios")', 'Profile: Guardar cambios button');

  await browser.close();

  if (allOk) {
    console.log('\nREHEARSAL PASSED — all selectors verified');
    process.exit(0);
  } else {
    console.error('\nREHEARSAL FAILED — fix selectors before recording');
    process.exit(1);
  }
})();

'use strict';
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:4200';
const VIDEO_DIR = path.join(__dirname, 'screenshots');
const OUTPUT_NAME = 'demo-portal-secop.webm';
const DEMO_EMAIL = `demo_${Date.now()}@portal-secop.co`;
const DEMO_PASSWORD = 'Demo1234!';
const DEMO_NAME = 'Rafael Peña';

// ── Helpers ────────────────────────────────────────────────────────────────

async function injectCursor(page) {
  await page.evaluate(() => {
    const existing = document.getElementById('demo-cursor');
    if (existing) existing.remove();
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 3L19 12L12 13L9 20L5 3Z" fill="white" stroke="black" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`;
    cursor.style.cssText = `
      position: fixed; z-index: 999999; pointer-events: none;
      width: 24px; height: 24px;
      transition: left 0.1s, top 0.1s;
      filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
    `;
    cursor.style.left = '640px';
    cursor.style.top = '360px';
    document.body.appendChild(cursor);
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });
  });
}

async function injectSubtitleBar(page) {
  await page.evaluate(() => {
    const existing = document.getElementById('demo-subtitle');
    if (existing) existing.remove();
    const bar = document.createElement('div');
    bar.id = 'demo-subtitle';
    bar.style.cssText = `
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 999998;
      text-align: center; padding: 12px 24px;
      background: rgba(15, 23, 42, 0.85);
      color: white; font-family: -apple-system, "Segoe UI", sans-serif;
      font-size: 16px; font-weight: 500; letter-spacing: 0.3px;
      transition: opacity 0.3s;
      pointer-events: none;
    `;
    bar.textContent = '';
    bar.style.opacity = '0';
    document.body.appendChild(bar);
  });
}

async function showSubtitle(page, text) {
  await page.evaluate((t) => {
    const bar = document.getElementById('demo-subtitle');
    if (!bar) return;
    bar.textContent = t || '';
    bar.style.opacity = t ? '1' : '0';
  }, text);
  if (text) await page.waitForTimeout(600);
}

async function moveAndClick(page, locator, label, opts = {}) {
  const { postClickDelay = 800, ...clickOpts } = opts;
  const el = typeof locator === 'string' ? page.locator(locator).first() : locator;
  const visible = await el.isVisible().catch(() => false);
  if (!visible) {
    console.error(`WARNING: moveAndClick skipped — "${label}" not visible`);
    return false;
  }
  try {
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const box = await el.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
      await page.waitForTimeout(350);
    }
    await el.click(clickOpts);
  } catch (e) {
    console.error(`WARNING: moveAndClick failed on "${label}": ${e.message}`);
    return false;
  }
  await page.waitForTimeout(postClickDelay);
  return true;
}

async function typeSlowly(page, locator, text, label, charDelay = 40) {
  const el = typeof locator === 'string' ? page.locator(locator).first() : locator;
  const visible = await el.isVisible().catch(() => false);
  if (!visible) {
    console.error(`WARNING: typeSlowly skipped — "${label}" not visible`);
    return false;
  }
  await moveAndClick(page, el, label);
  await el.fill('');
  await el.pressSequentially(text, { delay: charDelay });
  await page.waitForTimeout(400);
  return true;
}

async function panElements(page, selector, maxCount = 5) {
  const elements = await page.locator(selector).all();
  for (let i = 0; i < Math.min(elements.length, maxCount); i++) {
    try {
      const box = await elements[i].boundingBox();
      if (box && box.y < 680) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
        await page.waitForTimeout(700);
      }
    } catch (e) {
      console.warn(`WARNING: panElements skipped element ${i}: ${e.message}`);
    }
  }
}

async function setup(page) {
  await injectCursor(page);
  await injectSubtitleBar(page);
}

// ── Main ───────────────────────────────────────────────────────────────────

(async () => {
  if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  try {
    // ── Paso 1: Crear cuenta ──────────────────────────────────────────────
    await page.goto(`${BASE_URL}/register`);
    await page.waitForTimeout(1500);
    await setup(page);
    await showSubtitle(page, 'Paso 1 — Crear una cuenta nueva');

    await typeSlowly(page, 'input[placeholder="Tu nombre"]', DEMO_NAME, 'full_name');
    await page.waitForTimeout(300);
    await typeSlowly(page, 'input[type="email"]', DEMO_EMAIL, 'email');
    await page.waitForTimeout(300);
    await typeSlowly(page, 'input[placeholder="Mínimo 8 caracteres"]', DEMO_PASSWORD, 'password');
    await page.waitForTimeout(500);

    await showSubtitle(page, 'Paso 1 — Enviando registro...');
    await moveAndClick(page, 'button[type="submit"]', 'Crear cuenta', { postClickDelay: 4000 });
    console.log('After register:', page.url());

    // ── Paso 2: Convocatorias en vivo ─────────────────────────────────────
    await setup(page);
    await showSubtitle(page, 'Paso 2 — Convocatorias públicas en tiempo real (SECOP)');
    await page.waitForTimeout(2500);

    await panElements(page, '.navbar-links a, .navbar-brand', 4);
    await page.waitForTimeout(800);

    await showSubtitle(page, 'Paso 2 — Datos en vivo desde datos.gov.co');
    await panElements(page, '.conv-card, article, .card', 4);
    await page.waitForTimeout(1000);

    // ── Paso 3: Buscar por palabra clave ──────────────────────────────────
    await showSubtitle(page, 'Paso 3 — Buscar convocatorias por palabra clave');
    await page.waitForTimeout(800);

    await typeSlowly(page, 'input[placeholder="Palabra clave..."]', 'hospital', 'search keyword', 50);
    await page.waitForTimeout(600);
    await moveAndClick(page, 'button:has-text("Buscar")', 'Buscar', { postClickDelay: 4000 });

    await setup(page);
    await showSubtitle(page, 'Paso 3 — Resultados filtrados por "hospital"');
    await page.waitForTimeout(1500);
    await panElements(page, '.conv-card, article, .card', 3);
    await page.waitForTimeout(800);

    // ── Paso 4: Guardar bookmark ──────────────────────────────────────────
    await showSubtitle(page, 'Paso 4 — Guardar una convocatoria de interés');
    await page.waitForTimeout(800);

    await moveAndClick(page, 'button.btn-outline', 'Guardar primera convocatoria', { postClickDelay: 3500 });
    await setup(page);
    await showSubtitle(page, 'Paso 4 — Convocatoria guardada con snapshot SECOP');
    await page.waitForTimeout(2000);

    // ── Paso 5: Mis guardados ─────────────────────────────────────────────
    await showSubtitle(page, 'Paso 5 — Ver mis convocatorias guardadas');
    await moveAndClick(page, 'a:has-text("Guardados")', 'Guardados nav link', { postClickDelay: 2500 });

    await setup(page);
    await showSubtitle(page, 'Paso 5 — Bookmark guardado con datos completos');
    await page.waitForTimeout(1500);
    await panElements(page, '.bookmark-card, article, .card', 2);
    await page.waitForTimeout(1000);

    await showSubtitle(page, 'Paso 5 — Eliminar bookmark (soft-delete)');
    await page.waitForTimeout(800);
    await moveAndClick(page, 'button:has-text("Eliminar")', 'Eliminar bookmark', { postClickDelay: 3000 });
    await setup(page);
    await showSubtitle(page, 'Paso 5 — Lista vacía tras eliminar');
    await page.waitForTimeout(1500);

    // ── Paso 6: Perfil ────────────────────────────────────────────────────
    await showSubtitle(page, 'Paso 6 — Gestionar perfil de usuario');
    await moveAndClick(page, 'a:has-text("Perfil")', 'Perfil nav link', { postClickDelay: 2000 });

    await setup(page);
    await showSubtitle(page, 'Paso 6 — Actualizar nombre de usuario');
    await page.waitForTimeout(1000);

    await typeSlowly(page, 'input[placeholder="Tu nombre"]', 'Rafael Peña Meña', 'full_name update', 45);
    await page.waitForTimeout(500);
    await moveAndClick(page, 'button:has-text("Guardar cambios")', 'Guardar cambios', { postClickDelay: 2500 });

    await setup(page);
    await showSubtitle(page, 'Portal SECOP — Convocatorias Públicas de Colombia');
    await page.waitForTimeout(2500);
    await showSubtitle(page, '');
    await page.waitForTimeout(1500);

  } catch (err) {
    console.error('DEMO ERROR:', err.message);
    console.error(err.stack);
  } finally {
    await context.close();
    const video = page.video();
    if (video) {
      try {
        const src = await video.path();
        const dest = path.join(VIDEO_DIR, OUTPUT_NAME);
        fs.copyFileSync(src, dest);
        console.log('Video saved:', dest);
      } catch (e) {
        console.error('ERROR: Failed to copy video:', e.message);
      }
    }
    await browser.close();
  }
})();

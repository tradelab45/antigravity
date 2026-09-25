import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview, type PreviewServer } from 'vite';
import { chromium, type Browser, type Page } from 'playwright';
import { seedSession, waitForStableView } from './contrastAudit';

/**
 * Modal behaviour, checked in the built app.
 *
 * Most of the overlays here were a fixed div and a backdrop: no role, no
 * name, and nothing keeping focus inside. A screen reader announced nothing
 * when one opened, and Tab walked straight out into the page behind it — out
 * of the command palette and into the header, out of the stock detail modal
 * and into the screener. These tests hold that shut.
 */

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

let server: PreviewServer;
let browser: Browser;
let baseUrl: string;

before(async () => {
  assert.ok(
    existsSync(path.join(projectRoot, 'dist', 'index.html')),
    'dist/index.html is missing — run `npm run build` before the dialog check.',
  );

  server = await preview({ root: projectRoot, preview: { port: 0, strictPort: false } });
  const resolved = server.resolvedUrls?.local?.[0];
  assert.ok(resolved, 'Preview server did not report a local URL.');
  baseUrl = resolved.replace(/\/$/, '');

  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });
});

after(async () => {
  await browser?.close();
  if (typeof server?.close === 'function') {
    await server.close();
  } else if (server?.httpServer) {
    await new Promise<void>((resolve, reject) => {
      server.httpServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

interface DialogState {
  open: boolean;
  role: string | null;
  ariaModal: string | null;
  /** A dialog with no accessible name is announced as just "dialog". */
  named: boolean;
  focusInside: boolean | null;
  bodyScrollLocked: boolean;
}

const readDialog = (page: Page): Promise<DialogState> =>
  page.evaluate(() => {
    const visible = [...document.querySelectorAll('[role="dialog"]')].filter(
      (node) => node.getBoundingClientRect().height > 0,
    );
    const dialog = visible[visible.length - 1] ?? null;
    return {
      open: dialog !== null,
      role: dialog?.getAttribute('role') ?? null,
      ariaModal: dialog?.getAttribute('aria-modal') ?? null,
      named: Boolean(dialog?.getAttribute('aria-label') || dialog?.getAttribute('aria-labelledby')),
      focusInside: dialog ? dialog.contains(document.activeElement) : null,
      bodyScrollLocked: getComputedStyle(document.body).overflow === 'hidden',
    };
  });

/** Presses Tab far enough to walk past the end of any of these dialogs. */
const tabAround = async (page: Page, times = 14): Promise<boolean> => {
  for (let i = 0; i < times; i += 1) await page.keyboard.press('Tab');
  return page.evaluate(() => {
    const visible = [...document.querySelectorAll('[role="dialog"]')].filter(
      (node) => node.getBoundingClientRect().height > 0,
    );
    const dialog = visible[visible.length - 1];
    return dialog ? dialog.contains(document.activeElement) : false;
  });
};

const openApp = async (view: string): Promise<Page> => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  await seedSession(page, 'light');
  await page.goto(`${baseUrl}/?view=${view}`, { waitUntil: 'domcontentloaded' });
  await waitForStableView(page);
  await page.waitForTimeout(800);
  return page;
};

test('the command palette is a dialog and keeps focus', { timeout: 90_000 }, async () => {
  const page = await openApp('home');
  try {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(700);

    const opened = await readDialog(page);
    assert.equal(opened.open, true, 'Ctrl+K did not open the palette.');
    assert.equal(opened.ariaModal, 'true');
    assert.ok(opened.named, 'The palette has no accessible name.');
    assert.equal(opened.focusInside, true, 'Focus did not land inside the palette.');
    assert.equal(opened.bodyScrollLocked, true, 'The page still scrolls behind the palette.');

    assert.equal(await tabAround(page), true, 'Tab walked out of the palette.');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    assert.equal((await readDialog(page)).open, false, 'Escape did not close the palette.');
  } finally {
    await page.close();
  }
});

test('the stock detail modal is a dialog and keeps focus', { timeout: 120_000 }, async () => {
  const page = await openApp('screener');
  try {
    const trade = page.getByRole('button', { name: 'Trade', exact: true }).first();
    await trade.waitFor({ state: 'visible', timeout: 30000 });
    await trade.click();
    await page.waitForTimeout(1500);

    const opened = await readDialog(page);
    assert.equal(opened.open, true, 'Opening a stock did not render a dialog.');
    assert.equal(opened.ariaModal, 'true');
    assert.ok(opened.named, 'The stock modal has no accessible name.');
    assert.equal(opened.focusInside, true, 'Focus did not move into the stock modal.');
    assert.equal(opened.bodyScrollLocked, true, 'The screener still scrolls behind the modal.');

    assert.equal(await tabAround(page), true, 'Tab walked out of the stock modal.');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
    assert.equal((await readDialog(page)).open, false, 'Escape did not close the stock modal.');
  } finally {
    await page.close();
  }
});

test('every modal component is exposed as a dialog', { timeout: 60_000 }, async () => {
  // A guard on the source rather than the DOM: a new overlay that forgets its
  // role would otherwise only be caught if a test happened to open it.
  const { readdirSync, readFileSync } = await import('node:fs');
  const componentDir = path.join(projectRoot, 'src', 'components');
  const offenders: string[] = [];

  for (const file of readdirSync(componentDir)) {
    if (!file.endsWith('Modal.tsx')) continue;
    const source = readFileSync(path.join(componentDir, file), 'utf8');
    const declaresRole = source.includes('role="dialog"');
    const usesHook = source.includes('useModalDialog');
    if (!declaresRole && !usesHook) offenders.push(file);
  }

  assert.deepEqual(
    offenders,
    [],
    `These modals are not exposed as dialogs. Give the overlay useModalDialog:\n  ${offenders.join('\n  ')}`,
  );
});

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview, type PreviewServer } from 'vite';
import { chromium, type Browser } from 'playwright';
import { seedSession, waitForStableView } from './contrastAudit';

/**
 * What a screen reader gets from a chart, and what a keyboard gets past a
 * long column.
 *
 * Recharts draws an SVG with no accessible content, so every chart in the app
 * was announced as nothing at all. These check that the picture is marked as
 * decoration, that the meaning is in the page as text, and that the in-view
 * skip links actually move focus rather than only scrolling.
 */

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

let server: PreviewServer;
let browser: Browser;
let baseUrl: string;

before(async () => {
  assert.ok(
    existsSync(path.join(projectRoot, 'dist', 'index.html')),
    'dist/index.html is missing — run `npm run build` before the chart check.',
  );

  server = await preview({ root: projectRoot, preview: { port: 0, strictPort: false } });
  const resolved = server.resolvedUrls?.local?.[0];
  assert.ok(resolved, 'Preview server did not report a local URL.');
  baseUrl = resolved.replace(/\/$/, '');

  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
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

test('the calculator chart is described rather than left silent', { timeout: 90_000 }, async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await seedSession(page, 'light');
    await page.goto(`${baseUrl}/?view=calculator`, { waitUntil: 'domcontentloaded' });
    await waitForStableView(page);

    const figure = page.locator('figure[role="group"]').first();
    await figure.waitFor({ timeout: 20_000 });

    const summary = await figure.evaluate((node) => {
      const labelled = node.getAttribute('aria-labelledby');
      const described = labelled ? node.ownerDocument.getElementById(labelled) : null;
      return {
        text: described?.textContent?.trim() ?? '',
        svgHidden: node.querySelector('svg')?.closest('[aria-hidden="true"]') !== null,
      };
    });

    assert.ok(summary.text.length > 40, `the chart summary is too thin to be useful: "${summary.text}"`);
    assert.match(summary.text, /\d/, 'a description with no numbers in it describes nothing');
    assert.ok(summary.svgHidden, 'the drawing must be marked as decoration once the text carries it');
  } finally {
    await page.close();
  }
});

test('the numbers behind a chart can be read as a table', { timeout: 90_000 }, async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await seedSession(page, 'light');
    await page.goto(`${baseUrl}/?view=calculator`, { waitUntil: 'domcontentloaded' });
    await waitForStableView(page);

    await page.waitForSelector('figure[role="group"] button', { timeout: 20_000 });

    // Read and click in the page rather than through a locator: the view
    // re-renders on every market tick, and a locator resolved between two of
    // them is chasing a moving target.
    const state = await page.evaluate(async () => {
      const button = document.querySelector('figure[role="group"] button') as HTMLButtonElement;
      const before = button.getAttribute('aria-expanded');
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const after = document
        .querySelector('figure[role="group"] button')
        ?.getAttribute('aria-expanded');
      return {
        before,
        after,
        label: button.textContent?.trim() ?? '',
        rows: document.querySelectorAll('figure[role="group"] table tbody tr').length,
        headings: Array.from(
          document.querySelectorAll('figure[role="group"] table thead th'),
        ).map((cell) => cell.textContent?.trim()),
      };
    });

    assert.equal(state.before, 'false', 'the numbers start closed');
    assert.equal(state.after, 'true', 'and the button says it opened them');
    assert.ok(state.rows > 0, 'the table opened with nothing in it');
    assert.equal(state.headings.length, 2, 'both columns need a heading to be readable');
  } finally {
    await page.close();
  }
});

test('an in-view skip link moves focus, not just the scroll position', { timeout: 90_000 }, async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await seedSession(page, 'light');
    await page.goto(`${baseUrl}/?view=academy`, { waitUntil: 'domcontentloaded' });
    await waitForStableView(page);

    const link = page.getByRole('link', { name: /skip to the lesson$/i }).first();
    await link.waitFor({ timeout: 20_000 });

    // Hidden until focused, exactly like the page's own skip link.
    await link.focus();
    assert.ok(await link.isVisible(), 'a skip link has to appear when it takes focus');

    await link.press('Enter');
    const landed = await page.evaluate(() => document.activeElement?.id ?? '');
    assert.equal(
      landed,
      'academy-lesson',
      'following the link left focus behind, which helps nobody using a screen reader',
    );
  } finally {
    await page.close();
  }
});

test('nothing focusable is hidden inside a chart', { timeout: 90_000 }, async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  try {
    await seedSession(page, 'light');
    await page.goto(`${baseUrl}/?view=calculator`, { waitUntil: 'domcontentloaded' });
    await waitForStableView(page);
    await page.waitForSelector('figure[role="group"]', { timeout: 20_000 });

    // Marking the drawing as decoration is only safe while it holds nothing a
    // keyboard can land on: focus that reaches an aria-hidden element is
    // announced as nothing at all, which is worse than the silence this
    // replaced.
    const trapped = () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('[aria-hidden="true"]'))
          .flatMap((node) =>
            Array.from(
              node.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'),
            ),
          )
          .map((node) => `${node.tagName.toLowerCase()}[tabindex=${node.getAttribute('tabindex')}]`),
      );

    // Checked at two moments on purpose. The chart's surface is drawn a frame
    // after its container is measured, so a check that only ran once was
    // passing locally and failing on CI depending on which side of that frame
    // it landed. A resize makes the chart redraw, which is the other way the
    // attribute came back.
    assert.deepEqual(await trapped(), [], 'these can be focused but not announced, on first paint');

    await page.setViewportSize({ width: 1100, height: 900 });
    await page.waitForTimeout(1_000);
    assert.deepEqual(await trapped(), [], 'and again once the chart has been redrawn');
  } finally {
    await page.close();
  }
});

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview, type PreviewServer } from 'vite';
import { chromium, type Browser } from 'playwright';
import {
  auditContrast,
  MINIMUM_CONTRAST,
  PALETTES,
  seedSession,
  THEMES,
  VIEWS,
  waitForStableView,
  type ContrastFinding,
  type Palette,
  type Theme,
} from './contrastAudit';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

let server: PreviewServer;
let browser: Browser;
let baseUrl: string;

before(async () => {
  assert.ok(
    existsSync(path.join(projectRoot, 'dist', 'index.html')),
    'dist/index.html is missing — run `npm run build` before the contrast check.',
  );

  server = await preview({ root: projectRoot, preview: { port: 0, strictPort: false } });
  const resolved = server.resolvedUrls?.local?.[0];
  assert.ok(resolved, 'Preview server did not report a local URL.');
  baseUrl = resolved.replace(/\/$/, '');

  browser = await chromium.launch({
    // Honoured when a runner pins a specific binary; otherwise Playwright
    // resolves the browser it installed itself.
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });
});

after(async () => {
  await browser?.close();
  // Vite exposes close() on the preview server from 6.x; fall back to the raw
  // http server so the run cannot hang on an older or newer shape.
  if (typeof server?.close === 'function') {
    await server.close();
  } else if (server?.httpServer) {
    await new Promise<void>((resolve, reject) => {
      server.httpServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

const describeFindings = (findings: ContrastFinding[]): string =>
  findings
    .map(
      (finding) =>
        `  ${finding.ratio.toFixed(2)}:1  "${finding.text}"\n` +
        `        colour ${finding.color} on ${finding.background}\n` +
        `        ${finding.selector}`,
    )
    .join('\n');

for (const view of VIEWS) {
  for (const theme of THEMES as readonly Theme[]) {
    test(`${view} has readable text in ${theme} mode`, { timeout: 90_000 }, async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const pageErrors: string[] = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));

      try {
        await seedSession(page, theme);
        await page.goto(`${baseUrl}/?view=${view}`, { waitUntil: 'domcontentloaded' });
        await waitForStableView(page);

        const findings = await auditContrast(page);

        assert.deepEqual(
          pageErrors,
          [],
          `${view} (${theme}) raised a runtime error:\n  ${pageErrors.join('\n  ')}`,
        );
        assert.equal(
          findings.length,
          0,
          `${view} (${theme}) has ${findings.length} text node(s) below ${MINIMUM_CONTRAST}:1.\n` +
            `${describeFindings(findings)}\n` +
            'Give the element a dark: variant, or move it off a shade that collides with its surface.',
        );
      } finally {
        await page.close();
      }
    });
  }
}

/**
 * The per-view sweep above runs on the classic palette. Every other palette
 * re-tints the canvas, and in dark mode the card surfaces too, so each one is
 * swept across a few representative views: a dense data screen, a reading
 * screen and a form-heavy screen.
 */
const PALETTE_VIEWS = ['screener', 'academy', 'portfolio'] as const;

for (const palette of PALETTES.filter((option): option is Palette => option !== 'classic')) {
  for (const theme of THEMES as readonly Theme[]) {
    test(`the ${palette} palette stays readable in ${theme} mode`, { timeout: 120_000 }, async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const pageErrors: string[] = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));

      try {
        await seedSession(page, theme, palette);
        const failures: string[] = [];

        for (const view of PALETTE_VIEWS) {
          await page.goto(`${baseUrl}/?view=${view}`, { waitUntil: 'domcontentloaded' });
          await waitForStableView(page);
          const findings = await auditContrast(page);
          if (findings.length > 0) {
            failures.push(`${view} (${palette}/${theme}):\n${describeFindings(findings)}`);
          }
        }

        assert.deepEqual(
          pageErrors,
          [],
          `${palette} (${theme}) raised a runtime error:\n  ${pageErrors.join('\n  ')}`,
        );
        assert.equal(
          failures.length,
          0,
          `The ${palette} palette drops text below ${MINIMUM_CONTRAST}:1 in ${theme} mode.\n${failures.join('\n')}\n` +
            'Re-tune the palette tokens in src/index.css rather than the components.',
        );
      } finally {
        await page.close();
      }
    });
  }
}

/**
 * The landing page, which none of the sweeps above reach: they all sign a
 * demo user in, and the landing page is what a signed-out visitor sees. It
 * is its own light theme rather than the app's, so nothing else covers it.
 */
test('the landing page has readable text', { timeout: 120_000 }, async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    // Deliberately unseeded: no user, so the landing page renders.
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.rr-landing', { timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    // Walk the page so every reveal has fired before measuring.
    await page.evaluate(async () => {
      const height = document.body.scrollHeight;
      for (let i = 0; i < 12; i += 1) {
        window.scrollTo(0, (height / 12) * i);
        await new Promise((resolve) => setTimeout(resolve, 260));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);

    const findings = await auditContrast(page);

    assert.deepEqual(pageErrors, [], `The landing page raised a runtime error:\n  ${pageErrors.join('\n  ')}`);
    assert.equal(
      findings.length,
      0,
      `The landing page has ${findings.length} text node(s) below ${MINIMUM_CONTRAST}:1.\n${describeFindings(findings)}`,
    );
  } finally {
    await page.close();
  }
});

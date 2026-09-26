import type { Page } from 'playwright';

/**
 * Minimum contrast ratio a text node must reach against its backdrop.
 *
 * WCAG AA asks for 4.5:1 on body text and 3:1 on large text. This gate is set
 * at the large-text figure because it exists to catch broken theming — light
 * text left on a light surface, or the reverse — rather than to grade every
 * label. Anything at or under this is unreadable regardless of size.
 */
export const MINIMUM_CONTRAST = 3;

/** Every routed view, so a new one cannot quietly skip the check. */
export const VIEWS = [
  'home',
  'screener',
  'portfolio',
  'watchlist',
  'academy',
  'review',
  'journal',
  'replay',
  'calculator',
  'challenges',
  'badges',
  'chanakya',
  'help',
  'privacy',
] as const;

export const THEMES = ['light', 'dark'] as const;

export type Theme = typeof THEMES[number];

/**
 * Every background palette. Each one re-tints the page canvas, and in dark
 * mode the card surfaces as well, so a palette can break contrast on its own
 * without any component changing.
 */
export const PALETTES = [
  'classic',
  'midnight',
  'forest',
  'sunrise',
  'ocean',
  'plum',
  'mono',
] as const;

export type Palette = typeof PALETTES[number];

export interface ContrastFinding {
  text: string;
  ratio: number;
  color: string;
  background: string;
  selector: string;
}

const DEMO_USER = {
  id: 'contrast-audit-user',
  fullName: 'Audit Runner',
  email: 'audit@example.invalid',
  username: 'audit',
  experienceLevel: 'BEGINNER' as const,
  initialCapital: 1000000,
};

/**
 * Signs in a local demo account and suppresses the first-run overlays, which
 * otherwise cover the page and hide most of what needs measuring.
 */
export async function seedSession(page: Page, theme: Theme, palette: Palette = 'classic'): Promise<void> {
  // The app asks the server who is signed in and drops its cached copy if the
  // answer is no, so seeding localStorage alone now lands on the signed-out
  // landing page — which would quietly leave these checks measuring the wrong
  // thing. The stub stands in for the session the server would have issued.
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        authenticated: true,
        user: { ...DEMO_USER, registeredAt: new Date().toISOString(), lastLoginAt: new Date().toISOString() },
        session: { expiresAt: Date.now() + 86_400_000, verified: true, durable: true, ttlMs: 86_400_000 },
      }),
    }),
  );

  // tsx transpiles with esbuild, which wraps named functions in a `__name`
  // helper. That helper does not travel with a function serialised into
  // page.evaluate, so it is defined in the page first. Passed as raw content
  // so it is never itself transpiled.
  await page.addInitScript({ content: 'globalThis.__name = globalThis.__name || ((fn) => fn);' });

  await page.addInitScript(
    ([user, mode, tint]: [typeof DEMO_USER, string, string]) => {
      const now = new Date().toISOString();
      const account = { ...user, registeredAt: now, lastLoginAt: now };
      localStorage.setItem('rr_current_user', JSON.stringify(account));
      localStorage.setItem(`rr_last_activity:${account.id}`, String(Date.now()));
      localStorage.setItem('rupeeRookie_theme', mode);
      localStorage.setItem('rupeeRookie_palette', tint);
      localStorage.setItem(`rr_profile_completed_${account.id}`, 'true');
      localStorage.setItem('rupeerookie-mobile-menu-hint-seen-v1', 'true');
      // An unread notification so the toast overlay is on screen to be measured.
      localStorage.setItem(
        `rr_notifications:${account.id}`,
        JSON.stringify([
          { id: 'contrast-audit-toast', type: 'SUCCESS', title: 'Order executed', message: 'Bought 1 RELIANCE at the last traded price.', timestamp: Date.now(), read: false },
        ]),
      );
      sessionStorage.setItem(`rr_guided_session_${account.id}`, 'true');
      const day = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      localStorage.setItem(`rr_daily_tip_seen:${account.id}:${day}`, 'true');
    },
    [DEMO_USER, theme, palette] as [typeof DEMO_USER, string, string],
  );
}

/** Waits until the view has rendered and stopped growing. */
export async function waitForStableView(page: Page): Promise<void> {
  await page.waitForSelector('main', { state: 'attached', timeout: 20000 });
  await page.waitForFunction(() => (document.querySelector('main')?.children.length ?? 0) > 0, undefined, {
    timeout: 20000,
  });
  await page.evaluate(() => document.fonts.ready);

  let previous = -1;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const height = await page.evaluate(() => document.querySelector('main')?.scrollHeight ?? 0);
    if (height === previous && height > 0) return;
    previous = height;
    await page.waitForTimeout(400);
  }
}

/**
 * Measures every text node inside <main>, plus the fixed overlays that sit
 * outside it, against the colour actually painted behind it and returns the
 * ones below `minimum`.
 *
 * Overlays are included because a toast rendered at the document root is
 * never inside <main>: the order toast stayed white with slate-900 text in
 * dark mode precisely because nothing measured it.
 *
 * Elements are skipped, rather than reported, when the backdrop cannot be
 * determined — a gradient or image with no solid colour underneath — so the
 * check never fails on a value it could not measure.
 */
export async function auditContrast(page: Page, minimum: number = MINIMUM_CONTRAST): Promise<ContrastFinding[]> {
  // Covers pages that navigated before the init script could run.
  await page.evaluate('globalThis.__name = globalThis.__name || ((fn) => fn);');

  return page.evaluate((threshold: number) => {
    // Tailwind v4 emits oklch(), which canvas fillStyle preserves verbatim, so
    // colours are rasterised to a pixel and read back in sRGB.
    const surface = Object.assign(document.createElement('canvas'), { width: 1, height: 1 });
    const context = surface.getContext('2d', { willReadFrequently: true });

    interface Rgba { r: number; g: number; b: number; a: number }

    const parse = (value: string): Rgba | null => {
      if (!value || value === 'transparent' || value === 'none') return null;
      const rgb = value.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
      if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: rgb[4] === undefined ? 1 : +rgb[4] };
      if (!context) return null;
      try {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
        return { r, g, b, a: a / 255 };
      } catch {
        return null;
      }
    };

    const luminance = ({ r, g, b }: Rgba): number => {
      const channel = (raw: number) => {
        const value = raw / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };

    const ratio = (a: Rgba, b: Rgba): number => {
      const first = luminance(a);
      const second = luminance(b);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };

    /** Nearest ancestor colour actually painted behind the element. */
    /**
     * Pulls the colour stops out of a gradient so text sitting on one can be
     * measured against its worst stop rather than skipped.
     *
     * Skipping gradients let a real bug through: a metal button rendered
     * dark-green text on a dark steel ramp and the audit said nothing,
     * because the ramp is a background-image.
     */
    const gradientStops = (backgroundImage: string): Rgba[] => {
      if (!backgroundImage.includes('gradient')) return [];
      const stops: Rgba[] = [];
      // A linear ramp crosses the whole box, so text can sit anywhere along it
      // and every stop counts. A radial one puts its first stop in the middle,
      // which is where centred content sits — judging such text against the
      // rim colour it never touches would invent failures.
      const radial = /radial-gradient|conic-gradient/.test(backgroundImage);
      // Only explicit rgb()/hex stops. A bare keyword would parse to black and
      // invent failures on any gradient that uses `transparent`.
      const pattern = /(rgba?\([^)]*\)|#[0-9a-fA-F]{6,8}\b)/g;
      for (const token of backgroundImage.match(pattern) ?? []) {
        const colour = parse(token);
        if (colour && colour.a > 0.85) stops.push(colour);
      }
      return radial ? stops.slice(0, 1) : stops;
    };

    /** Standard source-over compositing of one translucent layer on another. */
    const over = (top: Rgba, bottom: Rgba): Rgba => {
      const alpha = top.a + bottom.a * (1 - top.a);
      if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
      const channel = (t: number, b: number) =>
        (t * top.a + b * bottom.a * (1 - top.a)) / alpha;
      return {
        r: channel(top.r, bottom.r),
        g: channel(top.g, bottom.g),
        b: channel(top.b, bottom.b),
        a: alpha,
      };
    };

    /**
     * The colour actually painted behind an element. A gradient returns its
     * stops so the caller can test the least favourable one; `null` means
     * genuinely unmeasurable (an image, or a gradient of no solid stops).
     *
     * Translucent layers are composited rather than skipped. Treating anything
     * under 0.85 alpha as "not a background" and reading through it let a whole
     * class of bug past: the landing page's insight callout kept a
     * `rgba(20, 25, 50, 0.72)` slab from the dark design, so ink-coloured text
     * sat on near-black while the audit measured it against the white section
     * behind and called it 8:1.
     */
    const backdrop = (element: Element): Rgba | Rgba[] | null => {
      // Translucent layers between the text and the first opaque surface,
      // nearest the text first.
      const layers: Rgba[] = [];
      let bases: Rgba[] | null = null;
      let node: Element | null = element;
      let depth = 0;

      while (node && node !== document.documentElement) {
        const styles = getComputedStyle(node);
        const colour = parse(styles.backgroundColor);
        if (styles.backgroundImage && styles.backgroundImage !== 'none') {
          const stops = depth <= 1 ? gradientStops(styles.backgroundImage) : [];
          if (stops.length > 0) {
            bases = stops;
            break;
          }
          if (colour && colour.a > 0.85) {
            bases = [colour];
            break;
          }
          return null; // an image, or a ramp of no solid stops
        }
        if (colour && colour.a >= 0.995) {
          bases = [colour];
          break;
        }
        if (colour && colour.a > 0.02) layers.push(colour);
        node = node.parentElement;
        depth += 1;
      }

      // Nothing opaque before the root: the page itself paints white.
      const resolved = bases ?? [{ r: 255, g: 255, b: 255, a: 1 }];
      // Bottom-most layer first, so each one is composited onto what shows
      // through it.
      return resolved.map((base) =>
        layers.reduceRight((beneath, layer) => over(layer, beneath), base),
      );
    };

    const findings: Array<{ text: string; ratio: number; color: string; background: string; selector: string }> = [];

    // <main> plus anything fixed to the viewport outside it: toasts, banners,
    // the mobile tab bar and the quick dock.
    const roots = new Set<Element>();
    document.querySelectorAll('main *').forEach((element) => roots.add(element));
    // The signed-out landing page renders its own root rather than <main>.
    document.querySelectorAll('.rr-landing *').forEach((element) => roots.add(element));
    document.querySelectorAll('body *').forEach((element) => {
      if (element.closest('main')) return;
      if (getComputedStyle(element).position !== 'fixed') return;
      roots.add(element);
      element.querySelectorAll('*').forEach((child) => roots.add(child));
    });

    roots.forEach((element) => {
      const ownText = Array.from(element.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent?.trim() ?? '')
        .join(' ')
        .trim();
      if (!ownText) return;

      const box = element.getBoundingClientRect();
      if (box.width < 4 || box.height < 4) return;

      const styles = getComputedStyle(element);
      if (styles.visibility === 'hidden' || styles.opacity === '0') return;
      if (element.closest('[aria-hidden="true"]')) return; // decorative, not content

      const foreground = parse(styles.color);
      if (!foreground || foreground.a < 0.5) return;

      const background = backdrop(element);
      if (!background) return; // unmeasurable backdrop

      // A gradient is judged on its least favourable stop: text has to stay
      // readable across the whole ramp, not just where it happens to be light.
      const candidates = Array.isArray(background) ? background : [background];
      let worst = candidates[0];
      let measured = ratio(foreground, worst);
      for (const candidate of candidates.slice(1)) {
        const value = ratio(foreground, candidate);
        if (value < measured) {
          measured = value;
          worst = candidate;
        }
      }
      if (measured >= threshold) return;

      findings.push({
        text: ownText.slice(0, 60),
        ratio: Number(measured.toFixed(2)),
        color: styles.color,
        background: `rgb(${Math.round(worst.r)}, ${Math.round(worst.g)}, ${Math.round(worst.b)})`,
        selector: typeof element.className === 'string' ? element.className.slice(0, 120) : element.tagName,
      });
    });

    // One row per distinct colour pairing keeps the failure readable.
    const seen = new Set<string>();
    return findings.filter((finding) => {
      const key = `${finding.selector}|${finding.color}|${finding.background}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, minimum);
}

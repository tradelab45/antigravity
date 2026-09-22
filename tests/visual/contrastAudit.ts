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
export async function seedSession(page: Page, theme: Theme): Promise<void> {
  // tsx transpiles with esbuild, which wraps named functions in a `__name`
  // helper. That helper does not travel with a function serialised into
  // page.evaluate, so it is defined in the page first. Passed as raw content
  // so it is never itself transpiled.
  await page.addInitScript({ content: 'globalThis.__name = globalThis.__name || ((fn) => fn);' });

  await page.addInitScript(
    ([user, mode]: [typeof DEMO_USER, string]) => {
      const now = new Date().toISOString();
      const account = { ...user, registeredAt: now, lastLoginAt: now };
      localStorage.setItem('rr_current_user', JSON.stringify(account));
      localStorage.setItem(`rr_last_activity:${account.id}`, String(Date.now()));
      localStorage.setItem('rupeeRookie_theme', mode);
      localStorage.setItem('rupeeRookie_palette', 'classic');
      localStorage.setItem(`rr_profile_completed_${account.id}`, 'true');
      localStorage.setItem('rupeerookie-mobile-menu-hint-seen-v1', 'true');
      sessionStorage.setItem(`rr_guided_session_${account.id}`, 'true');
      const day = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      localStorage.setItem(`rr_daily_tip_seen:${account.id}:${day}`, 'true');
    },
    [DEMO_USER, theme] as [typeof DEMO_USER, string],
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
 * Measures every text node inside <main> against the colour actually painted
 * behind it and returns the ones below `minimum`.
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
    const backdrop = (element: Element): Rgba | null => {
      let node: Element | null = element;
      while (node && node !== document.documentElement) {
        const styles = getComputedStyle(node);
        const colour = parse(styles.backgroundColor);
        if (styles.backgroundImage && styles.backgroundImage !== 'none') {
          return colour && colour.a > 0.85 ? colour : null;
        }
        if (colour && colour.a > 0.85) return colour;
        node = node.parentElement;
      }
      return { r: 255, g: 255, b: 255, a: 1 };
    };

    const findings: Array<{ text: string; ratio: number; color: string; background: string; selector: string }> = [];

    document.querySelectorAll('main *').forEach((element) => {
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

      const measured = ratio(foreground, background);
      if (measured >= threshold) return;

      findings.push({
        text: ownText.slice(0, 60),
        ratio: Number(measured.toFixed(2)),
        color: styles.color,
        background: `rgb(${background.r}, ${background.g}, ${background.b})`,
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

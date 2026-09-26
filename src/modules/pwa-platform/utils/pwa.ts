import { useSyncExternalStore } from 'react';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
interface PwaState { installable: boolean; installed: boolean; offline: 'preparing' | 'ready' | 'unavailable'; message: string }
let promptEvent: InstallPrompt | null = null;
let state: PwaState = { installable: false, installed: window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone), offline: 'preparing', message: '' };
const listeners = new Set<() => void>();
const update = (patch: Partial<PwaState>) => { state = { ...state, ...patch }; listeners.forEach(listener => listener()); };
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); promptEvent = event as InstallPrompt; update({ installable: true });
});
window.addEventListener('appinstalled', () => { promptEvent = null; update({ installed: true, installable: false, message: '' }); });

export async function installPwa() {
  const event = promptEvent;
  if (!event) return;
  promptEvent = null;
  update({ installable: false, message: '' });
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    update({ message: outcome === 'dismissed' ? 'Installation dismissed.' : 'Installation requested.' });
  } catch { update({ message: 'Installation is unavailable. Try the browser install menu.' }); }
}

export function usePwaState() {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => state);
}

const hasAccount = () => {
  try {
    return Boolean(localStorage.getItem('rr_current_user'));
  } catch {
    return false;
  }
};

/** The browser's idle moment, or a short delay where there is no such API. */
const whenIdle = () =>
  new Promise<void>(resolve => {
    const idle = (window as typeof window & {
      requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
    }).requestIdleCallback;
    if (idle) idle(() => resolve(), { timeout: 4000 });
    else window.setTimeout(resolve, 2000);
  });

let preparing: Promise<void> | null = null;

/**
 * Downloads the Academy and caches it for offline use.
 *
 * Only for somebody with an account to read the lessons with, and only once
 * the browser is otherwise idle. Warming it unconditionally meant every
 * signed-out visitor to the landing page downloaded the lessons and exam banks
 * — about 209 KB — that they had no way to open, which is what splitting the
 * bundle was for. `load`, `online` and a sign-in can all fire close together,
 * so overlapping calls share one run.
 */
export function prepareOfflineAcademy(): Promise<void> {
  if (!preparing) preparing = runPreparation().finally(() => { preparing = null; });
  return preparing;
}

async function runPreparation() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) { update({ offline: 'unavailable' }); return; }
  if (!hasAccount()) return;
  update({ offline: 'preparing' });
  try {
    await navigator.serviceWorker.register('/sw.js');
    const registration = await navigator.serviceWorker.ready;
    await whenIdle();
    await Promise.all([import('../../../components/InvestorAcademy'), import('../../../components/HomeDashboard')]);
    const urls = performance.getEntriesByType('resource').map(entry => entry.name).filter(value => {
      const url = new URL(value);
      return url.origin === location.origin && url.pathname.startsWith('/assets/');
    });
    if (!urls.length || !registration.active) throw new Error('No offline bundle available');
    const success = await new Promise<boolean>(resolve => {
      const channel = new MessageChannel();
      const timeout = window.setTimeout(() => { channel.port1.close(); resolve(false); }, 30000);
      channel.port1.onmessage = event => { clearTimeout(timeout); channel.port1.close(); resolve(event.data?.ready === true); };
      registration.active!.postMessage({ type: 'CACHE_URLS', urls: [...new Set(urls)] }, [channel.port2]);
    });
    update({ offline: success ? 'ready' : 'unavailable' });
  } catch { update({ offline: 'unavailable' }); }
}

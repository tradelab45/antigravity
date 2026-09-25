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

export async function prepareOfflineAcademy() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) { update({ offline: 'unavailable' }); return; }
  update({ offline: 'preparing' });
  try {
    await navigator.serviceWorker.register('/sw.js');
    const registration = await navigator.serviceWorker.ready;
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

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Warm the Academy chunk so its lessons are available offline — but only
      // for somebody who has an account to read them with, and only once the
      // browser is otherwise idle. Doing it unconditionally meant every
      // signed-out visitor to the landing page downloaded 209 KB of lessons
      // and exam banks they had no way to open.
      const hasAccount = (() => {
        try {
          return Boolean(localStorage.getItem('rr_current_user'));
        } catch {
          return false;
        }
      })();

      if (hasAccount) {
        await new Promise<void>((resolve) => {
          const idle = (window as typeof window & {
            requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number;
          }).requestIdleCallback;
          if (idle) idle(() => resolve(), { timeout: 4000 });
          else window.setTimeout(resolve, 2000);
        });
        await import('./components/InvestorAcademy');
      }

      const cacheUrls = performance.getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((url) => url.startsWith(window.location.origin) && (/\/assets\//.test(url) || /InvestorAcademy/.test(url)));
      registration.active?.postMessage({ type: 'CACHE_URLS', urls: Array.from(new Set(cacheUrls)) });
    } catch {
      // The app remains fully usable online when service workers are unavailable.
    }
  });
}

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
      await import('./components/InvestorAcademy');
      const cacheUrls = performance.getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((url) => url.startsWith(window.location.origin) && (/\/assets\//.test(url) || /InvestorAcademy/.test(url)));
      registration.active?.postMessage({ type: 'CACHE_URLS', urls: Array.from(new Set(cacheUrls)) });
    } catch {
      // The app remains fully usable online when service workers are unavailable.
    }
  });
}

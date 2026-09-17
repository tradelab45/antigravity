import React, { useEffect, useState } from 'react';
import { CloudOff, RefreshCw, Wifi } from 'lucide-react';

export function ConnectionStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOffline = () => { setOnline(false); setShowRestored(false); };
    const handleOnline = () => { setOnline(true); setShowRestored(true); window.setTimeout(() => setShowRestored(false), 4000); };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => { window.removeEventListener('offline', handleOffline); window.removeEventListener('online', handleOnline); };
  }, []);

  if (online && !showRestored) return null;
  return (
    <div role="status" aria-live="polite" className={`fixed left-3 right-3 top-3 z-[120] mx-auto flex max-w-xl items-start gap-3 rounded-2xl border p-3 shadow-xl ${online ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-amber-300 bg-amber-50 text-amber-950'}`}>
      {online ? <Wifi className="mt-0.5 h-5 w-5 shrink-0" /> : <CloudOff className="mt-0.5 h-5 w-5 shrink-0" />}
      <div className="min-w-0 flex-1"><p className="text-sm font-black">{online ? 'Connection restored' : 'You are offline'}</p><p className="text-xs leading-relaxed">{online ? 'Fresh market information can load again.' : 'Saved Academy content, notes and learning progress remain available. Market updates and simulated order actions may be unavailable until you reconnect.'}</p></div>
      {!online && <button type="button" onClick={() => window.location.reload()} className="rounded-xl border border-amber-400 p-2" aria-label="Retry connection"><RefreshCw className="h-4 w-4" /></button>}
    </div>
  );
}

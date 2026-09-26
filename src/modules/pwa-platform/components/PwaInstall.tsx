import React, { useState } from 'react';
import { CheckCircle2, Download, RefreshCw, WifiOff } from 'lucide-react';
import { installPwa, prepareOfflineAcademy, usePwaState } from '../utils/pwa';

export function PwaInstall() {
  const state = usePwaState();
  const [showHelp, setShowHelp] = useState(false);
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return <section className="border-y border-slate-200 py-4 text-slate-900 dark:border-slate-700 dark:text-white" aria-label="Install RupeeRookie">
    <h2 className="flex items-center gap-2 text-sm font-bold"><Download size={18} /> RupeeRookie on your device</h2>
    {state.installed ? <p className="mt-3 flex items-center gap-2 text-sm"><CheckCircle2 size={16} /> Installed</p> : <button type="button" onClick={() => state.installable ? void installPwa() : setShowHelp(value => !value)} className="mt-3 flex items-center gap-2 rounded bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white"><Download size={16} /> {state.installable ? 'Install app' : 'Install options'}</button>}
    {showHelp && !state.installable && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{ios ? 'Safari: Share, then Add to Home Screen.' : 'Open your browser menu and choose Install app or Add to Home screen when available.'}</p>}
    <p className="mt-3 flex items-center gap-2 text-xs" role="status"><WifiOff size={16} className="shrink-0" />{state.offline === 'ready' ? 'Academy lessons ready offline on this device.' : state.offline === 'preparing' ? 'Preparing Academy lessons for offline use...' : 'Offline lessons are not ready.'}</p>
    {state.offline === 'unavailable' && <button type="button" onClick={() => void prepareOfflineAcademy()} className="mt-2 flex items-center gap-1 text-xs underline"><RefreshCw size={14} /> Retry offline preparation</button>}
    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Live quotes, sign-in and shared rankings need a connection.</p>
    {state.message && <p role="status" className="mt-2 text-xs">{state.message}</p>}
  </section>;
}

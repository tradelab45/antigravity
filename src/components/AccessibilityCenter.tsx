import React, { useState } from 'react';
import { Accessibility, CheckCircle2, Languages, RotateCcw, Type, X } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

const Toggle = ({ checked, onChange, label, description }: { checked: boolean; onChange: (value: boolean) => void; label: string; description: string }) => (
  <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
    <span><span className="block text-sm font-extrabold">{label}</span><span className="block text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{description}</span></span>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-indigo-600" />
  </label>
);

export function AccessibilityCenter() {
  const [open, setOpen] = useState(false);
  const { settings, updateSetting, resetSettings } = useAccessibility();

  React.useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-accessibility-settings', handleOpen);
    return () => window.removeEventListener('open-accessibility-settings', handleOpen);
  }, []);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="accessibility-title">
          <button type="button" aria-label="Close accessibility settings" onClick={() => setOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <section className="relative max-h-[88vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl dark:bg-slate-900 sm:max-w-lg sm:rounded-[28px]">
            <div className="flex items-start justify-between gap-3">
              <div><h2 id="accessibility-title" className="text-xl font-black">Make RupeeRookie yours</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">These settings stay on this device.</p></div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 p-2 dark:border-slate-700" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide"><Type className="h-4 w-4" /> Text size</label>
                <div className="grid grid-cols-4 gap-2">{(['SMALL','DEFAULT','LARGE','XL'] as const).map((size) => <button key={size} type="button" onClick={() => updateSetting('textScale', size)} className={`min-h-11 rounded-xl border text-[11px] font-black ${settings.textScale === size ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'}`}>{size === 'DEFAULT' ? 'Normal' : size}</button>)}</div>
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide"><Languages className="h-4 w-4" /> Learning summaries</label>
                <div className="grid grid-cols-2 gap-2"><button type="button" aria-pressed={settings.learningLanguage === 'ENGLISH'} onClick={() => updateSetting('learningLanguage','ENGLISH')} className={`min-h-11 rounded-xl border text-xs font-black ${settings.learningLanguage === 'ENGLISH' ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700'}`}>{settings.learningLanguage === 'ENGLISH' && <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />}English</button><button type="button" aria-pressed={settings.learningLanguage === 'HINDI'} onClick={() => updateSetting('learningLanguage','HINDI')} className={`min-h-11 rounded-xl border text-xs font-black ${settings.learningLanguage === 'HINDI' ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700'}`}>{settings.learningLanguage === 'HINDI' && <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />}हिन्दी</button></div>
                <div className="mt-2 rounded-xl bg-indigo-50 p-3 text-[11px] font-bold leading-relaxed text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200" role="status" aria-live="polite">
                  {settings.learningLanguage === 'HINDI' ? 'हिन्दी चालू है — होम मिशन, अकादमी सारांश, ऐतिहासिक अध्ययन और शब्दावली अब हिन्दी में दिखाई देंगे। संख्याएँ, प्रतिशत, सूत्र और स्टॉक संकेत अंग्रेज़ी अंकों में रहेंगे।' : 'English ON — learning summaries and explanations are shown in English.'}
                </div>
              </div>
              <Toggle checked={settings.highContrast} onChange={(value) => updateSetting('highContrast', value)} label="High contrast" description="Sharper text, borders and status colours." />
              <Toggle checked={settings.reducedMotion} onChange={(value) => updateSetting('reducedMotion', value)} label="Reduced motion" description="Stops ticker movement and softens page transitions." />
              <Toggle checked={settings.dyslexiaFriendly} onChange={(value) => updateSetting('dyslexiaFriendly', value)} label="Dyslexia-friendly reading" description="Wider spacing and simpler type in Academy lessons." />
              <Toggle checked={settings.largeTouchTargets} onChange={(value) => updateSetting('largeTouchTargets', value)} label="Larger touch controls" description="Makes one-handed mobile actions easier to tap." />
              <button type="button" onClick={resetSettings} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-black dark:border-slate-700"><RotateCcw className="h-4 w-4" /> Reset accessibility settings</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

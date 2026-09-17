import React, { useEffect, useState } from 'react';
import { useSimulator } from '../context/SimulatorContext';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { AppNotification } from '../types';

export const ToastNotifier: React.FC = () => {
  const { notifications, markNotificationRead } = useSimulator();
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  useEffect(() => {
    // Find the newest unread notification
    const unread = notifications.filter(n => !n.read);
    if (unread.length > 0) {
      const newest = unread[0]; // notifications are unshifted (newest first)
      if (!activeToast || activeToast.id !== newest.id) {
        setActiveToast(newest);
      }
    } else {
      setActiveToast(null);
    }
  }, [notifications, activeToast]);

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        markNotificationRead(activeToast.id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeToast, markNotificationRead]);

  if (!activeToast) return null;

  const getIcon = (type: string) => {
    switch(type) {
      case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-emerald-600 " />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-indigo-600" />;
      case 'ALERT': return <AlertCircle className="w-5 h-5 text-rose-600 " />;
      default: return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="p-4 flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {getIcon(activeToast.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900">{activeToast.title}</h4>
          <p className="text-xs text-slate-500 mt-1 leading-snug">{activeToast.message}</p>
        </div>
        <button 
          onClick={() => markNotificationRead(activeToast.id)}
          className="shrink-0 text-slate-500 hover:text-slate-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="h-1 w-full bg-[#E2E8F0]">
        <div 
          className="h-full bg-slate-900 animate-[shrink_5s_linear_forwards]" 
          style={{ transformOrigin: 'left' }}
        />
      </div>
    </div>
  );
};

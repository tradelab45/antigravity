import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCircle, Info, AlertTriangle, AlertCircle, CheckCheck, Sparkles, Filter } from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';

export const NotificationCenter: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useSimulator();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ALERT' | 'SUCCESS' | 'WARNING'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch(type) {
      case 'SUCCESS': 
        return (
          <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
        );
      case 'WARNING': 
        return (
          <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
        );
      case 'ALERT': 
        return (
          <div className="w-7 h-7 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          </div>
        );
      default: 
        return (
          <div className="w-7 h-7 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
        );
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'ALL') return true;
    return n.type === activeFilter;
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Animated Bell Toggle Button */}
      <motion.button 
        id="notification-center-btn"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={`relative p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer shadow-xs flex items-center justify-center ${
          isOpen
            ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-400 shadow-md'
            : 'bg-slate-50 hover:bg-white text-slate-800 hover:text-slate-950 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 dark:border-slate-700'
        }`}
        title={`Alerts & Notifications (${unreadCount} unread)`}
        aria-label="Toggle notifications"
      >
        <motion.div
          animate={
            unreadCount > 0 && !isOpen
              ? { rotate: [0, -14, 14, -10, 10, -4, 4, 0] }
              : { rotate: 0 }
          }
          transition={{
            duration: 0.8,
            repeat: unreadCount > 0 ? Infinity : 0,
            repeatDelay: 4,
          }}
        >
          <Bell className={`w-4 h-4 ${isOpen ? 'text-white dark:text-slate-950' : 'text-slate-800 dark:text-slate-200'}`} />
        </motion.div>

        {/* Animated Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
            <span className="relative z-10">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </span>
        )}
      </motion.button>

      {/* Spring Animated Notification Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-white dark:bg-emerald-400 dark:text-slate-950 flex items-center justify-center font-bold">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-black">
                          {unreadCount} new
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Dalal Street live market alerts & execution notices</p>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <motion.button 
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Read all</span>
                  </motion.button>
                )}
              </div>

              {/* Animated Filter Tabs */}
              <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
                {[
                  { id: 'ALL' as const, label: 'All' },
                  { id: 'ALERT' as const, label: 'Alerts' },
                  { id: 'SUCCESS' as const, label: 'Trades' },
                  { id: 'WARNING' as const, label: 'Signals' },
                ].map((tab) => {
                  const isActive = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilter(tab.id)}
                      className={`relative px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        isActive
                          ? 'text-slate-900 dark:text-white font-extrabold'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="notifFilterPill"
                          className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-slate-200 dark:border-slate-700"
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1.5 min-h-[160px] max-h-[380px]">
              {filteredNotifications.length === 0 ? (
                <div className="py-10 px-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-bold">No notifications here</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Trigger price alerts in the market screener to get instant live updates!
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif, index) => (
                  <motion.div 
                    key={notif.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => markNotificationRead(notif.id)}
                    className={`p-3 rounded-2xl flex items-start gap-3 cursor-pointer transition-all border ${
                      notif.read 
                        ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 border-transparent text-slate-600' 
                        : 'bg-indigo-50/40 hover:bg-indigo-50/70 dark:bg-indigo-950/25 dark:hover:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40 shadow-xs'
                    }`}
                  >
                    {getIcon(notif.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className={`text-xs truncate font-extrabold ${notif.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-950 dark:text-white'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-[9px] text-slate-400 shrink-0 font-mono font-medium whitespace-nowrap">
                          {new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <p className={`text-[11px] leading-relaxed ${notif.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>
                        {notif.message}
                      </p>
                    </div>
                    {!notif.read && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="shrink-0 w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1.5 shadow-xs" 
                      />
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Real-time NSE simulation feed
              </span>
              <span>Updated live</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

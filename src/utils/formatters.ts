// Indian Currency (Lakhs & Crores) and Number Formatters

export function formatINR(val: number, includeDecimals = true): string {
  if (val === undefined || val === null || !Number.isFinite(val)) return includeDecimals ? '₹0.00' : '₹0';
  
  const sign = val < 0 ? '-' : '';
  const absVal = Math.abs(val);

  // Format with standard Indian Numbering system (10,00,000.00)
  const parts = absVal.toFixed(includeDecimals ? 2 : 0).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] ? `.${parts[1]}` : '';

  if (integerPart.length > 3) {
    const last3 = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    integerPart = `${formattedOthers},${last3}`;
  }

  return `${sign}₹${integerPart}${decimalPart}`;
}

export function formatIndianShort(val: number): string {
  if (!Number.isFinite(val) || val === 0) return '₹0';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';

  if (abs >= 10000000) {
    // 1 Crore = 1,00,00,000
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    // 1 Lakh = 1,00,000
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}k`;
  }
  return `${sign}₹${abs.toFixed(2)}`;
}

export function formatPercent(val: number, includeSign = true): string {
  if (val === undefined || val === null || !Number.isFinite(val)) return '0.00%';
  const prefix = includeSign && val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(2)}%`;
}

export function formatNumberIndian(val: number): string {
  if (!Number.isFinite(val) || val === 0) return '0';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 4 }).format(val);
}

export function getDynamicMarketSessionBadge(): { label: string; dot: string; style: string; fullTitle: string } {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));
  const day = istDate.getDay();
  const mins = istDate.getHours() * 60 + istDate.getMinutes();

  if (day === 0 || day === 6) {
    return {
      dot: '🌙',
      label: 'Closed · Prices As Of Last Trade (Night & Weekends)',
      style: 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
      fullTitle: '🌙 Closed · Prices As Of Last Trade (Night & Weekends)'
    };
  }

  // 09:15 to 15:30 IST (555 to 930 mins)
  if (mins >= 555 && mins <= 930) {
    return {
      dot: '🟢',
      label: 'NSE Normal Session (09:15 – 15:30 IST)',
      style: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-600',
      fullTitle: '🟢 NSE Normal Session (09:15 – 15:30 IST)'
    };
  }

  // 15:40 to 16:00 IST (940 to 960 mins)
  if (mins >= 940 && mins <= 960) {
    return {
      dot: '🟡',
      label: 'Post-Market Closing Session (15:40 – 16:00 IST)',
      style: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-600',
      fullTitle: '🟡 Post-Market Closing Session (15:40 – 16:00 IST)'
    };
  }

  return {
    dot: '🌙',
    label: 'Closed · Prices As Of Last Trade (Night & Weekends)',
    style: 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    fullTitle: '🌙 Closed · Prices As Of Last Trade (Night & Weekends)'
  };
}

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

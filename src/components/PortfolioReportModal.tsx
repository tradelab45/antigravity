import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  PieChart as PieIcon, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Layers, 
  Calendar, 
  DollarSign, 
  Award,
  Sparkles,
  Percent,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { formatINR, formatPercent, formatIndianShort, formatNumberIndian } from '../utils/formatters';
import { Holding, Order, StockDetail } from '../types';
import { useModalDialog } from '../hooks/useModalDialog';

interface PortfolioReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioValue: number;
  investedValue: number;
  cashBalance: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayPnL: number;
  holdings: Record<string, Holding>;
  orders: Order[];
  stocks: StockDetail[];
  userName?: string;
  userEmail?: string;
}

export const PortfolioReportModal: React.FC<PortfolioReportModalProps> = ({
  isOpen,
  onClose,
  portfolioValue,
  investedValue,
  cashBalance,
  totalPnL,
  totalPnLPercent,
  dayPnL,
  holdings,
  orders,
  stocks,
  userName = 'Investor',
  userEmail = 'trader@rupeerookie.in'
}) => {
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<'OVERVIEW' | 'HOLDINGS_TABLE' | 'TAX_SUMMARY'>('OVERVIEW');

  // Compute enriched holdings array
  const holdingsList = useMemo(() => {
    return (Object.values(holdings) as Holding[]).map((h) => {
      const stockInfo = stocks.find((s) => s.symbol === h.symbol);
      const ltp = stockInfo ? stockInfo.price : h.avgBuyPrice;
      const currentValue = h.quantity * ltp;
      const costBasis = h.quantity * h.avgBuyPrice;
      const unrealizedPnL = currentValue - costBasis;
      const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;
      const weight = portfolioValue > 0 ? (currentValue / portfolioValue) * 100 : 0;

      return {
        ...h,
        companyName: stockInfo?.name || h.symbol,
        sector: stockInfo?.sector || 'Diversified',
        ltp,
        currentValue,
        costBasis,
        unrealizedPnL,
        unrealizedPnLPercent,
        weight
      };
    }).sort((a, b) => b.currentValue - a.currentValue);
  }, [holdings, stocks, portfolioValue]);

  // Sector allocation summary
  const sectorAllocation = useMemo(() => {
    const map: Record<string, number> = {};
    holdingsList.forEach((h) => {
      map[h.sector] = (map[h.sector] || 0) + h.currentValue;
    });
    return Object.entries(map).map(([sector, val]) => ({
      sector,
      value: val,
      percent: portfolioValue > 0 ? (val / portfolioValue) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }, [holdingsList, portfolioValue]);

  // Tax estimate (STCG @ 20% on positive realized/unrealized gains)
  const taxableGains = Math.max(0, totalPnL);
  const estimatedSTCG = taxableGains * 0.20;

  const reportDate = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const { ref: dialogRef, dialogProps } = useModalDialog({
    onClose,
    open: isOpen,
    label: 'Portfolio report',
  });

  if (!isOpen) return null;

  // Generate plain text / Markdown summary for clipboard
  const generateMarkdownSummary = () => {
    const lines = [
      `# 🇮🇳 RupeeRookie Portfolio Summary Report`,
      `**Generated On:** ${reportDate}`,
      `**Account Holder:** ${userName} (${userEmail})`,
      `--------------------------------------------------`,
      `## 📊 Financial Snapshot`,
      `- **Total Portfolio Valuation:** ${formatINR(portfolioValue)}`,
      `- **Available Virtual Cash:** ${formatINR(cashBalance)} (${((cashBalance / (portfolioValue || 1)) * 100).toFixed(1)}%)`,
      `- **Invested in Equities:** ${formatINR(investedValue)} (${((investedValue / (portfolioValue || 1)) * 100).toFixed(1)}%)`,
      `- **Initial Capital:** ₹10,00,000.00`,
      `- **Total Net P&L:** ${totalPnL >= 0 ? '+' : ''}${formatINR(totalPnL)} (${formatPercent(totalPnLPercent)})`,
      `- **Today's Estimated P&L:** ${dayPnL >= 0 ? '+' : ''}${formatINR(dayPnL)}`,
      `- **Active Stock Positions:** ${holdingsList.length}`,
      `- **Total Trade Orders Executed:** ${orders.length}`,
      ``,
      `## 📈 Current Holdings Breakdown`,
      `| Symbol | Company | Qty | Avg Price | LTP | Current Value | Unrealized P&L | Weight |`,
      `|---|---|---|---|---|---|---|---|`,
      ...holdingsList.map(h => 
        `| ${h.symbol} | ${h.companyName} | ${h.quantity} | ${formatINR(h.avgBuyPrice)} | ${formatINR(h.ltp)} | ${formatINR(h.currentValue)} | ${h.unrealizedPnL >= 0 ? '+' : ''}${formatINR(h.unrealizedPnL)} (${formatPercent(h.unrealizedPnLPercent)}) | ${h.weight.toFixed(1)}% |`
      ),
      ``,
      `## 🛡️ Sector Concentration`,
      ...sectorAllocation.map(s => `- **${s.sector}:** ${formatINR(s.value)} (${s.percent.toFixed(1)}%)`),
      ``,
      `*Generated via RupeeRookie Indian Stock Market Simulator OS*`
    ];

    return lines.join('\n');
  };

  const handleCopyClipboard = () => {
    const text = generateMarkdownSummary();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCSV = () => {
    const headers = ['Symbol', 'Company Name', 'Sector', 'Quantity', 'Avg Buy Price (INR)', 'Current LTP (INR)', 'Invested Value (INR)', 'Current Value (INR)', 'Unrealized PnL (INR)', 'PnL Percent (%)', 'Portfolio Weight (%)'];
    const rows = holdingsList.map(h => [
      `"${h.symbol}"`,
      `"${h.companyName.replace(/"/g, '""')}"`,
      `"${h.sector}"`,
      h.quantity,
      h.avgBuyPrice.toFixed(2),
      h.ltp.toFixed(2),
      h.costBasis.toFixed(2),
      h.currentValue.toFixed(2),
      h.unrealizedPnL.toFixed(2),
      h.unrealizedPnLPercent.toFixed(2),
      h.weight.toFixed(2)
    ]);

    const summaryMeta = [
      `"Report Title","RupeeRookie Portfolio Holdings Summary"`,
      `"Generated At","${reportDate}"`,
      `"Investor","${userName}"`,
      `"Portfolio Net Worth (INR)",${portfolioValue.toFixed(2)}`,
      `"Cash Balance (INR)",${cashBalance.toFixed(2)}`,
      `"Invested Value (INR)",${investedValue.toFixed(2)}`,
      `"Total PnL (INR)",${totalPnL.toFixed(2)}`,
      `"Total PnL Percent (%)",${totalPnLPercent.toFixed(2)}`,
      ``
    ];

    const csvContent = "data:text/csv;charset=utf-8," + [
      ...summaryMeta,
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RupeeRookie_Portfolio_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    const data = {
      reportType: "RupeeRookie Portfolio Summary",
      timestamp: new Date().toISOString(),
      formattedDate: reportDate,
      investor: {
        name: userName,
        email: userEmail
      },
      summary: {
        portfolioValue,
        cashBalance,
        investedValue,
        initialCapital: 1000000,
        totalPnL,
        totalPnLPercent,
        dayPnL,
        positionsCount: holdingsList.length,
        totalOrdersCount: orders.length,
        estimatedSTCGTaxLiability: estimatedSTCG
      },
      sectorAllocation,
      holdings: holdingsList,
      recentOrders: orders.slice(0, 15)
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RupeeRookie_Portfolio_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const isProfit = totalPnL >= 0;

  return (
    <div ref={dialogRef} {...dialogProps} className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Portfolio Performance & Holdings Report
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Official Snapshot
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>As of {reportDate}</span>
                <span>•</span>
                <span>{userName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Format Tabs */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setExportFormat('OVERVIEW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                exportFormat === 'OVERVIEW'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Executive Summary
            </button>
            <button
              onClick={() => setExportFormat('HOLDINGS_TABLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                exportFormat === 'HOLDINGS_TABLE'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Holdings Ledger ({holdingsList.length})
            </button>
            <button
              onClick={() => setExportFormat('TAX_SUMMARY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                exportFormat === 'TAX_SUMMARY'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Tax & Risk Guardrails
            </button>
          </div>

          {/* Quick Export Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied Summary!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Download CSV</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-700" />
              <span>JSON Data</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 text-slate-800">

          {/* VIEW 1: EXECUTIVE SUMMARY */}
          {exportFormat === 'OVERVIEW' && (
            <div className="space-y-6">
              
              {/* Primary Key Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Portfolio Net Worth
                  </span>
                  <div className="font-mono text-lg sm:text-xl font-black text-slate-900 mt-1">
                    {formatINR(portfolioValue)}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Shares + Cash Balance
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border ${isProfit ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'}`}>
                  <span className={`text-[11px] font-bold uppercase tracking-wider block ${isProfit ? 'text-emerald-800' : 'text-rose-800'}`}>
                    Total Net Returns
                  </span>
                  <div className={`font-mono text-lg sm:text-xl font-black mt-1 ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {totalPnL >= 0 ? '+' : ''}{formatINR(totalPnL)}
                  </div>
                  <span className={`text-[10px] font-black mt-0.5 block ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatPercent(totalPnLPercent)} vs ₹10L base
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Invested in Stocks
                  </span>
                  <div className="font-mono text-lg sm:text-xl font-black text-indigo-700 mt-1">
                    {formatINR(investedValue)}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {((investedValue / (portfolioValue || 1)) * 100).toFixed(1)}% of Net Worth
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Available Liquid Cash
                  </span>
                  <div className="font-mono text-lg sm:text-xl font-black text-emerald-800 mt-1">
                    {formatINR(cashBalance)}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {((cashBalance / (portfolioValue || 1)) * 100).toFixed(1)}% Ready to Deploy
                  </span>
                </div>
              </div>

              {/* Capital Allocation & Sector Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Allocation Visual */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <PieIcon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Asset Class Distribution</span>
                  </h4>

                  <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-indigo-600 h-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, (investedValue / (portfolioValue || 1)) * 100))}%` }}
                      title={`Equities: ${formatINR(investedValue)}`}
                    />
                    <div 
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, (cashBalance / (portfolioValue || 1)) * 100))}%` }}
                      title={`Cash: ${formatINR(cashBalance)}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-md bg-indigo-600 shrink-0" />
                      <div>
                        <span className="text-slate-500 block text-[11px]">Equities</span>
                        <span className="font-bold font-mono text-slate-900">{formatINR(investedValue)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
                      <div>
                        <span className="text-slate-500 block text-[11px]">Liquid Cash</span>
                        <span className="font-bold font-mono text-slate-900">{formatINR(cashBalance)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sector Concentration */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Top Sector Exposures</span>
                  </h4>

                  {sectorAllocation.length === 0 ? (
                    <div className="text-xs text-slate-400 py-3 text-center italic">
                      No active equity positions held yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {sectorAllocation.slice(0, 4).map((s) => (
                        <div key={s.sector} className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700 truncate max-w-[180px]">{s.sector}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-slate-900 font-bold">{formatINR(s.value)}</span>
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                              {s.percent.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Holdings Quick Mini-Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Current Portfolio Holdings ({holdingsList.length})
                  </h4>
                  <button
                    onClick={() => setExportFormat('HOLDINGS_TABLE')}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                  >
                    View Full Ledger Table →
                  </button>
                </div>

                {holdingsList.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
                    No active positions held in portfolio. All capital is currently preserved in virtual liquid cash.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/90 text-slate-600 font-extrabold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="p-3">Stock</th>
                          <th className="p-3 text-right">Qty</th>
                          <th className="p-3 text-right">Avg Price</th>
                          <th className="p-3 text-right">LTP</th>
                          <th className="p-3 text-right">Current Value</th>
                          <th className="p-3 text-right">P&L (Unrealized)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {holdingsList.slice(0, 6).map((h) => {
                          const isWin = h.unrealizedPnL >= 0;
                          return (
                            <tr key={h.symbol} className="hover:bg-slate-50/70 transition-colors font-medium">
                              <td className="p-3">
                                <div className="font-bold text-slate-900">{h.symbol}</div>
                                <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{h.companyName}</div>
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-slate-800">{h.quantity}</td>
                              <td className="p-3 text-right font-mono text-slate-600">{formatINR(h.avgBuyPrice)}</td>
                              <td className="p-3 text-right font-mono font-bold text-slate-900">{formatINR(h.ltp)}</td>
                              <td className="p-3 text-right font-mono font-bold text-slate-900">{formatINR(h.currentValue)}</td>
                              <td className="p-3 text-right font-mono">
                                <span className={`font-black ${isWin ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {isWin ? '+' : ''}{formatINR(h.unrealizedPnL)}
                                </span>
                                <div className={`text-[10px] font-bold ${isWin ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {formatPercent(h.unrealizedPnLPercent)}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* VIEW 2: FULL HOLDINGS TABLE */}
          {exportFormat === 'HOLDINGS_TABLE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Comprehensive Portfolio Holdings Ledger
                  </h4>
                  <p className="text-xs text-slate-500">
                    Detailed position sizing, average acquisition cost, market valuation, and P&L weighting.
                  </p>
                </div>
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Full CSV</span>
                </button>
              </div>

              {holdingsList.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                  You do not have any open stock holdings. Trade companies from the Market Screener to build your report.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead className="bg-slate-900 text-slate-200 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Company & Symbol</th>
                        <th className="p-3">Sector</th>
                        <th className="p-3 text-right">Shares</th>
                        <th className="p-3 text-right">Avg Cost</th>
                        <th className="p-3 text-right">LTP</th>
                        <th className="p-3 text-right">Cost Basis</th>
                        <th className="p-3 text-right">Current Value</th>
                        <th className="p-3 text-right">Unrealized P&L</th>
                        <th className="p-3 text-right">Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {holdingsList.map((h) => {
                        const isWin = h.unrealizedPnL >= 0;
                        return (
                          <tr key={h.symbol} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3">
                              <div className="font-black text-slate-900">{h.symbol}</div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{h.companyName}</div>
                            </td>
                            <td className="p-3 text-slate-600 text-[11px] font-medium">{h.sector}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-800">{h.quantity}</td>
                            <td className="p-3 text-right font-mono text-slate-600">{formatINR(h.avgBuyPrice)}</td>
                            <td className="p-3 text-right font-mono font-black text-slate-900">{formatINR(h.ltp)}</td>
                            <td className="p-3 text-right font-mono text-slate-600">{formatINR(h.costBasis)}</td>
                            <td className="p-3 text-right font-mono font-black text-slate-900">{formatINR(h.currentValue)}</td>
                            <td className="p-3 text-right font-mono">
                              <span className={`font-black ${isWin ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {isWin ? '+' : ''}{formatINR(h.unrealizedPnL)}
                              </span>
                              <div className={`text-[10px] font-bold ${isWin ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {formatPercent(h.unrealizedPnLPercent)}
                              </div>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-700">
                              {h.weight.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 font-black text-slate-900 border-t border-slate-200">
                      <tr>
                        <td colSpan={2} className="p-3 uppercase text-[10px]">Total Invested Holdings</td>
                        <td className="p-3 text-right font-mono">{holdingsList.reduce((acc, h) => acc + h.quantity, 0)}</td>
                        <td colSpan={2} className="p-3 text-right"></td>
                        <td className="p-3 text-right font-mono">{formatINR(investedValue)}</td>
                        <td className="p-3 text-right font-mono">{formatINR(holdingsList.reduce((acc, h) => acc + h.currentValue, 0))}</td>
                        <td className={`p-3 text-right font-mono ${totalPnL >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {totalPnL >= 0 ? '+' : ''}{formatINR(totalPnL)}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {((investedValue / (portfolioValue || 1)) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: TAX & RISK SUMMARY */}
          {exportFormat === 'TAX_SUMMARY' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Tax Ledger Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Indian Equity Taxation Overview</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Under Indian Income Tax rules (Budget 2024 revisions):
                  </p>

                  <div className="space-y-2 text-xs pt-1">
                    <div className="flex justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-900 block">Short-Term Capital Gains (STCG)</span>
                        <span className="text-[10px] text-slate-500">Held for &lt; 12 months (20% flat tax)</span>
                      </div>
                      <span className="font-mono font-bold text-indigo-700 self-center">20.00%</span>
                    </div>

                    <div className="flex justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-900 block">Long-Term Capital Gains (LTCG)</span>
                        <span className="text-[10px] text-slate-500">Held for &gt; 12 months (exceeding ₹1.25L exemption)</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 self-center">12.50%</span>
                    </div>

                    <div className="flex justify-between p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl font-bold">
                      <span className="text-indigo-950">Estimated STCG Provision:</span>
                      <span className="font-mono text-indigo-900">{formatINR(estimatedSTCG)}</span>
                    </div>
                  </div>
                </div>

                {/* Risk & Guardrails Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Portfolio Risk & Guardrails</span>
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200">
                      <span className="text-slate-600">Total Positions:</span>
                      <span className="font-bold text-slate-900 font-mono">{holdingsList.length} Stocks</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-200">
                      <span className="text-slate-600">Max Single Stock Weight:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {holdingsList.length > 0 ? `${holdingsList[0].weight.toFixed(1)}% (${holdingsList[0].symbol})` : '0%'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-200">
                      <span className="text-slate-600">Cash Cushion:</span>
                      <span className="font-bold text-emerald-700 font-mono">
                        {((cashBalance / (portfolioValue || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-200">
                      <span className="text-slate-600">Order Execution Health:</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>All Simulated via NSE Rules</span>
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer Note */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Virtual Paper Trading Simulator • Verified by RupeeRookie Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
};

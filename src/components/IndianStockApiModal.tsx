import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ExternalLink, 
  Code2, 
  Copy, 
  Check, 
  Sparkles, 
  Play, 
  Search, 
  Layers, 
  Database, 
  BookOpen, 
  X, 
  Terminal,
  Activity,
  GitBranch,
  Github,
  Zap,
  PlusCircle,
  BarChart2
} from 'lucide-react';
import { StockDetail } from '../types';
import { useModalDialog } from '../hooks/useModalDialog';

interface IndianStockApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackStock?: (stock: StockDetail) => void;
}

export const GITHUB_REPO_URL = "https://github.com/0xramm/Indian-Stock-Market-API.git";

export const IndianStockApiModal: React.FC<IndianStockApiModalProps> = ({ 
  isOpen, 
  onClose,
  onTrackStock 
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'single' | 'batch' | 'search' | 'indices' | 'info'>('single');
  const [symbolInput, setSymbolInput] = useState('RELIANCE');
  const [batchInput, setBatchInput] = useState('RELIANCE, TCS, INFY, TATAMOTORS');
  const [searchQuery, setSearchQuery] = useState('Tata');
  const [resFormat, setResFormat] = useState<'num' | 'val'>('num');
  
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tester' | 'docs' | 'curl'>('tester');

  // Compute endpoint URL based on selected configuration
  const currentEndpointUrl = React.useMemo(() => {
    switch (selectedEndpoint) {
      case 'single':
        return `/api/indian-stock-api/stock/${symbolInput.trim().toUpperCase() || 'RELIANCE'}?res=${resFormat}`;
      case 'batch': {
        const cleanList = batchInput.split(',').map(s => s.trim()).filter(Boolean).join(',');
        return `/api/indian-stock-api/list?symbols=${cleanList}&res=${resFormat}`;
      }
      case 'search':
        return `/api/indian-stock-api/search?q=${encodeURIComponent(searchQuery.trim() || 'Tata')}`;
      case 'indices':
        return `/api/indian-stock-api/indices`;
      case 'info':
        return `/api/indian-stock-api/info`;
    }
  }, [selectedEndpoint, symbolInput, batchInput, searchQuery, resFormat]);

  const executeApiCall = async () => {
    setLoading(true);
    try {
      const res = await fetch(currentEndpointUrl);
      const data = await res.json();
      setApiResponse(data);
    } catch (err: any) {
      setApiResponse({
        status: "ERROR",
        message: err.message || "Failed to execute request",
        githubRepo: GITHUB_REPO_URL
      });
    } finally {
      setLoading(false);
    }
  };

  // Run on mount or endpoint switch
  useEffect(() => {
    if (isOpen) {
      executeApiCall();
    }
  }, [isOpen, selectedEndpoint, resFormat]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const { ref: dialogRef, dialogProps } = useModalDialog({
    onClose,
    open: isOpen,
    label: 'Indian stock market data source',
  });

  if (!isOpen) return null;

  return (
    <div ref={dialogRef} {...dialogProps} className="fixed inset-0 z-50 bg-white/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-slate-900"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              <Terminal className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  Indian Stock Market API
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  LIVE INTEGRATION
                </span>
                <span className="bg-slate-200/50 text-slate-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                  by @0xramm
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                <span>Free & Open Source REST API for NSE & BSE Real-Time Data</span>
                <span>•</span>
                <a 
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-slate-900 hover:underline flex items-center gap-1 inline-flex"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Github className="w-4 h-4" />
              <span>Star on GitHub</span>
              <ExternalLink className="w-3 h-3 text-zinc-300" />
            </a>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-200 text-slate-900 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-2.5 border-b border-slate-200 bg-white overflow-x-auto gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('tester')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'tester'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Interactive API Playground</span>
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'docs'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Endpoint Docs & Specs</span>
            </button>
            <button
              onClick={() => setActiveTab('curl')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'curl'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code Snippets (JS/Python/cURL)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-500">Response Mode:</span>
            <div className="bg-slate-50 p-0.5 rounded-lg border border-slate-200 flex items-center text-xs">
              <button
                onClick={() => setResFormat('num')}
                className={`px-2 py-1 rounded-md font-mono text-[11px] font-bold transition-all ${
                  resFormat === 'num'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                res=num (Raw)
              </button>
              <button
                onClick={() => setResFormat('val')}
                className={`px-2 py-1 rounded-md font-mono text-[11px] font-bold transition-all ${
                  resFormat === 'val'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                res=val (Units ₹/Cr)
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'tester' && (
            <div className="space-y-4">
              {/* Endpoint Selector Pills */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-bold text-slate-500">Select Endpoint:</span>
                <button
                  onClick={() => setSelectedEndpoint('single')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedEndpoint === 'single'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-900'
                  }`}
                >
                  GET /stock/:symbol
                </button>
                <button
                  onClick={() => setSelectedEndpoint('batch')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedEndpoint === 'batch'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-900'
                  }`}
                >
                  GET /list (Batch)
                </button>
                <button
                  onClick={() => setSelectedEndpoint('search')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedEndpoint === 'search'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-900'
                  }`}
                >
                  GET /search (Smart Query)
                </button>
                <button
                  onClick={() => setSelectedEndpoint('indices')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedEndpoint === 'indices'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-900'
                  }`}
                >
                  GET /indices
                </button>
                <button
                  onClick={() => setSelectedEndpoint('info')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedEndpoint === 'info'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-slate-900'
                  }`}
                >
                  GET /info (Meta)
                </button>
              </div>

              {/* Endpoint Parameter Inputs */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                {selectedEndpoint === 'single' && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Stock Symbol (NSE / BSE)
                      </label>
                      <input
                        type="text"
                        value={symbolInput}
                        onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                        placeholder="e.g. RELIANCE, TCS, INFY, TATAMOTORS"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-slate-900"
                      />
                    </div>
                    <div className="self-end">
                      <button
                        onClick={executeApiCall}
                        disabled={loading}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{loading ? 'Fetching...' : 'Send Request'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {selectedEndpoint === 'batch' && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Comma-Separated Stock Symbols
                      </label>
                      <input
                        type="text"
                        value={batchInput}
                        onChange={(e) => setBatchInput(e.target.value)}
                        placeholder="e.g. RELIANCE, TCS, INFY, ZOMATO"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-slate-900"
                      />
                    </div>
                    <div className="self-end">
                      <button
                        onClick={executeApiCall}
                        disabled={loading}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{loading ? 'Fetching Batch...' : 'Send Request'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {selectedEndpoint === 'search' && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Search Query (Company Name or Symbol)
                      </label>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="e.g. State Bank, Reliance, HDFC, Mahindra"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-slate-900"
                      />
                    </div>
                    <div className="self-end">
                      <button
                        onClick={executeApiCall}
                        disabled={loading}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{loading ? 'Searching...' : 'Search Market'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Live URL Display & Copy */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-2 overflow-x-auto text-xs font-mono text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex-1">
                    <span className="text-emerald-600 font-bold">GET</span>
                    <span className="truncate">{currentEndpointUrl}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(window.location.origin + currentEndpointUrl, 'url')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-200 text-[11px] font-bold text-slate-900 shrink-0"
                  >
                    {copiedCode === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'url' ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
              </div>

              {/* Response Viewer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Real-Time JSON Response Payload</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(JSON.stringify(apiResponse, null, 2), 'json')}
                      className="text-[11px] font-bold text-slate-900 hover:underline flex items-center gap-1"
                    >
                      {copiedCode === 'json' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode === 'json' ? 'Copied JSON' : 'Copy JSON'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 text-zinc-100 rounded-2xl p-4 font-mono text-xs overflow-x-auto max-h-72 border border-slate-800 shadow-inner">
                  {loading ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-zinc-400">
                      <span className="animate-spin w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full" />
                      <span>Querying Indian Stock Market API...</span>
                    </div>
                  ) : apiResponse ? (
                    <pre className="text-[11px] leading-relaxed text-emerald-400">
                      {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-zinc-500 py-6 text-center">
                      No response yet. Click "Send Request" to fetch live data.
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Simulator Importer banner */}
              {selectedEndpoint === 'single' && apiResponse && apiResponse.status === 'SUCCESS' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      ₹
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-950">
                        {apiResponse.companyName} ({apiResponse.symbol})
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        Price: ₹{apiResponse.currentPrice} • Change: {apiResponse.changePercent}% • Exchange: {apiResponse.exchange}
                      </p>
                    </div>
                  </div>
                  {onTrackStock && (
                    <button
                      onClick={() => {
                        onTrackStock({
                          symbol: apiResponse.symbol,
                          name: apiResponse.companyName,
                          sector: "Indian Equity",
                          price: typeof apiResponse.currentPrice === 'number' ? apiResponse.currentPrice : parseFloat(String(apiResponse.currentPrice).replace(/[^0-9.-]+/g,"")),
                          change: typeof apiResponse.change === 'number' ? apiResponse.change : 0,
                          changePercent: typeof apiResponse.changePercent === 'number' ? apiResponse.changePercent : 0,
                          dayHigh: apiResponse.dayHigh || 0,
                          dayLow: apiResponse.dayLow || 0,
                          open: apiResponse.open || 0,
                          previousClose: apiResponse.previousClose || 0,
                          high52: apiResponse.fiftyTwoWeekHigh || 0,
                          low52: apiResponse.fiftyTwoWeekLow || 0,
                          peRatio: apiResponse.peRatio || 20,
                          industryPe: 22,
                          marketCapCr: apiResponse.marketCapCr || 50000,
                          eps: apiResponse.eps || 15,
                          dividendYield: apiResponse.dividendYield || 0.5,
                          bookValue: apiResponse.bookValue || 100,
                          roe: 18,
                          volume: apiResponse.volume || 100000,
                          avgVolume: apiResponse.avgVolume || 100000,
                          beta: 1.0,
                          description: `Real-time quote via Indian Stock Market API (0xramm) for ${apiResponse.companyName}.`,
                          teenSummary: `Live Dalal Street stock verified via open Indian Stock Market API.`,
                          popularBrands: [apiResponse.symbol],
                          strengths: ["Live Exchange Data", "Real-time pricing"],
                          risks: ["Market Volatility"]
                        });
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-sm"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Inspect in Simulator</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-900">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h3 className="font-black text-sm text-slate-900 mb-1">
                  API Architecture & Overview
                </h3>
                <p className="text-slate-500">
                  The <strong>Indian-Stock-Market-API</strong> by <span className="font-bold text-slate-900">@0xramm</span> provides a lightweight, real-time data bridge for National Stock Exchange (NSE) and Bombay Stock Exchange (BSE) stocks without mandatory API keys or rate limiting.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-bold text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-200"
                  >
                    <Github className="w-4 h-4" />
                    <span>View Repository: 0xramm/Indian-Stock-Market-API</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Available Endpoints
                </h4>

                <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">GET</span>
                    <code className="font-mono text-xs font-bold text-slate-900">/api/indian-stock-api/stock/:symbol?res=num|val</code>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Retrieves full price details, 52-week metrics, PE ratio, EPS, Market Cap, and volume for a single Indian stock.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">GET</span>
                    <code className="font-mono text-xs font-bold text-slate-900">/api/indian-stock-api/list?symbols=RELIANCE,TCS,INFY&res=num|val</code>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Fetches batch stock data in a single multi-ticker JSON array for portfolio tracking or watchlists.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">GET</span>
                    <code className="font-mono text-xs font-bold text-slate-900">/api/indian-stock-api/search?q=:query</code>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Performs intelligent matching across company names, brand names, and exchange ticker symbols.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">GET</span>
                    <code className="font-mono text-xs font-bold text-slate-900">/api/indian-stock-api/indices</code>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Returns flagship market indices (NIFTY 50, BSE SENSEX, NIFTY BANK, NIFTY IT) with live values and point changes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'curl' && (
            <div className="space-y-4">
              {/* cURL Snippet */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">cURL Terminal Command</span>
                  <button
                    onClick={() => handleCopy(`curl "${window.location.origin}/api/indian-stock-api/stock/RELIANCE?res=val"`, 'curl1')}
                    className="text-[11px] font-bold text-slate-900 hover:underline flex items-center gap-1"
                  >
                    {copiedCode === 'curl1' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === 'curl1' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl font-mono text-xs overflow-x-auto">
{`curl "${window.location.origin}/api/indian-stock-api/stock/RELIANCE?res=val"`}
                </pre>
              </div>

              {/* JavaScript Fetch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">JavaScript / TypeScript (Fetch)</span>
                  <button
                    onClick={() => handleCopy(`const res = await fetch("${window.location.origin}/api/indian-stock-api/stock/TCS?res=num");
const data = await res.json();
console.log("TCS Current Price: ₹" + data.currentPrice);`, 'js1')}
                    className="text-[11px] font-bold text-slate-900 hover:underline flex items-center gap-1"
                  >
                    {copiedCode === 'js1' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === 'js1' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-amber-300 p-3.5 rounded-xl font-mono text-xs overflow-x-auto">
{`const res = await fetch("${window.location.origin}/api/indian-stock-api/stock/TCS?res=num");
const data = await res.json();
console.log("TCS Current Price: ₹" + data.currentPrice);`}
                </pre>
              </div>

              {/* Python */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Python (requests)</span>
                  <button
                    onClick={() => handleCopy(`import requests

url = "${window.location.origin}/api/indian-stock-api/list?symbols=RELIANCE,TCS,TATAMOTORS&res=val"
response = requests.get(url)
print(response.json())`, 'py1')}
                    className="text-[11px] font-bold text-slate-900 hover:underline flex items-center gap-1"
                  >
                    {copiedCode === 'py1' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode === 'py1' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-cyan-300 p-3.5 rounded-xl font-mono text-xs overflow-x-auto">
{`import requests

url = "${window.location.origin}/api/indian-stock-api/list?symbols=RELIANCE,TCS,TATAMOTORS&res=val"
response = requests.get(url)
print(response.json())`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Github className="w-4 h-4 text-slate-900" />
            <span>Open Source on GitHub:</span>
            <a 
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-slate-900 hover:underline flex items-center gap-1"
            >
              <span>github.com/0xramm/Indian-Stock-Market-API</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all"
          >
            Close Explorer
          </button>
        </div>
      </motion.div>
    </div>
  );
};

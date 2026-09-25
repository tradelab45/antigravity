import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  ShieldAlert, 
  Zap, 
  Target, 
  Layers,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';
import { Order, ProductType, Holding } from '../types';

export const OrderBookView: React.FC<{ onSelectStock?: (symbol: string) => void }> = ({ onSelectStock }) => {
  const { orders, cancelPendingOrder, holdings, nseMarketInfo, cashBalance, serverOrderCount, loadOlderOrders } = useSimulator();
  const [filterTab, setFilterTab] = useState<'ALL' | 'EXECUTED' | 'PENDING' | 'CANCELLED' | 'POSITIONS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState<'ALL' | ProductType>('ALL');
  const [loadingOlder, setLoadingOlder] = useState(false);

  // A sync carries the newest page of the history. When the server holds more
  // than this browser has, say so and offer the rest rather than letting the
  // list end where the page happens to end.
  const executedCount = orders.filter((order) => order.status === 'EXECUTED').length;
  const olderAvailable =
    typeof serverOrderCount === 'number' && serverOrderCount > executedCount
      ? serverOrderCount - executedCount
      : 0;

  const fetchOlder = async () => {
    setLoadingOlder(true);
    try {
      await loadOlderOrders();
    } finally {
      setLoadingOlder(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Tab filter
      if (filterTab === 'EXECUTED' && order.status !== 'EXECUTED') return false;
      if (filterTab === 'PENDING' && order.status !== 'PENDING') return false;
      if (filterTab === 'CANCELLED' && order.status !== 'CANCELLED') return false;

      // Product filter
      if (productFilter !== 'ALL' && order.productType !== productFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSym = order.symbol.toLowerCase().includes(q);
        const matchesName = order.stockName.toLowerCase().includes(q);
        const matchesId = order.id.toLowerCase().includes(q);
        if (!matchesSym && !matchesName && !matchesId) return false;
      }

      return true;
    });
  }, [orders, filterTab, productFilter, searchQuery]);

  // MIS Positions calculation
  const misHoldings = useMemo(() => {
    return (Object.values(holdings) as Holding[]).filter(h => h.productType === 'MIS');
  }, [holdings]);

  // Statistics
  const stats = useMemo(() => {
    const executed = orders.filter(o => o.status === 'EXECUTED');
    const pending = orders.filter(o => o.status === 'PENDING');
    const cancelled = orders.filter(o => o.status === 'CANCELLED');
    const totalTurnover = executed.reduce((sum, o) => sum + o.totalAmount, 0);
    const misOrders = orders.filter(o => o.productType === 'MIS');

    return {
      total: orders.length,
      executedCount: executed.length,
      pendingCount: pending.length,
      cancelledCount: cancelled.length,
      totalTurnover,
      misCount: misOrders.length,
      activeMisHoldings: misHoldings.length
    };
  }, [orders, misHoldings]);

  return (
    <div id="order-book-view" className="space-y-6">
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Total Orders Placed</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{stats.executedCount} filled</span>
            <span>•</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">{stats.pendingCount} pending</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Turnover Volume</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            ₹{stats.totalTurnover.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simulated gross trade value
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Intraday MIS Leverage</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>5x</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">Active</span>
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3" /> Auto square-off at 3:20 PM IST
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Active MIS Positions</span>
            <ShieldAlert className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.activeMisHoldings}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Positions to square off before market close
          </div>
        </div>
      </div>

      {/* Intraday MIS Advisory Banner */}
      {stats.activeMisHoldings > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-sm">
            <div className="font-semibold text-amber-900 dark:text-amber-200">
              Active Intraday (MIS) Positions Detected ({stats.activeMisHoldings})
            </div>
            <p className="text-amber-800/80 dark:text-amber-300/80 text-xs mt-0.5 leading-relaxed">
              Standard Indian brokerage rules require all MIS positions with 5x leverage to be closed before 3:20 PM IST. Any open positions will automatically square off at the market closing price.
            </p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
            <button
              id="order-tab-all"
              onClick={() => setFilterTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterTab === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              id="order-tab-executed"
              onClick={() => setFilterTab('EXECUTED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterTab === 'EXECUTED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Executed ({stats.executedCount})
            </button>
            <button
              id="order-tab-pending"
              onClick={() => setFilterTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterTab === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pending & GTT ({stats.pendingCount})
            </button>
            <button
              id="order-tab-cancelled"
              onClick={() => setFilterTab('CANCELLED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterTab === 'CANCELLED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cancelled ({stats.cancelledCount})
            </button>
            <button
              id="order-tab-positions"
              onClick={() => setFilterTab('POSITIONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterTab === 'POSITIONS'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Intraday Positions ({stats.activeMisHoldings})
            </button>
          </div>

          {/* Product Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Product:</span>
            <select
              id="product-type-filter"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value as any)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Products (CNC + MIS)</option>
              <option value="CNC">CNC (Cash & Carry / Delivery 1x)</option>
              <option value="MIS">MIS (Intraday 5x Leverage)</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="order-search-input"
            type="text"
            placeholder="Search by Symbol (e.g. RELIANCE), Company Name, or Order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      {/* Main Table Content */}
      {filterTab === 'POSITIONS' ? (
        // Active Intraday Positions View
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Intraday (MIS) Positions</h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">5x Margin Power</span>
          </div>

          {misHoldings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Open Intraday MIS Positions</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                When you trade in MIS (Intraday) mode with 5x leverage, active positions will appear here for fast square-off before 3:20 PM IST.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3.5">Instrument</th>
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">Quantity</th>
                    <th className="p-3.5">Avg Buy Price</th>
                    <th className="p-3.5">Margin Used (20%)</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {misHoldings.map(h => (
                    <tr key={h.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        <button
                          onClick={() => onSelectStock && onSelectStock(h.symbol)}
                          className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-semibold"
                        >
                          {h.symbol}
                          <ArrowUpRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold text-[11px]">
                          MIS (5x)
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">{h.quantity} shares</td>
                      <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">₹{h.avgBuyPrice.toFixed(2)}</td>
                      <td className="p-3.5 font-semibold text-slate-900 dark:text-white">₹{(h.totalInvested / 5).toLocaleString('en-IN')}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => onSelectStock && onSelectStock(h.symbol)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-xs transition-colors"
                        >
                          Square Off (Sell)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // Standard Order Book Table
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Orders Found</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery ? `No orders matched "${searchQuery}".` : 'You haven\'t placed any orders matching this filter yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3.5">Time (IST)</th>
                    <th className="p-3.5">Instrument</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">Order Type</th>
                    <th className="p-3.5">Quantity</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Total Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredOrders.map(order => {
                    const isBuy = order.type === 'BUY';
                    const isExecuted = order.status === 'EXECUTED';
                    const isPending = order.status === 'PENDING';
                    const isCancelled = order.status === 'CANCELLED';

                    return (
                      <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono">
                          {order.executionTime || order.placedTimeIST || order.timestamp}
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => onSelectStock && onSelectStock(order.symbol)}
                            className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 text-left"
                          >
                            <span>{order.symbol}</span>
                            <span className="text-[11px] font-normal text-slate-400 hidden sm:inline truncate max-w-[120px]">
                              {order.stockName}
                            </span>
                          </button>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              isBuy
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {order.type}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              order.productType === 'MIS'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {order.productType || 'CNC'}
                            {order.productType === 'MIS' && ' (5x)'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                            {order.orderType}
                            {order.orderType === 'GTT' && ' (GTT Trigger)'}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                          {order.quantity}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                          ₹{order.price.toFixed(2)}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                          {order.marginUsed && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                              Margin: ₹{order.marginUsed.toLocaleString('en-IN')}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {isExecuted && order.exitReason === 'SQUARE_OFF' ? (
                            <span
                              className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 font-semibold text-[11px]"
                              title="MIS positions are closed by the exchange at 3:20 PM IST"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" /> Squared off
                            </span>
                          ) : isExecuted ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Executed
                            </span>
                          ) : null}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                              <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 font-semibold text-[11px]">
                              <XCircle className="w-3.5 h-3.5" /> Cancelled
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {isPending ? (
                            <button
                              id={`cancel-order-${order.id}`}
                              onClick={() => cancelPendingOrder(order.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-rose-200 dark:border-rose-800 transition-colors"
                            >
                              Cancel Order
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">
                              {order.id.slice(-8)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {olderAvailable > 0 && (
                <div className="p-4 text-center border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={fetchOlder}
                    disabled={loadingOlder}
                    className="min-h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
                  >
                    {loadingOlder
                      ? 'Loading…'
                      : `Load older trades (${olderAvailable} more on the server)`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

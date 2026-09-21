import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  ShoppingBag, 
  ArrowRight,
  PieChart,
  Zap,
  Info,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';
import { StockDetail } from '../types';
import { formatINR, formatIndianShort } from '../utils/formatters';

export interface ThematicBasket {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  tag: string;
  cagr3Y: string;
  riskLevel: 'Low Risk' | 'Moderate' | 'High Growth';
  gradient: string;
  textColor: string;
  description: string;
  symbols: string[];
}

export const ANGEL_THEMATIC_BASKETS: ThematicBasket[] = [
  {
    id: 'basket-tech-ai',
    title: 'Enterprise AI & Tech Titans',
    subtitle: 'Global software exporters & AI innovators',
    icon: '💻',
    tag: 'HIGH TECH',
    cagr3Y: '+29.4% 3Y CAGR',
    riskLevel: 'Moderate',
    gradient: 'from-blue-600 to-indigo-700',
    textColor: 'text-blue-900',
    description: 'A curated basket of Tier-1 Indian software powerhouses engineering enterprise Gen-AI, cloud scaling, and digital consulting.',
    symbols: ['TCS', 'INFY', 'HCLTECH', 'PERSISTENT', 'COFORGE', 'TATAELXSI']
  },
  {
    id: 'basket-green-ev',
    title: 'Clean Energy & EV Boom',
    subtitle: 'Solar, Wind, Battery Storage & EV Mobility',
    icon: '⚡',
    tag: 'MEGA TREND',
    cagr3Y: '+38.5% 3Y CAGR',
    riskLevel: 'High Growth',
    gradient: 'from-emerald-600 to-teal-700',
    textColor: 'text-emerald-900',
    description: 'Companies leading India\'s renewable revolution towards 500GW capacity, EV passenger vehicles, and battery manufacturing.',
    symbols: ['TATAMOTORS', 'IREDA', 'TATAPOWER', 'EXIDEIND', 'AMARAJABAT', 'SUZLON']
  },
  {
    id: 'basket-defence-psu',
    title: 'Defence & Make in India',
    subtitle: 'Missile builders, fighter jets & sovereign rail',
    icon: '🛡️',
    tag: 'INDIGENOUS',
    cagr3Y: '+45.2% 3Y CAGR',
    riskLevel: 'High Growth',
    gradient: 'from-amber-600 to-orange-700',
    textColor: 'text-amber-950',
    description: 'Strategic Maharatna leaders, aerospace champions, Vande Bharat train manufacturers, and sovereign utility fortresses.',
    symbols: ['HAL', 'BEL', 'RVNL', 'IRFC', 'MAZDOCK', 'BDL']
  },
  {
    id: 'basket-dividend-aristocrats',
    title: 'Dividend Aristocrats & Cash Cows',
    subtitle: 'High dividend payout & monopolistic cash flow',
    icon: '👑',
    tag: 'DIVIDEND 4.8%',
    cagr3Y: '+21.8% 3Y CAGR',
    riskLevel: 'Low Risk',
    gradient: 'from-purple-600 to-indigo-800',
    textColor: 'text-purple-900',
    description: 'Stable blue-chip enterprises generating massive free cash flow with predictable, top-tier annual dividend distributions.',
    symbols: ['ITC', 'COALINDIA', 'IOC', 'POWERGRID', 'NTPC', 'BPCL']
  },
  {
    id: 'basket-genz-retail',
    title: 'Gen-Z & Quick Commerce',
    subtitle: '10-minute grocery, fast fashion & lifestyle',
    icon: '🛍️',
    tag: 'CONSUMER TREND',
    cagr3Y: '+32.1% 3Y CAGR',
    riskLevel: 'Moderate',
    gradient: 'from-rose-500 to-pink-600',
    textColor: 'text-rose-950',
    description: 'India\'s fastest-growing consumption leaders catering to youth shopping habits, food delivery, and lifestyle brands.',
    symbols: ['ZOMATO', 'SWIGGY', 'TRENT', 'TITAN', 'NYKAA', 'DEVYANI']
  },
  {
    id: 'basket-banking-fortress',
    title: 'Banking & Financial Fortresses',
    subtitle: 'Systemic banking anchors & credit lenders',
    icon: '🏦',
    tag: 'BLUECHIP CORE',
    cagr3Y: '+19.2% 3Y CAGR',
    riskLevel: 'Low Risk',
    gradient: 'from-cyan-700 to-blue-900',
    textColor: 'text-cyan-950',
    description: 'The structural financial pillars powering corporate loans, retail UPI transactions, housing mortgages, and wealth management.',
    symbols: ['HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'BAJFINANCE', 'KOTAKBANK']
  }
];

interface ThematicBasketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBasket?: ThematicBasket | null;
  selectedBasket?: ThematicBasket | null;
  onSelectBasket?: (basket: ThematicBasket) => void;
  onSelectStock: (stock: StockDetail) => void;
}

export const ThematicBasketsModal: React.FC<ThematicBasketsModalProps> = ({
  isOpen,
  onClose,
  initialBasket,
  selectedBasket: controlledBasket,
  onSelectBasket,
  onSelectStock
}) => {
  const { stocks, cashBalance, executeBuyOrder } = useSimulator();
  const effectiveInitial = controlledBasket || initialBasket || ANGEL_THEMATIC_BASKETS[0];
  const [selectedBasket, setSelectedBasket] = useState<ThematicBasket>(effectiveInitial);
  const [investmentAmount, setInvestmentAmount] = useState<number>(25000);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionSuccess, setExecutionSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync if initialBasket or controlledBasket changes
  React.useEffect(() => {
    const target = controlledBasket || initialBasket;
    if (target) {
      setSelectedBasket(target);
      setExecutionSuccess(false);
      setErrorMessage(null);
    }
  }, [initialBasket, controlledBasket]);

  if (!isOpen) return null;

  // Resolve constituent stocks
  const basketStockList = selectedBasket.symbols
    .map(sym => stocks.find(s => s.symbol === sym))
    .filter((s): s is StockDetail => s !== undefined);

  // Equal weight allocation calculation
  const perStockBudget = basketStockList.length > 0 ? investmentAmount / basketStockList.length : 0;
  
  const calculatedOrders = basketStockList.map(stock => {
    const qty = Math.max(1, Math.floor(perStockBudget / (stock.price || 1)));
    const totalCost = qty * stock.price;
    return {
      stock,
      quantity: qty,
      totalCost,
      weightPercent: (100 / basketStockList.length).toFixed(1)
    };
  });

  const grandTotalCost = calculatedOrders.reduce((sum, item) => sum + item.totalCost, 0);

  const handleExecuteBasketOrder = () => {
    if (grandTotalCost > cashBalance) {
      setErrorMessage(`Insufficient virtual cash. Required: ${formatINR(grandTotalCost)}, Available: ${formatINR(cashBalance)}`);
      return;
    }

    setIsExecuting(true);
    setErrorMessage(null);

    setTimeout(() => {
      let count = 0;
      calculatedOrders.forEach(item => {
        if (item.quantity > 0) {
          executeBuyOrder(item.stock.symbol, item.quantity, 'MARKET');
          count++;
        }
      });

      setIsExecuting(false);
      setExecutionSuccess(true);
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white border-2 border-slate-900 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 text-slate-900 my-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-md">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900">Angel One Spark Thematic Baskets</h2>
                <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full uppercase">
                  1-Click Curated Portfolios
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Diversified baskets researched for high compounding, sector tailwinds & risk balance.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Basket Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {ANGEL_THEMATIC_BASKETS.map(basket => {
            const isSelected = selectedBasket.id === basket.id;
            return (
              <button
                key={basket.id}
                onClick={() => {
                  setSelectedBasket(basket);
                  setExecutionSuccess(false);
                  setErrorMessage(null);
                }}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-102'
                    : 'bg-slate-50 text-slate-900 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between text-base">
                  <span>{basket.icon}</span>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-amber-400 text-slate-900' : 'bg-[#E2E8F0] text-zinc-800'
                  }`}>
                    {basket.tag}
                  </span>
                </div>
                <span className="font-bold text-xs line-clamp-1 mt-1">{basket.title}</span>
                <span className={`text-[10px] font-mono font-black ${isSelected ? 'text-amber-300' : 'text-emerald-700'}`}>
                  {basket.cagr3Y}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Basket Detail Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedBasket.icon}</span>
                <h3 className="text-lg font-black text-slate-900">{selectedBasket.title}</h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  selectedBasket.riskLevel === 'Low Risk'
                    ? 'bg-blue-100 text-blue-900 border-blue-200'
                    : selectedBasket.riskLevel === 'Moderate'
                      ? 'bg-amber-100 text-amber-900 border-amber-200'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                }`}>
                  {selectedBasket.riskLevel}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">{selectedBasket.description}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0 bg-white p-2.5 rounded-2xl border border-slate-200">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Historical CAGR</span>
                <span className="text-base font-black text-emerald-700 font-mono">{selectedBasket.cagr3Y}</span>
              </div>
            </div>
          </div>

          {/* Allocation Breakdown Grid */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Constituent Stocks & Model Weighting ({basketStockList.length} Leaders)</span>
              <span>Equal Weight (~{(100 / (basketStockList.length || 1)).toFixed(1)}% each)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {calculatedOrders.map(item => (
                <div 
                  key={item.stock.symbol}
                  onClick={() => {
                    onSelectStock(item.stock);
                    onClose();
                  }}
                  className="bg-white border border-slate-200 hover:border-slate-900 rounded-2xl p-3.5 transition-all hover:shadow-md cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-slate-900">{item.stock.symbol}</span>
                        <span className="text-[9px] font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.stock.sector}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium truncate block max-w-[140px]">
                        {item.stock.name}
                      </span>
                    </div>

                    <span className="font-mono text-xs font-black text-slate-900">
                      ₹{item.stock.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">
                      Allocating: <strong className="text-slate-900 font-mono font-bold">{item.quantity} Qty</strong>
                    </span>
                    <span className="font-mono font-bold text-emerald-800">
                      {formatINR(item.totalCost)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Investment Amount Budget Slider & Presets */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                  Total Basket Capital Allocation
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Select your desired lump sum investment amount to distribute across all constituents.
                </span>
              </div>

              <div className="text-right">
                <span className="text-lg font-black text-slate-900 font-mono">{formatINR(investmentAmount)}</span>
                <span className="text-[10px] text-slate-500 block font-bold">
                  Cash Available: {formatIndianShort(cashBalance)}
                </span>
              </div>
            </div>

            {/* Quick Amount Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[10000, 25000, 50000, 100000, 250000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInvestmentAmount(amt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                    investmentAmount === amt
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-white'
                  }`}
                >
                  ₹{amt >= 100000 ? `${amt / 100000} Lakh` : `${amt / 1000}k`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setInvestmentAmount(Math.min(500000, Math.floor(cashBalance)))}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shrink-0 cursor-pointer"
              >
                Max Cash
              </button>
            </div>
          </div>
        </div>

        {/* Execution Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Feedback Banner */}
        {executionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-extrabold text-sm">🎉 Basket Order Executed Successfully!</p>
                <p className="text-[11px] text-emerald-800 font-medium">
                  {basketStockList.length} stock positions have been added to your virtual portfolio.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-sm"
            >
              Done
            </button>
          </div>
        )}

        {/* Footer Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Zero Brokerage • Instant Virtual Execution • Real-time Quotes</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-slate-50 hover:bg-slate-200 text-slate-900 font-bold text-xs border border-slate-200 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isExecuting || grandTotalCost > cashBalance}
              onClick={handleExecuteBasketOrder}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl font-black text-xs text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                grandTotalCost > cashBalance
                  ? 'bg-zinc-400 cursor-not-allowed opacity-70'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              {isExecuting ? (
                <span>Executing {basketStockList.length} Orders...</span>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-amber-300" />
                  <span>1-Click Buy Basket ({formatINR(grandTotalCost)})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

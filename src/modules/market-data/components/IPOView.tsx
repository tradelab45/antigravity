import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Rocket, 
  Building, 
  Calendar, 
  Info, 
  ShieldCheck, 
  Tag, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Sparkles,
  X,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useSimulator } from '../../../context/SimulatorContext';
import { formatINR } from '../../../utils/formatters';

interface IPOItem {
  id: string;
  name: string;
  type: string;
  status: 'Upcoming' | 'Open' | 'Closed' | 'Allotted' | 'Listed';
  openDate: string;
  closeDate: string;
  listingDate: string;
  priceBand: string;
  cutOffPrice: number;
  lotSize: number;
  issueSize: string;
  subscription: string;
  subscriptionMultiplier: number;
  gmp: string;
  gmpAmount: number;
  description: string;
  symbol: string;
}

const UPCOMING_IPOS: IPOItem[] = [
  {
    id: 'ipo-1',
    name: 'GreenEnergy Tech Solutions',
    type: 'Mainboard IPO',
    status: 'Open',
    openDate: '24 Aug 2026',
    closeDate: '26 Aug 2026',
    listingDate: '31 Aug 2026',
    priceBand: '₹450 - ₹475',
    cutOffPrice: 475,
    lotSize: 30,
    issueSize: '₹1,200 Cr',
    subscription: '18.4x',
    subscriptionMultiplier: 18.4,
    gmp: '₹85 (+17.9%)',
    gmpAmount: 85,
    description: 'Leading provider of solar and wind energy storage solutions in India.',
    symbol: 'GREENTECH'
  },
  {
    id: 'ipo-2',
    name: 'Aether AI Logistics',
    type: 'SME IPO',
    status: 'Open',
    openDate: '20 Aug 2026',
    closeDate: '22 Aug 2026',
    listingDate: '28 Aug 2026',
    priceBand: '₹120 - ₹125',
    cutOffPrice: 125,
    lotSize: 1000,
    issueSize: '₹45 Cr',
    subscription: '42.5x',
    subscriptionMultiplier: 42.5,
    gmp: '₹40 (+32.0%)',
    gmpAmount: 40,
    description: 'AI-driven supply chain optimization software for e-commerce quick commerce hubs.',
    symbol: 'AETHER'
  },
  {
    id: 'ipo-3',
    name: 'NexGen FinServe Payments',
    type: 'Mainboard IPO',
    status: 'Closed',
    openDate: '15 Aug 2026',
    closeDate: '18 Aug 2026',
    listingDate: '25 Aug 2026',
    priceBand: '₹880 - ₹900',
    cutOffPrice: 900,
    lotSize: 15,
    issueSize: '₹3,500 Cr',
    subscription: '54.2x',
    subscriptionMultiplier: 54.2,
    gmp: '₹310 (+34.4%)',
    gmpAmount: 310,
    description: 'Digital-first UPI payment infrastructure provider and student micro-savings platform.',
    symbol: 'NEXGEN'
  }
];

interface IPOViewProps {
  onNavigateToScreener?: () => void;
}

export const IPOView: React.FC<IPOViewProps> = ({ onNavigateToScreener }) => {
  const { cashBalance, executeBuyOrder } = useSimulator();

  const [selectedIpo, setSelectedIpo] = useState<IPOItem | null>(null);
  const [biddingLots, setBiddingLots] = useState<number>(1);
  const [useCutOffPrice, setUseCutOffPrice] = useState<boolean>(true);
  const [customBidPrice, setCustomBidPrice] = useState<number>(0);
  const [appliedIpos, setAppliedIpos] = useState<Record<string, { lots: number; totalAmount: number; status: 'APPLIED' | 'ALLOTTED' | 'NOT_ALLOTTED' | 'LISTED'; listingGains?: number }>>({});
  const [modalFeedback, setModalFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const handleOpenBidModal = (ipo: IPOItem) => {
    setSelectedIpo(ipo);
    setBiddingLots(1);
    setUseCutOffPrice(true);
    setCustomBidPrice(ipo.cutOffPrice);
    setModalFeedback(null);
  };

  const handleApplyIPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIpo) return;

    const bidPrice = useCutOffPrice ? selectedIpo.cutOffPrice : customBidPrice;
    const totalShares = biddingLots * selectedIpo.lotSize;
    const requiredAmount = totalShares * bidPrice;

    if (requiredAmount > cashBalance) {
      setModalFeedback({
        text: `Insufficient virtual cash balance. Required: ${formatINR(requiredAmount)}, Available: ${formatINR(cashBalance)}`,
        isError: true
      });
      return;
    }

    setAppliedIpos(prev => ({
      ...prev,
      [selectedIpo.id]: {
        lots: biddingLots,
        totalAmount: requiredAmount,
        status: 'APPLIED'
      }
    }));

    setModalFeedback({
      text: `🎉 Bid placed successfully for ${biddingLots} Lot (${totalShares} Shares) in ${selectedIpo.name}! Virtual capital ₹${requiredAmount.toLocaleString('en-IN')} held in ASBA escrow.`,
      isError: false
    });
  };

  const handleSimulateAllotment = (ipoId: string) => {
    const app = appliedIpos[ipoId];
    if (!app) return;

    // Allotment in an oversubscribed IPO really is a lottery, so randomising it
    // is the honest simulation. The rate is illustrative, not a real ratio.
    const ALLOTMENT_PROBABILITY = 0.65;
    const isAllotted = Math.random() < ALLOTMENT_PROBABILITY;
    const ipo = UPCOMING_IPOS.find(i => i.id === ipoId);
    if (!ipo) return;

    const totalShares = app.lots * ipo.lotSize;
    const estimatedListingPrice = ipo.cutOffPrice + ipo.gmpAmount;
    const estimatedGain = (estimatedListingPrice - ipo.cutOffPrice) * totalShares;

    setAppliedIpos(prev => ({
      ...prev,
      [ipoId]: {
        ...prev[ipoId],
        status: isAllotted ? 'ALLOTTED' : 'NOT_ALLOTTED',
        listingGains: isAllotted ? estimatedGain : 0
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white rounded-3xl p-6 shadow-sm border border-teal-700/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-teal-800/50 rounded-2xl flex items-center justify-center border border-teal-700/50 shrink-0">
              <Rocket className="w-8 h-8 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-white">IPO Centre & Sandbox</h2>
                <span className="bg-teal-700/80 text-teal-200 text-xs font-black px-2.5 py-0.5 rounded-full border border-teal-500/30">
                  SIMULATED BIDDING
                </span>
              </div>
              <p className="text-teal-200 text-sm font-medium mt-1 max-w-2xl">
                Experience real-world Dalal Street Initial Public Offerings with virtual capital. Bid via ASBA simulation, track Grey Market Premiums (GMP), and test allotment lottery odds!
              </p>
            </div>
          </div>

          <div className="bg-teal-950/70 border border-teal-700/60 px-4 py-2.5 rounded-2xl text-right">
            <span className="text-[10px] text-teal-300 font-bold uppercase tracking-wider block">Available ASBA Cash</span>
            <span className="text-xl font-black text-white font-mono">{formatINR(cashBalance)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* IPO Catalog (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Practice & Upcoming Issues
            </h3>
            <span className="text-xs text-slate-500 font-medium">Bidding closes at 5:00 PM IST</span>
          </div>

          {UPCOMING_IPOS.map((ipo, idx) => {
            const userApp = appliedIpos[ipo.id];

            return (
              <motion.div 
                key={ipo.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-slate-900 text-lg">{ipo.name}</h4>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        ipo.status === 'Open' ? 'bg-emerald-100 text-emerald-800' :
                        ipo.status === 'Upcoming' ? 'bg-amber-100 text-amber-900' :
                        'bg-slate-200 text-zinc-700'
                      }`}>
                        {ipo.status === 'Open' ? '🟢 OPEN FOR BIDDING' : ipo.status}
                      </span>
                      <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                        {ipo.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{ipo.description}</p>
                  </div>

                  {userApp && (
                    <div className="text-right shrink-0">
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                        userApp.status === 'ALLOTTED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        userApp.status === 'NOT_ALLOTTED' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        'bg-indigo-100 text-indigo-800 border border-indigo-300'
                      }`}>
                        <Sparkles className="w-3 h-3" />
                        {userApp.status === 'ALLOTTED' ? '🎉 ALLOTTED (Full Lot)' :
                         userApp.status === 'NOT_ALLOTTED' ? '❌ NOT ALLOTTED (Refunded)' :
                         '✅ BID ACTIVE'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Price Band</span>
                    <span className="font-extrabold text-slate-900 font-mono mt-0.5 block">{ipo.priceBand}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Lot Size</span>
                    <span className="font-extrabold text-slate-900 font-mono mt-0.5 block">
                      {ipo.lotSize} Shares (₹{(ipo.lotSize * ipo.cutOffPrice).toLocaleString('en-IN')})
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Issue Dates</span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">{ipo.openDate.split(' ')[0]} - {ipo.closeDate}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Issue Size</span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">{ipo.issueSize}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-2">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase">Illustrative GMP</span>
                      <span className="font-black text-emerald-700 text-xs font-mono">{ipo.gmp}</span>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl flex items-center gap-2">
                      <span className="text-[10px] text-indigo-800 font-bold uppercase">Retail Sub.</span>
                      <span className="font-black text-indigo-950 text-xs font-mono">{ipo.subscription}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {userApp ? (
                      userApp.status === 'APPLIED' ? (
                        <button
                          onClick={() => handleSimulateAllotment(ipo.id)}
                          className="px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          🎲 Check Allotment Result
                        </button>
                      ) : userApp.status === 'ALLOTTED' ? (
                        <div className="text-xs font-black text-emerald-700 font-mono">
                          +{formatINR(userApp.listingGains || 0)} Projected Gain
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic font-medium">Refund processed to bank</span>
                      )
                    ) : (
                      <button
                        onClick={() => handleOpenBidModal(ipo)}
                        className="w-full sm:w-auto px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Rocket className="w-3.5 h-3.5 text-teal-300" />
                        <span>Apply for IPO</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Right Info Column */}
        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-200 rounded-3xl p-5 shadow-xs">
            <h3 className="font-extrabold text-teal-950 flex items-center gap-2 mb-2 text-sm">
              <Info className="w-4 h-4 text-teal-700" />
              How Does an IPO Work in India?
            </h3>
            <p className="text-xs text-teal-900/90 leading-relaxed font-medium">
              An <strong>Initial Public Offering (IPO)</strong> is when an Indian company issues shares to the public on the NSE/BSE to raise fresh growth capital.
            </p>
            <div className="mt-3 space-y-2 text-xs text-teal-900/90">
              <div className="flex items-start gap-2">
                <span className="font-black text-teal-800">•</span>
                <span><strong>Lot Size:</strong> The minimum bundle of shares you must bid for (e.g. 30 shares).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black text-teal-800">•</span>
                <span><strong>Cut-Off Price:</strong> The highest end of the price band. Retail investors usually bid at cut-off to maximize allotment chance!</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black text-teal-800">•</span>
                <span><strong>GMP (Grey Market Premium):</strong> Unofficial premium before listing date. High GMP means strong listing pop expectations!</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              SEBI ASBA Protection Rule
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Under SEBI rules, your IPO bid amount remains blocked in your bank account until allotment. If you are not allotted shares, the amount is unblocked automatically!
            </p>
          </div>
        </div>
      </div>

      {/* Interactive IPO Application Modal */}
      <AnimatePresence>
        {selectedIpo && (
          <div className="fixed inset-0 z-50 bg-slate-50/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-900"
            >
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-black">
                    <Rocket className="w-5 h-5 text-teal-300" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{selectedIpo.name}</h3>
                    <span className="text-xs text-slate-500 font-medium">Retail Category Bidding (₹2L Max)</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedIpo(null)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleApplyIPO} className="p-5 space-y-4">
                {modalFeedback && (
                  <div className={`p-3.5 rounded-2xl text-xs font-bold border flex items-start gap-2 ${
                    modalFeedback.isError
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    {modalFeedback.isError ? <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
                    <span>{modalFeedback.text}</span>
                  </div>
                )}

                {/* Price and Lot configuration */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Price Band:</span>
                    <span className="font-black text-slate-900 font-mono">{selectedIpo.priceBand}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Lot Size:</span>
                    <span className="font-black text-slate-900 font-mono">{selectedIpo.lotSize} Shares / Lot</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Illustrative GMP:</span>
                    <span className="font-black text-emerald-700 font-mono">{selectedIpo.gmp}</span>
                  </div>
                </div>

                {/* Lot Selection */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-700 mb-1.5">
                    Select Number of Lots (Max 13 Lots for Retail)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 5].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setBiddingLots(l)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all ${
                          biddingLots === l
                            ? 'bg-slate-900 text-white border-zinc-700 shadow-xs'
                            : 'bg-white text-zinc-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {l} {l === 1 ? 'Lot' : 'Lots'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cut-off price toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Bid at Cut-off Price (₹{selectedIpo.cutOffPrice})</span>
                    <span className="text-[10px] text-slate-500">Recommended for highest allotment chance</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={useCutOffPrice}
                    onChange={(e) => setUseCutOffPrice(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded cursor-pointer accent-teal-600"
                  />
                </div>

                {/* Total Bid Amount Calculation */}
                {(() => {
                  const bidPrice = useCutOffPrice ? selectedIpo.cutOffPrice : customBidPrice;
                  const totalShares = biddingLots * selectedIpo.lotSize;
                  const totalAmount = totalShares * bidPrice;

                  return (
                    <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-teal-800 font-bold uppercase block">Total Bid Value</span>
                        <span className="text-xs text-teal-900 font-medium">{totalShares} Shares ({biddingLots} Lots)</span>
                      </div>
                      <span className="text-lg font-black text-teal-950 font-mono">
                        {formatINR(totalAmount)}
                      </span>
                    </div>
                  );
                })()}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIpo(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-zinc-700 hover:bg-slate-50 text-xs font-extrabold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-2 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Rocket className="w-4 h-4 text-teal-300" />
                    <span>Submit ASBA Bid</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

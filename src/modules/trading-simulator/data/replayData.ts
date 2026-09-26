import { ReplayScenario } from '../../../types';

export const REPLAY_SCENARIOS: ReplayScenario[] = [
  {
    id: 'budget-day-volatility',
    title: 'Union Budget Day: Capex & Infra Surge',
    category: 'Budget Day',
    realSymbol: 'TATAMOTORS',
    realDate: '1 Feb 2024',
    blindName: 'Asset X — Heavy Auto & Infra Leader',
    difficulty: 'Intermediate',
    initialPrice: 865.0,
    tagline: 'High intraday volatility with massive whipsaws around the FM speech at 11:00 AM.',
    contextNarrative: 'The market opened flat with cautious pre-budget positioning. At 11:15 AM, the Finance Minister announced an 11.1% increase in capital expenditure to ₹11.11 lakh crore. Heavy auto, railway, and defense sectors immediately triggered heavy buy programs.',
    historicalContext: 'Tata Motors rallied from ₹865 to ₹915 within 45 minutes of the capex announcement, creating classic opening range break and pullback continuation setups.',
    keyLessons: [
      'Avoid market orders during high IV event announcements — slippage can exceed 0.8%.',
      'Wait for the first 15-minute reaction candle to close before taking directional momentum trades.',
      'Always trail your stop-loss below the post-announcement VWAP anchor.'
    ],
    candles: [
      { time: '09:15', open: 865.0, high: 868.5, low: 864.0, close: 867.2, volume: 450000, vwap: 866.5, rsi: 52 },
      { time: '09:30', open: 867.2, high: 869.0, low: 863.5, close: 864.8, volume: 380000, vwap: 866.0, rsi: 48 },
      { time: '09:45', open: 864.8, high: 866.0, low: 861.5, close: 862.0, volume: 410000, vwap: 865.2, rsi: 44 },
      { time: '10:00', open: 862.0, high: 864.5, low: 861.0, close: 863.5, volume: 320000, vwap: 864.8, rsi: 47 },
      { time: '10:15', open: 863.5, high: 865.0, low: 862.0, close: 864.0, volume: 290000, vwap: 864.5, rsi: 49 },
      { time: '10:30', open: 864.0, high: 867.0, low: 863.0, close: 866.5, volume: 510000, vwap: 865.0, rsi: 54 },
      { time: '10:45', open: 866.5, high: 868.0, low: 865.0, close: 867.0, volume: 620000, vwap: 865.5, rsi: 56 },
      { time: '11:00', open: 867.0, high: 874.0, low: 866.0, close: 872.5, volume: 1200000, vwap: 868.0, rsi: 64 },
      { time: '11:15', open: 872.5, high: 888.0, low: 871.5, close: 885.0, volume: 2800000, vwap: 876.5, rsi: 76 },
      { time: '11:30', open: 885.0, high: 898.5, low: 883.0, close: 896.0, volume: 3400000, vwap: 884.0, rsi: 82 },
      { time: '11:45', open: 896.0, high: 908.0, low: 894.0, close: 905.5, volume: 3100000, vwap: 891.0, rsi: 86 },
      { time: '12:00', open: 905.5, high: 914.0, low: 901.0, close: 908.0, volume: 2400000, vwap: 895.0, rsi: 84 },
      { time: '12:15', open: 908.0, high: 915.5, low: 904.5, close: 906.0, volume: 1800000, vwap: 897.0, rsi: 78 },
      { time: '12:30', open: 906.0, high: 910.0, low: 903.0, close: 907.5, volume: 1400000, vwap: 898.5, rsi: 79 },
      { time: '12:45', open: 907.5, high: 912.0, low: 906.0, close: 911.0, volume: 1500000, vwap: 900.0, rsi: 81 },
      { time: '13:00', open: 911.0, high: 916.0, low: 909.0, close: 914.5, volume: 1900000, vwap: 902.0, rsi: 83 },
      { time: '13:30', open: 914.5, high: 918.0, low: 912.0, close: 916.0, volume: 1600000, vwap: 904.0, rsi: 84 },
      { time: '14:00', open: 916.0, high: 919.5, low: 913.5, close: 918.0, volume: 2100000, vwap: 906.0, rsi: 86 },
      { time: '14:30', open: 918.0, high: 922.0, low: 916.0, close: 920.5, volume: 2700000, vwap: 908.0, rsi: 88 },
      { time: '15:00', open: 920.5, high: 924.0, low: 918.5, close: 921.0, volume: 3200000, vwap: 910.5, rsi: 87 },
      { time: '15:15', open: 921.0, high: 923.0, low: 917.0, close: 919.5, volume: 2900000, vwap: 911.0, rsi: 82 }
    ]
  },
  {
    id: 'rbi-policy-rate-pause',
    title: 'RBI MPC Rate Decision: Banking Surge',
    category: 'RBI Policy',
    realSymbol: 'HDFCBANK',
    realDate: '8 Dec 2023',
    blindName: 'Asset Y — Tier-1 Private Banking Heavyweight',
    difficulty: 'Beginner',
    initialPrice: 1625.0,
    tagline: 'RBI Governor maintains status quo on repo rates and upgrades GDP forecast to 7.0%.',
    contextNarrative: 'The banking sector entered the policy session with muted expectations. At 10:00 AM, the RBI Governor delivered a dovish commentary, holding repo rates at 6.50% while emphasizing robust domestic banking liquidity and credit demand.',
    historicalContext: 'HDFC Bank sparked an intraday short-covering rally, climbing 3.2% with steady accumulation above the 50-EMA.',
    keyLessons: [
      'When macro events match consensus with bullish tone, look for continuation along institutional trendlines.',
      'Check Sectoral Breadth (Bank Nifty index) to confirm single-stock breakouts.',
      'Take partial profits at key daily pivot resistance levels.'
    ],
    candles: [
      { time: '09:15', open: 1625.0, high: 1628.0, low: 1622.0, close: 1624.5, volume: 320000, vwap: 1625.0, rsi: 50 },
      { time: '09:30', open: 1624.5, high: 1627.0, low: 1623.0, close: 1626.0, volume: 280000, vwap: 1625.2, rsi: 53 },
      { time: '09:45', open: 1626.0, high: 1629.5, low: 1625.0, close: 1628.0, volume: 410000, vwap: 1626.0, rsi: 57 },
      { time: '10:00', open: 1628.0, high: 1642.0, low: 1627.5, close: 1639.0, volume: 1650000, vwap: 1632.0, rsi: 72 },
      { time: '10:15', open: 1639.0, high: 1648.5, low: 1636.0, close: 1646.0, volume: 1890000, vwap: 1638.0, rsi: 78 },
      { time: '10:30', open: 1646.0, high: 1652.0, low: 1643.0, close: 1649.5, volume: 1420000, vwap: 1642.0, rsi: 81 },
      { time: '10:45', open: 1649.5, high: 1654.0, low: 1647.0, close: 1652.0, volume: 1100000, vwap: 1645.0, rsi: 83 },
      { time: '11:00', open: 1652.0, high: 1658.0, low: 1650.0, close: 1656.5, volume: 1250000, vwap: 1648.0, rsi: 85 },
      { time: '11:30', open: 1656.5, high: 1662.0, low: 1654.0, close: 1660.0, volume: 1050000, vwap: 1651.0, rsi: 86 },
      { time: '12:00', open: 1660.0, high: 1665.0, low: 1658.0, close: 1663.5, volume: 950000, vwap: 1654.0, rsi: 87 },
      { time: '12:30', open: 1663.5, high: 1668.0, low: 1661.0, close: 1665.0, volume: 880000, vwap: 1656.0, rsi: 88 },
      { time: '13:00', open: 1665.0, high: 1670.0, low: 1662.5, close: 1668.0, volume: 990000, vwap: 1658.5, rsi: 89 },
      { time: '13:30', open: 1668.0, high: 1674.0, low: 1666.0, close: 1672.0, volume: 1150000, vwap: 1661.0, rsi: 90 },
      { time: '14:00', open: 1672.0, high: 1678.0, low: 1670.0, close: 1676.5, volume: 1420000, vwap: 1664.0, rsi: 91 },
      { time: '14:30', open: 1676.5, high: 1681.0, low: 1674.0, close: 1679.0, volume: 1680000, vwap: 1667.0, rsi: 92 },
      { time: '15:00', open: 1679.0, high: 1682.5, low: 1675.0, close: 1677.5, volume: 2100000, vwap: 1669.0, rsi: 86 }
    ]
  },
  {
    id: 'election-day-crash-rebound',
    title: 'Election Result Day: Epic Panic & V-Reversal',
    category: 'Election Shock',
    realSymbol: 'SBIN',
    realDate: '4 Jun 2024',
    blindName: 'Asset Z — Giant PSU Financial Anchor',
    difficulty: 'Expert',
    initialPrice: 880.0,
    tagline: 'A staggering 14% gap down on unexpected coalition arithmetic followed by an institutional value turnaround.',
    contextNarrative: 'As early election vote tally counts deviated sharply from exit polls, PSU stocks triggered multi-circuit halts. By 1:30 PM, long-term sovereign institutions stepped in, recognizing extreme discount valuations.',
    historicalContext: 'SBI crashed from ₹880 to ₹735 during peak morning panic, then staged a massive 80-point intraday bounce back to ₹815 by market close.',
    keyLessons: [
      'Never catch a falling knife without a clear stabilization base or 5-minute higher low.',
      'Panic lows on broad market macro shock often represent maximum long-term institutional value.',
      'Keep position size strictly below 1% risk of account capital during circuit breaker volatility.'
    ],
    candles: [
      { time: '09:15', open: 880.0, high: 885.0, low: 840.0, close: 845.0, volume: 5500000, vwap: 855.0, rsi: 35 },
      { time: '09:30', open: 845.0, high: 850.0, low: 810.0, close: 815.0, volume: 6800000, vwap: 835.0, rsi: 28 },
      { time: '09:45', open: 815.0, high: 820.0, low: 780.0, close: 785.0, volume: 8200000, vwap: 815.0, rsi: 21 },
      { time: '10:00', open: 785.0, high: 795.0, low: 755.0, close: 760.0, volume: 9500000, vwap: 795.0, rsi: 16 },
      { time: '10:30', open: 760.0, high: 770.0, low: 735.0, close: 742.0, volume: 11000000, vwap: 775.0, rsi: 14 },
      { time: '11:00', open: 742.0, high: 755.0, low: 738.0, close: 750.0, volume: 7500000, vwap: 765.0, rsi: 22 },
      { time: '11:30', open: 750.0, high: 765.0, low: 745.0, close: 762.0, volume: 6200000, vwap: 762.0, rsi: 30 },
      { time: '12:00', open: 762.0, high: 778.0, low: 758.0, close: 775.0, volume: 6900000, vwap: 765.0, rsi: 38 },
      { time: '12:30', open: 775.0, high: 788.0, low: 770.0, close: 784.0, volume: 7400000, vwap: 770.0, rsi: 45 },
      { time: '13:00', open: 784.0, high: 798.0, low: 780.0, close: 795.0, volume: 8800000, vwap: 778.0, rsi: 52 },
      { time: '13:30', open: 795.0, high: 808.0, low: 790.0, close: 805.0, volume: 9200000, vwap: 785.0, rsi: 58 },
      { time: '14:00', open: 805.0, high: 818.0, low: 800.0, close: 814.0, volume: 10500000, vwap: 792.0, rsi: 63 },
      { time: '14:30', open: 814.0, high: 824.0, low: 810.0, close: 820.0, volume: 9800000, vwap: 798.0, rsi: 66 },
      { time: '15:00', open: 820.0, high: 825.0, low: 812.0, close: 816.5, volume: 11200000, vwap: 802.0, rsi: 62 }
    ]
  },
  {
    id: 'opening-range-breakout-drill',
    title: 'Opening Range Breakout: Tech Growth Surge',
    category: 'Breakout Mastery',
    realSymbol: 'ZOMATO',
    realDate: '15 Jul 2024',
    blindName: 'Asset W — Quick Commerce & Food Platform',
    difficulty: 'Beginner',
    initialPrice: 220.0,
    tagline: 'Textbook 15-minute Opening Range Breakout (ORB) with 3x average volume confirmation.',
    contextNarrative: 'After consolidating tightly inside a ₹218–₹222 band for three sessions, strong pre-market block deals signaled aggressive institutional accumulation.',
    historicalContext: 'Zomato broke above the opening 15-minute high of ₹224 with massive volume and trended relentlessly upward all day to close near ₹238.',
    keyLessons: [
      'Identify the high and low of the first 15-minute candle (09:15-09:30).',
      'Enter when the 09:30 candle closes above the high with volume at least 1.5x average.',
      'Place initial stop-loss below the midpoint of the opening range.'
    ],
    candles: [
      { time: '09:15', open: 220.0, high: 224.0, low: 219.0, close: 223.5, volume: 3500000, vwap: 222.0, rsi: 60 },
      { time: '09:30', open: 223.5, high: 227.0, low: 222.8, close: 226.5, volume: 5800000, vwap: 224.5, rsi: 68 },
      { time: '09:45', open: 226.5, high: 229.0, low: 225.5, close: 228.2, volume: 4200000, vwap: 226.0, rsi: 74 },
      { time: '10:00', open: 228.2, high: 230.5, low: 227.0, close: 229.8, volume: 3800000, vwap: 227.5, rsi: 77 },
      { time: '10:30', open: 229.8, high: 232.0, low: 228.5, close: 231.2, volume: 3100000, vwap: 228.8, rsi: 80 },
      { time: '11:00', open: 231.2, high: 233.5, low: 230.0, close: 232.8, volume: 2900000, vwap: 230.0, rsi: 82 },
      { time: '11:30', open: 232.8, high: 234.2, low: 231.5, close: 233.5, volume: 2400000, vwap: 231.0, rsi: 83 },
      { time: '12:00', open: 233.5, high: 235.0, low: 232.5, close: 234.6, volume: 2100000, vwap: 232.0, rsi: 85 },
      { time: '12:30', open: 234.6, high: 236.0, low: 233.8, close: 235.4, volume: 2600000, vwap: 233.0, rsi: 86 },
      { time: '13:00', open: 235.4, high: 236.8, low: 234.5, close: 236.0, volume: 2800000, vwap: 234.0, rsi: 87 },
      { time: '13:30', open: 236.0, high: 237.5, low: 235.0, close: 237.0, volume: 3100000, vwap: 235.0, rsi: 89 },
      { time: '14:00', open: 237.0, high: 238.8, low: 236.0, close: 238.2, volume: 4200000, vwap: 236.0, rsi: 91 },
      { time: '14:30', open: 238.2, high: 239.5, low: 237.0, close: 238.8, volume: 4800000, vwap: 237.0, rsi: 92 },
      { time: '15:00', open: 238.8, high: 239.8, low: 237.5, close: 238.5, volume: 5500000, vwap: 237.5, rsi: 89 }
    ]
  }
];

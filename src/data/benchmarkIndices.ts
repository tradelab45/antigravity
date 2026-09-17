export interface BenchmarkIndexInfo {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  tagline: string;
  description: string;
  symbols: string[];
}

export const BENCHMARK_INDEX_SUBHEADINGS: BenchmarkIndexInfo[] = [
  {
    id: 'NIFTY_50',
    name: 'NIFTY 50',
    shortName: 'NIFTY 50',
    icon: '🇮🇳',
    tagline: "India's Flagship 50 Bluechips",
    description: "The premier benchmark representing the 50 largest and most liquid Indian companies across key economic sectors.",
    symbols: [
      'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'ITC', 'BHARTIARTL', 'SBIN', 'LT', 'HINDUNILVR',
      'TATAMOTORS', 'M&M', 'SUNPHARMA', 'TITAN', 'AXISBANK', 'KOTAKBANK', 'BAJFINANCE', 'MARUTI', 'NTPC',
      'ONGC', 'POWERGRID', 'TATASTEEL', 'COALINDIA', 'JSWSTEEL', 'ADANIENT', 'ADANIPORTS', 'HCLTECH', 'WIPRO',
      'TECHM', 'ULTRACEMCO', 'GRASIM', 'NESTLEIND', 'ASIANPAINT', 'DRREDDY', 'CIPLA', 'APOLLOHOSP', 'HEROMOTOCO',
      'EICHERMOT', 'BAJAJ-AUTO', 'TRENT', 'BEL', 'HAL', 'SBILIFE', 'HDFCLIFE', 'BAJAJFINSV', 'SHRIRAMFIN',
      'BPCL', 'TATACONSUM', 'DIVISLAB', 'INDUSINDBK', 'BRITANNIA'
    ]
  },
  {
    id: 'SENSEX_30',
    name: 'BSE SENSEX 30',
    shortName: 'SENSEX 30',
    icon: '🏛️',
    tagline: 'Dalal Street 30 Bellwether',
    description: "The historic 30-stock index of the Bombay Stock Exchange (BSE), tracking India's most established corporate giants.",
    symbols: [
      'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'ITC', 'BHARTIARTL', 'SBIN', 'LT', 'HINDUNILVR',
      'TATAMOTORS', 'M&M', 'SUNPHARMA', 'TITAN', 'AXISBANK', 'KOTAKBANK', 'BAJFINANCE', 'MARUTI', 'NTPC',
      'POWERGRID', 'TATASTEEL', 'JSWSTEEL', 'HCLTECH', 'TECHM', 'ULTRACEMCO', 'NESTLEIND', 'ASIANPAINT',
      'BAJAJFINSV', 'TRENT', 'INDUSINDBK'
    ]
  },
  {
    id: 'NIFTY_IT',
    name: 'NIFTY IT',
    shortName: 'NIFTY IT',
    icon: '💻',
    tagline: 'Technology & Enterprise AI',
    description: "Global consulting powerhouses, enterprise AI innovators, cloud architects, and software services exporters.",
    symbols: [
      'TCS', 'INFY', 'HCLTECH', 'WIPRO', 'TECHM', 'LTIM', 'PERSISTENT', 'COFORGE', 'MPHASIS', 'LTTS', 'TATAELXSI', 'KPITTECH', 'OFSS', 'CYIENT'
    ]
  },
  {
    id: 'NIFTY_BANK',
    name: 'NIFTY BANK & FINANCIALS',
    shortName: 'NIFTY BANK',
    icon: '🏦',
    tagline: 'Financial & Banking Titans',
    description: "India's highest capitalized commercial banks, NBFC leaders, insurance giants, and digital payment infrastructure.",
    symbols: [
      'HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK', 'INDUSINDBK', 'BANKBARODA', 'PNB', 'FEDERALBNK',
      'IDFCFIRSTB', 'AUBANK', 'BAJFINANCE', 'BAJAJFINSV', 'MUTHOOTFIN', 'CHOLAFIN', 'LICI', 'SBICARD', 'HDFCAMC'
    ]
  },
  {
    id: 'NIFTY_AUTO',
    name: 'NIFTY AUTO & EV',
    shortName: 'NIFTY AUTO',
    icon: '🚗',
    tagline: 'Automotive & EV Revolution',
    description: "Automobile OEMs, electric mobility innovators, two-wheeler champions, commercial vehicles, and auto components.",
    symbols: [
      'TATAMOTORS', 'M&M', 'MARUTI', 'BAJAJ-AUTO', 'EICHERMOT', 'HEROMOTOCO', 'TVSMOTOR', 'BHARATFORG',
      'BOSCHLTD', 'MOTHERSON', 'TIINDIA', 'ASHOKLEY', 'OLAELEC', 'OLECTRA', 'AMARAJABAT', 'EXIDEIND'
    ]
  },
  {
    id: 'NIFTY_PHARMA',
    name: 'NIFTY PHARMA & HEALTHCARE',
    shortName: 'NIFTY PHARMA',
    icon: '💊',
    tagline: 'Healthcare & Life Sciences',
    description: "Generic medicine producers, super-specialty hospital chains, diagnostic networks, and biotechnology innovators.",
    symbols: [
      'SUNPHARMA', 'CIPLA', 'DRREDDY', 'DIVISLAB', 'APOLLOHOSP', 'MANKIND', 'ZYDUSLIFE', 'TORNTPHARM',
      'LUPIN', 'AUROPHARMA', 'BIOCON', 'MAXHEALTH', 'FORTIS'
    ]
  },
  {
    id: 'NIFTY_DEFENCE_PSU',
    name: 'NIFTY DEFENCE, PSU & RAILWAYS',
    shortName: 'DEFENCE & PSU',
    icon: '🛡️',
    tagline: 'Maharatnas & Sovereign Infrastructure',
    description: "Strategic Maharatnas, Vande Bharat train manufacturers, missile & fighter jet builders, and public utility leaders.",
    symbols: [
      'HAL', 'BEL', 'RVNL', 'IRFC', 'IRCTC', 'MAZDOCK', 'COCHINSHIP', 'BDL', 'BEML', 'BHEL', 'NTPC',
      'ONGC', 'POWERGRID', 'COALINDIA', 'SAIL', 'IOC', 'BPCL', 'GAIL', 'PFC', 'RECLTD', 'IREDA', 'NHPC', 'SJVN', 'RAILTEL', 'CONCOR'
    ]
  },
  {
    id: 'NIFTY_CONSUMER',
    name: 'NIFTY CONSUMER & QUICK COMMERCE',
    shortName: 'CONSUMER & RETAIL',
    icon: '🛍️',
    tagline: 'FMCG, Food & Retail Brands',
    description: "Household FMCG staples, 10-minute grocery apps, pizza chains, trendsetting apparel, and youth lifestyle brands.",
    symbols: [
      'ITC', 'HINDUNILVR', 'NESTLEIND', 'BRITANNIA', 'TATACONSUM', 'DABUR', 'MARICO', 'GODREJCP',
      'COLPAL', 'VARUN', 'VBL', 'JUBLFOOD', 'DEVYANI', 'ZOMATO', 'SWIGGY', 'TRENT', 'TITAN', 'NYKAA',
      'CAMPUS', 'HONASA', 'BATAINDIA', 'PAGEIND', 'PVRINOX'
    ]
  }
];
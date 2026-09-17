export interface FinancialMetricComparison {
  metric: string;
  unit: string;
  companyA: { name: string; value: string | number; note?: string };
  companyB: { name: string; value: string | number; note?: string };
  companyC?: { name: string; value: string | number; note?: string };
  importance: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  tagline: string;
  category: 'FMCG & Consumer' | 'Tech & Platforms' | 'Banking & BFSI' | 'Automobile & EV' | 'IT & Software' | 'Energy & Transition';
  companies: string[];
  readTime: string;
  badge: string;
  heroHeadline: string;
  narrativeOverview: string;
  coreBusinessBattle: {
    title: string;
    points: { headline: string; detail: string }[];
  };
  metricsTable: FinancialMetricComparison[];
  strategicInsights: {
    title: string;
    description: string;
    icon: string;
  }[];
  keyLessons: string[];
  investorChecklist: string[];
  pitfallsToAvoid: string[];
  verdictSummary: string;
}

export const CASE_STUDIES_DATA: CaseStudy[] = [
  {
    id: 'case-study-fmcg',
    title: 'FMCG Moat Wars: The Battle for India\'s Kitchen & Bathrooms',
    tagline: 'Hindustan Unilever (HUL) vs Nestlé India vs ITC — Pricing Power, 9 Million Kiranas & Cash Cow Portfolios',
    category: 'FMCG & Consumer',
    companies: ['HINDUNILVR', 'NESTLEIND', 'ITC'],
    readTime: '8 min deep dive',
    badge: 'Classic Moat Study',
    heroHeadline: 'How Brand Trust & Supply Chain Depth Compound Wealth Across Market Cycles',
    narrativeOverview: `In India, consumer goods (FMCG) companies enjoy some of the highest Returns on Equity (ROE > 20–80%) in the entire global stock universe. Hindustan Unilever (Surf Excel, Dove, Sunsilk), Nestlé India (Maggi, KitKat, Nescafé), and ITC (Aashirvaad, Sunfeast, Classmate, Bingo) dominate grocery baskets across 1.4 billion people.\n\nThis case study analyzes why brand loyalty allows these giants to pass raw material inflation directly to consumers without losing market share, and how their asset-light distribution models create dividend-paying machines.`,
    coreBusinessBattle: {
      title: 'Strategic Moat Comparison: Three Distinct Paths to FMCG Supremacy',
      points: [
        {
          headline: 'HUL: The Master of Mass-Market Penetration & Premiumization',
          detail: 'HUL reaches over 9 million retail outlets with 16 brands generating ₹1,000+ Crores each. When inflation hits, HUL "shrink-flates" pack sizes (e.g. keeping ₹10 price point while adjusting grams) to preserve volume.'
        },
        {
          headline: 'Nestlé India: Urban Dominance & Unmatched Infant/Noodle Brand Elasticity',
          detail: 'Nestlé focuses on high-margin urban nutrition and prepared dishes. Maggi commands ~60% instant noodle market share, giving Nestlé tremendous pricing power where parents and students rarely switch to cheaper rivals.'
        },
        {
          headline: 'ITC: The Cigarette Cash Engine Subsidizing a FMCG Empire',
          detail: 'ITC generates massive liquid cash flows (~₹15,000+ Cr annually) from its 80% cigarette monopoly. It systematically reinvests these profits to scale non-cigarette brands (Aashirvaad Atta is India\'s #1 packaged flour brand doing ₹7,500+ Cr revenue) with zero debt.'
        }
      ]
    },
    metricsTable: [
      {
        metric: 'Return on Equity (RoE)',
        unit: '%',
        companyA: { name: 'HUL', value: '20.2%', note: 'Consistent high capital efficiency' },
        companyB: { name: 'Nestlé India', value: '108.5%', note: 'Ultra-lean asset-light equity base' },
        companyC: { name: 'ITC', value: '28.4%', note: 'Compounded with high cash reserves' },
        importance: 'Measures how much net profit management generates from shareholders\' equity capital.'
      },
      {
        metric: 'Operating Margin (EBITDA)',
        unit: '%',
        companyA: { name: 'HUL', value: '23.6%', note: 'Stable across input price swings' },
        companyB: { name: 'Nestlé India', value: '24.2%', note: 'Premium urban brand pricing' },
        companyC: { name: 'ITC', value: '37.8%', note: 'High-margin tobacco cushions FMCG gestation' },
        importance: 'Shows profitability before interest and taxes; higher margins cushion against raw material inflation.'
      },
      {
        metric: 'Dividend Yield',
        unit: '%',
        companyA: { name: 'HUL', value: '1.7%', note: '85-90% net profit payout' },
        companyB: { name: 'Nestlé India', value: '1.4%', note: 'High cash payout ratio' },
        companyC: { name: 'ITC', value: '3.4%', note: 'Among the highest dividend yields in NIFTY 50' },
        importance: 'Direct cash return to your bank account every quarter without having to sell your shares.'
      },
      {
        metric: 'Price-to-Earnings (P/E)',
        unit: 'x',
        companyA: { name: 'HUL', value: '54.2x', note: 'Consumer defensive quality multiple' },
        companyB: { name: 'Nestlé India', value: '72.1x', note: 'Premium multiple for scarce growth' },
        companyC: { name: 'ITC', value: '26.8x', note: 'Discounted historically due to cigarette taxation' },
        importance: 'How many rupees investors pay per ₹1 of annual net profit.'
      },
      {
        metric: 'Debt-to-Equity Ratio',
        unit: 'Ratio',
        companyA: { name: 'HUL', value: '0.00', note: 'Completely debt-free' },
        companyB: { name: 'Nestlé India', value: '0.03', note: 'Near zero net debt' },
        companyC: { name: 'ITC', value: '0.00', note: 'Net cash surplus of ₹18,000+ Cr' },
        importance: 'Zero debt means these companies never face bankruptcy risk during severe interest rate hikes.'
      }
    ],
    strategicInsights: [
      {
        title: 'The Magic of Negative Working Capital',
        description: 'FMCG giants collect money from distributors upfront in cash, while paying suppliers on 60-90 day credit terms. They operate on other people\'s money without bank loans!',
        icon: 'Wallet'
      },
      {
        title: 'Pricing Power & Elasticity Test',
        description: 'When palm oil or wheat prices rise 20%, HUL and Nestlé increase biscuit or soap prices by 8%. When commodity costs drop, prices rarely drop back, expanding net margins permanently.',
        icon: 'Sparkles'
      },
      {
        title: 'The Rural Consumption Engine',
        description: 'Over 40% of Indian FMCG sales originate in Tier-2/Tier-3 towns and villages. Good monsoons and rising agricultural incomes spark immediate volume acceleration.',
        icon: 'TrendingUp'
      }
    ],
    keyLessons: [
      'Look for businesses with high pricing power where consumers buy the product habitually every single week.',
      'Negative or near-zero debt protects companies from economic recessions and rate cycles.',
      'Check Return on Capital Employed (ROCE > 20%): Great FMCG companies require minimal capex to double output.'
    ],
    investorChecklist: [
      'Is volume growth positive (not just price-hike revenue growth)?',
      'Are local D2C brands taking market share in urban metros?',
      'Is the dividend payout ratio consistent over 5+ years?'
    ],
    pitfallsToAvoid: [
      'Overpaying at peak P/E (e.g. buying FMCG stocks above 75x P/E when volume growth slows to 3%).',
      'Ignoring unseasonal monsoon failures which hurt rural disposable income.'
    ],
    verdictSummary: 'For conservative young investors seeking wealth preservation with steady 11-14% compounding and safe dividend income, FMCG blue-chips provide the ultimate bedrock.'
  },
  {
    id: 'case-study-platform-disruption',
    title: 'Platform Economics vs Traditional Franchise: Quick Commerce Revolution',
    tagline: 'Zomato (Blinkit) vs Jubilant FoodWorks (Domino\'s India) — 10-Minute Deliveries & Operating Leverage',
    category: 'Tech & Platforms',
    companies: ['ZOMATO', 'JUBLFOOD'],
    readTime: '9 min read',
    badge: 'Disruption & Unit Economics',
    heroHeadline: 'How Network Effects and Dark Stores Transformed Indian Consumer Logistics',
    narrativeOverview: `Over the past decade, urban dining shifted from sit-down restaurants to online ordering and instant 10-minute grocery delivery. \n\nJubilant FoodWorks built a formidable empire by mastering store kitchen operations, central dough supply chains, and guaranteed 30-minute pizza delivery. Meanwhile, Zomato pivoted from a restaurant review directory into a dual-engine digital powerhouse: Food Delivery platform and Blinkit Quick Commerce.`,
    coreBusinessBattle: {
      title: 'Platform Aggregator vs Asset-Heavy Franchise Master',
      points: [
        {
          headline: 'Zomato: Two-Sided Platform with Infinite Shelf Space',
          detail: 'Zomato owns no kitchens or grocery farms. It charges 18-24% take-rates on food orders and monetizes dark stores via Blinkit, achieving massive operating leverage as average order frequency rises.'
        },
        {
          headline: 'Jubilant: Strict Standardized Kitchens & Deep Cold-Chain',
          detail: 'Jubilant manages 2,000+ Domino\'s and Popeyes stores across 400+ cities. It controls everything from dairy sourcing to oven temperature, earning high store-level EBITDA margins (~19–22%).'
        },
        {
          headline: 'The 10-Minute Quick Commerce Battleground',
          detail: 'Blinkit scaled to 700+ dark stores delivering everything from onions to iPhone chargers in 10 minutes. This poses a threat to traditional FMCG retail and specialized delivery chains.'
        }
      ]
    },
    metricsTable: [
      {
        metric: 'Revenue Growth Rate (YoY)',
        unit: '%',
        companyA: { name: 'Zomato', value: '+68.5%', note: 'Explosive Blinkit and Hyperpure scale' },
        companyB: { name: 'Jubilant FoodWorks', value: '+14.2%', note: 'Mature retail store network expansion' },
        importance: 'Indicates top-line consumer adoption speed across Indian metros.'
      },
      {
        metric: 'Operating Profitability (EBITDA)',
        unit: '%',
        companyA: { name: 'Zomato', value: '4.8% (Expanding)', note: 'Turned profitable from deep losses' },
        companyB: { name: 'Jubilant FoodWorks', value: '19.8%', note: 'High store-level kitchen cash generation' },
        importance: 'Tech platforms initially bleed cash to capture scale before hitting hyper-profitability.'
      },
      {
        metric: 'Asset Turnover Ratio',
        unit: 'x',
        companyA: { name: 'Zomato', value: '1.45x', note: 'Asset-light marketplace model' },
        companyB: { name: 'Jubilant FoodWorks', value: '0.85x', note: 'Heavy capex for retail store interiors' },
        importance: 'Revenue generated per ₹1 of company assets.'
      },
      {
        metric: 'Average Order Value (AOV)',
        unit: '₹',
        companyA: { name: 'Zomato / Blinkit', value: '₹420 – ₹625', note: 'Blinkit AOV climbing as electronics added' },
        companyB: { name: 'Jubilant FoodWorks', value: '₹550', note: 'Stable pizza & combo meals ticket size' },
        importance: 'Higher basket size covers delivery rider and packaging costs easily.'
      }
    ],
    strategicInsights: [
      {
        title: 'Dark Store Density Moat',
        description: 'Once a Blinkit dark store achieves 1,200+ daily orders within a 2km radius, rider route optimization turns fixed rent and employee expenses into huge net profit margins.',
        icon: 'Zap'
      },
      {
        title: 'The Take-Rate Power',
        description: 'Restaurants and brands must advertise on Zomato to get visibility, allowing the platform to earn advertising revenue on top of delivery commissions.',
        icon: 'BarChart3'
      }
    ],
    keyLessons: [
      'Tech platforms with high switching costs and network effects can flip from losses to rapid profit expansion once fixed infrastructure is covered.',
      'Check contribution margin per order: If a company loses ₹20 on every order without advertising subsidies, growth destroys shareholder capital.'
    ],
    investorChecklist: [
      'Is Adjusted EBITDA positive after all corporate and ESOP costs?',
      'Are rider delivery costs declining as density improves in Tier 1 & 2 cities?',
      'Is customer retention (cohort reorder rate) improving year-on-year?'
    ],
    pitfallsToAvoid: [
      'Mistaking GMV (Gross Merchandise Value) for actual net company revenue.',
      'Ignoring ruthless price competition from Zepto, Swiggy Instamart, or new deep-pocket entrants.'
    ],
    verdictSummary: 'Tech platform disruptors offer higher growth upside during early adoption phases, but require careful monitoring of unit economics and cash burn.'
  },
  {
    id: 'case-study-banking-clash',
    title: 'The Banking Titans: Private Retail King vs The Nation\'s Banker',
    tagline: 'HDFC Bank vs State Bank of India (SBI) — Net Interest Margins, CASA Deposits & NPA Cycles',
    category: 'Banking & BFSI',
    companies: ['HDFCBANK', 'SBIN'],
    readTime: '9 min read',
    badge: 'BFSI Valuation Framework',
    heroHeadline: 'How to Read a Bank: Why Price-to-Book (P/B) and Asset Quality Mean Everything',
    narrativeOverview: `Banks are the financial bloodstream of India\'s expanding ₹300 Lakh Crore economy. Unlike normal manufacturing firms, banks do not sell gadgets—they borrow cheap money from depositors and lend it at higher rates to homebuyers, car purchasers, and industrial conglomerates.\n\nHDFC Bank has long been the gold standard of private banking discipline, while State Bank of India (SBI) is a government-backed colossus touching 500 million citizens across 22,000+ branches.`,
    coreBusinessBattle: {
      title: 'Underwriting Discipline vs National Scale & Infrastructure',
      points: [
        {
          headline: 'HDFC Bank: Pristine Underwriting & Retail Tech Efficiency',
          detail: 'HDFC Bank maintained Gross NPAs below 1.4% through every economic cycle over 25 years. Its post-merger branch network creates a formidable moat in low-cost CASA deposits.'
        },
        {
          headline: 'SBI: The Sovereign Engine of Infrastructure & Government Payrolls',
          detail: 'SBI commands ~23% of all Indian banking deposits and loans. Over the last 5 years, SBI cleaned up corporate bad loans, achieved record ₹60,000+ Cr annual net profits, and digitized via YONO.'
        }
      ]
    },
    metricsTable: [
      {
        metric: 'Net Interest Margin (NIM)',
        unit: '%',
        companyA: { name: 'HDFC Bank', value: '3.4% – 3.6%', note: 'High-yielding retail loan focus' },
        companyB: { name: 'State Bank of India', value: '3.1% – 3.3%', note: 'Heavy corporate and home loan portfolio' },
        importance: 'The spread between the interest a bank earns on loans and pays on deposits.'
      },
      {
        metric: 'Gross NPA Ratio (Bad Loans)',
        unit: '%',
        companyA: { name: 'HDFC Bank', value: '1.36%', note: 'World-class underwriting quality' },
        companyB: { name: 'State Bank of India', value: '2.21%', note: 'Massive turnaround from 10.9% in 2018' },
        importance: 'Lower Gross NPA indicates fewer borrowers default on their loans.'
      },
      {
        metric: 'CASA Ratio (Current & Savings)',
        unit: '%',
        companyA: { name: 'HDFC Bank', value: '38.2%', note: 'Rebuilding post-HDFC Ltd merger' },
        companyB: { name: 'State Bank of India', value: '41.1%', note: 'Unmatched pan-India low-cost deposit stickiness' },
        importance: 'Higher CASA provides ultra-cheap deposit funding (3–4%), boosting lending margins.'
      },
      {
        metric: 'Price-to-Book (P/B) Valuation',
        unit: 'x',
        companyA: { name: 'HDFC Bank', value: '2.4x – 2.8x', note: 'Historical low due to merger digestion' },
        companyB: { name: 'State Bank of India', value: '1.2x – 1.5x', note: 'Attractive PSU multiple with high ROE' },
        importance: 'The premier valuation metric for financial institutions; never use P/E in isolation for banks.'
      },
      {
        metric: 'Return on Assets (RoA)',
        unit: '%',
        companyA: { name: 'HDFC Bank', value: '1.9% – 2.0%', note: 'High profitability per rupee of balance sheet' },
        companyB: { name: 'State Bank of India', value: '1.0% – 1.1%', note: 'Excellent for a massive state-owned bank' },
        importance: 'Banks with RoA consistently above 1.5% command high valuation premiums.'
      }
    ],
    strategicInsights: [
      {
        title: 'The Power of Credit Costs',
        description: 'When economic recessions strike, poorly run banks write off 3-5% of their loan book, wiping out equity. Conservative banks maintain 75%+ Provision Coverage Ratios (PCR) to sleep well at night.',
        icon: 'ShieldCheck'
      },
      {
        title: 'Why Banks Never Use P/E Alone',
        description: 'A bank with high bad loans can report high temporary earnings before suddenly collapsing. Always inspect NPA trends, Capital Adequacy (CAR > 15%), and Book Value quality.',
        icon: 'Calculator'
      }
    ],
    keyLessons: [
      'In banking, the best banks are those that know when NOT to lend.',
      'Check Provision Coverage Ratio (PCR > 75%): Ensures bad loans are already provided for in the P&L.',
      'Track Credit-to-Deposit (CD Ratio): Banks with CD ratio > 85% face high competition for deposits.'
    ],
    investorChecklist: [
      'Is the bank\'s Gross and Net NPA declining or stable?',
      'Are deposit growth and loan growth balanced without sacrificing margins?',
      'Is Capital Adequacy Ratio (Tier-1 CAR) comfortably above RBI regulatory minimums (11.5%)?'
    ],
    pitfallsToAvoid: [
      'Buying small regional banks with high promoter pledged shares and rising NPA spikes.',
      'Ignoring sudden spikes in unsecured personal loans or credit card delinquency rates.'
    ],
    verdictSummary: 'HDFC Bank represents steady compounding through underwriting discipline, while SBI offers high cyclical earnings power backed by the sovereign might of India.'
  },
  {
    id: 'case-study-ev-auto',
    title: 'The Electric & Mobility Race: EV Aggression vs Hybrid Scale',
    tagline: 'Tata Motors (JLR & EV Leader) vs Maruti Suzuki (Hybrid & Scale King)',
    category: 'Automobile & EV',
    companies: ['TATAMOTORS', 'MARUTI'],
    readTime: '8 min read',
    badge: 'Clean Tech & Transition',
    heroHeadline: 'Two Automotive Titans Clashing on the Future of Indian Road Transportation',
    narrativeOverview: `India is the third largest automobile market in the world, with over 4 million passenger cars sold every year. \n\nTata Motors took an aggressive first-mover gamble on electric passenger vehicles (Nexon EV, Punch EV, Curvv EV) commanding over 65% of India\'s pure EV market while engineering a historic turnaround at Jaguar Land Rover (JLR). In contrast, Maruti Suzuki dominates 40%+ of the total car market through bulletproof reliability, ultra-low ownership costs, CNG fuel efficiency, and strong hybrid partnerships with Toyota.`,
    coreBusinessBattle: {
      title: 'Clean Technology Philosophies & Manufacturing Scale',
      points: [
        {
          headline: 'Tata Motors: First-Mover EV Ecosystem & Luxury Global Cash Flows',
          detail: 'Tata Motors partnered with Tata Power (charging stations) and Tata AutoComp (battery packs) to build an integrated EV moat. High-margin Range Rover sales at JLR eliminated net automotive debt.'
        },
        {
          headline: 'Maruti Suzuki: Distribution Fortress & Pragmatic Hybrid Transition',
          detail: 'Maruti believes full EV adoption in India requires affordable charging infrastructure. It leverages 3,500+ service centers and 50+ km/kg CNG/hybrid cars to capture middle-class family buyers.'
        }
      ]
    },
    metricsTable: [
      {
        metric: 'Domestic Passenger Vehicle Market Share',
        unit: '%',
        companyA: { name: 'Tata Motors', value: '14.5%', note: 'Climbed from ~5% in 2019 to #2/#3' },
        companyB: { name: 'Maruti Suzuki', value: '41.2%', note: 'Unchallenged scale market leader' },
        importance: 'Higher market share provides huge purchasing power over parts suppliers.'
      },
      {
        metric: 'Electric Vehicle (EV) Segment Share',
        unit: '%',
        companyA: { name: 'Tata Motors', value: '68.0%', note: 'Overwhelming pure-EV market leader' },
        companyB: { name: 'Maruti Suzuki', value: '< 2.0%', note: 'Launching eVX global EV in 2025' },
        importance: 'Measures readiness for the zero-emission regulatory transition.'
      },
      {
        metric: 'Operating Profit Margin (EBITDA)',
        unit: '%',
        companyA: { name: 'Tata Motors', value: '14.2%', note: 'Boosted by high-margin Range Rover & Defender' },
        companyB: { name: 'Maruti Suzuki', value: '12.0%', note: 'Steady domestic manufacturing efficiency' },
        importance: 'Operating buffer against raw material steel and aluminium price shocks.'
      },
      {
        metric: 'Free Cash Flow (Annual)',
        unit: '₹ Cr',
        companyA: { name: 'Tata Motors', value: '₹22,000+ Cr', note: 'Rapid deleveraging and debt elimination' },
        companyB: { name: 'Maruti Suzuki', value: '₹9,500+ Cr', note: 'Cash surplus of ₹45,000+ Cr in treasury' },
        importance: 'Surplus cash funds gigafactories and new model R&D without dilution.'
      }
    ],
    strategicInsights: [
      {
        title: 'The Commercial Vehicle (CV) Cash Cycle',
        description: 'Tata Motors is also India\'s largest commercial truck and bus manufacturer. When infrastructure spending and freight GDP boom, CV margins surge, generating surplus capital for passenger car EV tech.',
        icon: 'Layers'
      },
      {
        title: 'Maruti\'s Resale Value Moat',
        description: 'Because Maruti spare parts are available in every remote town in India, Maruti cars suffer the lowest depreciation, making them the default default purchase for first-time buyers.',
        icon: 'ShieldCheck'
      }
    ],
    keyLessons: [
      'In cyclical manufacturing industries, look for companies that can reduce debt during boom years.',
      'Technology transitions take longer than anticipated: Hybrid and CNG bridge fuels can generate huge intermediate profits.'
    ],
    investorChecklist: [
      'Are order backlogs for new models growing or suffering cancellations?',
      'Is raw material cost (battery cells, platinum, semiconductors) stabilizing?',
      'Are export shipments expanding into Europe, Middle East, and Southeast Asia?'
    ],
    pitfallsToAvoid: [
      'Buying auto stocks at the peak of the multi-year commercial vehicle cycle when valuations look deceptively low.',
      'Ignoring subsidy phase-outs (like FAME-II) that temporarily dampen retail EV adoption.'
    ],
    verdictSummary: 'Tata Motors is a dynamic play on global luxury and domestic EV innovation, while Maruti Suzuki is the fortress of Indian mass-market mobility.'
  },
  {
    id: 'case-study-it-export',
    title: 'The Indian Tech Software Titans: Cash Flow Machines & The AI Pivot',
    tagline: 'Tata Consultancy Services (TCS) vs Infosys — High ROE, Zero Debt & Multi-Billion Dollar Deal TCVs',
    category: 'IT & Software',
    companies: ['TCS', 'INFY'],
    readTime: '7 min read',
    badge: 'Export Giants & Free Cash Flow',
    heroHeadline: 'How India\'s Software Giants Convert Global Enterprise Budgets into Shareholder Dividends',
    narrativeOverview: `India\'s IT service industry generates over $250 Billion in annual foreign exchange export revenue, serving Fortune 500 banks, airlines, and healthcare providers in North America and Europe. \n\nTCS and Infosys are renowned for stellar corporate governance, zero bank debt, 30%+ Return on Equity, and paying out 80–90% of their free cash flows as dividends and buybacks. Today, both giants are integrating Generative AI copilots into client workflows.`,
    coreBusinessBattle: {
      title: 'Execution Discipline vs Technology Architecture Agility',
      points: [
        {
          headline: 'TCS: The Pillar of Operational Margin Stability & Low Attrition',
          detail: 'With over 600,000 software engineers, TCS maintains industry-leading operating margins (25–26%) and the lowest employee turnover rate across Indian IT.'
        },
        {
          headline: 'Infosys: Agility in Cloud, AI Enterprise Platforms & Large Deals',
          detail: 'Infosys focuses on aggressive large deal acquisition ($15B+ annual TCV) and enterprise cloud transformations with its Topaz AI and Cobalt platforms.'
        }
      ]
    },
    metricsTable: [
      {
        metric: 'Operating Margin (EBIT)',
        unit: '%',
        companyA: { name: 'TCS', value: '25.5%', note: 'Consistent industry benchmark' },
        companyB: { name: 'Infosys', value: '21.4%', note: 'Investing heavily in AI delivery talent' },
        importance: 'Operating margin shows wage cost management and pricing power with global Fortune 500 clients.'
      },
      {
        metric: 'Return on Equity (RoE)',
        unit: '%',
        companyA: { name: 'TCS', value: '48.2%', note: 'Extraordinary capital productivity' },
        companyB: { name: 'Infosys', value: '31.8%', note: 'High capital return to shareholders' },
        importance: 'Measures shareholder wealth creation without relying on financial debt.'
      },
      {
        metric: 'Dividend + Buyback Payout',
        unit: '% of Net Profit',
        companyA: { name: 'TCS', value: '85% – 100%', note: 'Regular special dividends' },
        companyB: { name: 'Infosys', value: '85%', note: 'Strict capital allocation return policy' },
        importance: 'Cash return ensures management does not hoard unneeded capital or make value-destroying acquisitions.'
      },
      {
        metric: 'Total Contract Value (TCV)',
        unit: '$ Billion / Quarter',
        companyA: { name: 'TCS', value: '$8.5B – $13.2B', note: 'Steady mega-deal bookings' },
        companyB: { name: 'Infosys', value: '$3.5B – $7.0B', note: 'Lumpy but high-growth pipeline' },
        importance: 'Forward indicator of revenue visibility for the next 3–5 years.'
      }
    ],
    strategicInsights: [
      {
        title: 'The Currency Depreciation Tailwinds',
        description: 'Indian IT firms bill US/European clients in USD/EUR while paying operational engineer salaries in Indian Rupees (INR). When the Rupee depreciates against the Dollar, profit margins automatically expand.',
        icon: 'TrendingUp'
      },
      {
        title: 'Generative AI Productivity J-Curve',
        description: 'While AI reduces coding hours for junior tasks, it creates high-margin demand for enterprise cybersecurity, cloud data migration, and AI model orchestration.',
        icon: 'Sparkles'
      }
    ],
    keyLessons: [
      'Indian IT blue-chips are defensive shock-absorbers during domestic economic downturns due to their foreign currency earnings.',
      'Check employee utilization rate (82–86%) and attrition trends: Happy engineers translate into long-term client retention.'
    ],
    investorChecklist: [
      'Is US banking & financial services tech spending accelerating?',
      'Are constant currency (CC) revenue growth guidance numbers realistic?',
      'Is the company actively training 100,000+ engineers in modern AI frameworks?'
    ],
    pitfallsToAvoid: [
      'Panic selling during short-term US interest rate pauses when tech budgets temporarily freeze.',
      'Over-weighting IT stocks if global client visa and immigration policies face sudden protectionist barriers.'
    ],
    verdictSummary: 'TCS and Infosys represent unmatched cash flow compounding, zero-debt balance sheets, and steady dividend yields for long-term equity investors.'
  },
  {
    id: 'case-study-titan-luxury',
    title: 'Titan Company: The Power of Brand Trust in Unorganized Markets',
    tagline: 'Tanishq, Fastrack & Titan Eye+ — How Tata Converted Traditional Gold into a 40x Compounding Giant',
    category: 'FMCG & Consumer',
    companies: ['TITAN'],
    readTime: '8 min read',
    badge: 'Formalization Superpower',
    heroHeadline: 'How Hallmarking Trust & Customer Experience Built India\'s Ultimate Luxury Moat',
    narrativeOverview: `Thirty years ago, Indian gold jewellery buying was entirely dominated by unorganized family jewellers who often used variable purity standards (18k sold as 22k) with zero price transparency. \n\nUnder Tata leadership, Titan introduced **Tanishq** with the revolutionary Karatmeter (electronic gold purity tester), guaranteed buyback terms, and contemporary wedding designs. Today, Tanishq is India\'s largest branded jewellery chain, capturing a multi-decade tailwind as Indian households migrate from unorganized stores to trusted corporate brands.`,
    coreBusinessBattle: {
      title: 'The Architecture of the Tanishq Compounding Machine',
      points: [
        {
          headline: 'The Karatmeter Trust Arbitrage',
          detail: 'By providing verifiable electronic purity tests in air-conditioned showrooms, Tanishq made consumers realize they were losing money at unorganized stores, building unmatched brand reverence.'
        },
        {
          headline: 'Gold on Lease & Negative Capital Risk',
          detail: 'Titan procures raw gold through bullion banking leases at low interest rates, completely hedging against gold price volatility and focusing purely on the making-charge margin (12–25%).'
        },
        {
          headline: 'Sub-Brand Strategy Across Lifestyles',
          detail: 'Titan successfully diversified from watches into jewellery (Tanishq, Mia, Zoya, CaratLane), eyewear (Titan Eye+), and ethnic wear (Taneira), scaling each under the trusted Tata umbrella.'
        }
      ]
    },
    metricsTable: [
      {
        metric: '10-Year Revenue CAGR',
        unit: '%',
        companyA: { name: 'Titan Company', value: '19.4%', note: 'Consistent market share gains' },
        companyB: { name: 'Unorganized Market Average', value: '6.2%', note: 'Losing share due to GST & hallmarking' },
        importance: 'Demonstrates rapid brand migration in a massive ₹4 Lakh Crore market.'
      },
      {
        metric: 'Return on Capital Employed (ROCE)',
        unit: '%',
        companyA: { name: 'Titan Company', value: '31.5%', note: 'Exceptional capital allocation' },
        companyB: { name: 'Industry Average', value: '14.0%', note: 'Traditional jewellers hold idle inventory' },
        importance: 'High ROCE allows Titan to open 150+ new stores every year using internal cash.'
      },
      {
        metric: 'CaratLane Omni-Channel Scale',
        unit: '₹ Cr Revenue',
        companyA: { name: 'Titan (CaratLane)', value: '₹3,200+ Cr', note: 'Rapid online/offline everyday jewellery leader' },
        companyB: { name: 'Online Competitors', value: '₹450 Cr', note: 'Titan holds clear market supremacy' },
        importance: 'Dominates the millennial and Gen-Z gifting segment.'
      }
    ],
    strategicInsights: [
      {
        title: 'GST & Mandatory Hallmarking Tailwinds',
        description: 'Government regulations mandating 100% HUID hallmarking and digital GST compliance make it impossible for unorganized jewellers to evade taxes, giving Tanishq an accelerating level playing field.',
        icon: 'ShieldCheck'
      },
      {
        title: 'High Wedding Ticket Sizes',
        description: 'Indian weddings are culturally recession-proof. The average wedding jewellery basket at Tanishq exceeds ₹3.5–5 Lakhs, generating predictable seasonal cash flows in Q3/Q4 every year.',
        icon: 'Sparkles'
      }
    ],
    keyLessons: [
      'The biggest compounding returns in emerging markets occur when a trusted corporate brand formalizes an unorganized, fragmented traditional industry.',
      'Check inventory turnover: Efficient inventory hedging separates great jewellery businesses from speculative gold traders.'
    ],
    investorChecklist: [
      'Are Same-Store-Sales-Growth (SSSG) numbers consistently above 12–15%?',
      'Is the studded (diamond/gemstone) jewellery ratio expanding (higher margins)?',
      'Are international Tanishq store openings in Dubai and USA profitable?'
    ],
    pitfallsToAvoid: [
      'Confusing jewellery retailers with gold commodity funds: Titan earns money on retail craftsmanship and design margins, not gold price speculation.',
      'Overpaying when stock trades at extreme historical P/E multiples (>90x).'
    ],
    verdictSummary: 'Titan is a masterclass in how brand trust, operational excellence, and formalization tailwinds created one of the greatest multi-bagger wealth creators on Dalal Street.'
  }
];

import { Lesson, Badge } from '../types';

export const INITIAL_LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'The Stock Market Playground: What is a Share & Equity?',
    tagline: 'From owning a fraction of your favorite brands to understanding the Dalal Street ecosystem',
    category: 'Stock Basics',
    readTime: '6 min read',
    xpReward: 120,
    iconName: 'Building2',
    summary: 'Discover how companies raise public capital, how demat accounts work, and why owning shares makes you a legal co-owner of India\'s largest enterprises.',
    sections: [
      {
        heading: 'What is Dalal Street, the NSE, and Public Equity?',
        content: `When a private business wants to expand—such as building new electric vehicle gigafactories, launching 5G telecom towers, or opening 500 new retail outlets—it requires massive capital (hundreds or thousands of Crores). Instead of taking expensive bank loans with high interest rates, the company goes through an **Initial Public Offering (IPO)**.\n\nIn an IPO, the company divides its total ownership into millions of equal units called **Shares (or Equity)** and offers them to the public on organized electronic exchanges:\n- **NSE (National Stock Exchange):** India's premier high-tech electronic stock exchange in Mumbai, home to the benchmark **NIFTY 50** index.\n- **BSE (Bombay Stock Exchange):** Asia's oldest stock exchange on Dalal Street, founded in 1875, home to the **SENSEX** index.\n\nWhen you buy 1 share of Tata Motors, Reliance Industries, or Zomato, you become a legal **Shareholder** (co-owner) entitled to vote on major corporate resolutions, receive dividends, and participate in the company's future economic growth.`,
        exampleBox: {
          title: 'The 8-Slice Gourmet Pizza Analogy 🍕',
          description: 'Imagine you and 7 friends want to start a gourmet snack stall at school. It costs ₹8,000 to buy the ingredients, oven, and branding. Each friend contributes ₹1,000 and receives 1 slice (1 share out of 8 total shares).',
          analogy: 'If the stall generates ₹4,000 in net profit at year-end, each slice is entitled to ₹500 in earnings (EPS = ₹500). If the brand becomes wildly famous and opens stalls across 10 schools, outside buyers might offer you ₹3,500 for your single slice—giving you a 250% capital gain!'
        }
      },
      {
        heading: 'The Dual Engines of Stock Market Wealth: Capital Gains & Dividends',
        content: `As an equity investor, your wealth compounds through two distinct mechanisms:\n\n1. **Capital Appreciation (Price Growth):**\nAs the company sells more products, expands into global markets, and grows its quarterly profits, the intrinsic value of each share rises. If you purchased Infosys at ₹1,200 and it rises to ₹1,800 due to strong software export demand, you gain ₹600 per share in capital gains.\n\n2. **Dividends (Direct Cash Flow):**\nWhen mature, cash-rich companies generate huge profits after funding all their operations, the Board of Directors frequently declares a cash **Dividend**. This money is credited directly into your bank account on a per-share basis (e.g., ITC or TCS paying ₹15 per share every quarter).\n\n3. **Corporate Actions (Bonus Shares & Stock Splits):**\nCompanies sometimes reward long-term holders by issuing bonus shares (e.g., a 1:1 bonus gives you 1 extra free share for every share you hold) or stock splits (reducing nominal share price to improve trading liquidity for everyday investors).`
      },
      {
        heading: 'Demat Accounts, Depositories (NSDL / CDSL) & SEBI Protection',
        content: `In the 1990s, trading involved physical paper share certificates that took weeks to courier and were vulnerable to theft or forgery. Today, the Indian stock ecosystem is 100% digital and among the safest in the world:\n- **Demat Account (Dematerialized Account):** An electronic vault that holds your shares digitally, managed by government-regulated depositories (NSDL or CDSL).\n- **Trading Account:** The interface provided by your SEBI-registered broker (like Zerodha, Groww, or Angel One) to execute buy and sell orders.\n- **SEBI (Securities & Exchange Board of India):** The statutory financial watchdog that protects retail investors, enforces transparency, monitors insider trading, and ensures fair market practices.`
      }
    ],
    keyTakeaways: [
      'A share is legal fractional ownership in a real-world operating enterprise.',
      'NSE and BSE are electronic exchanges; NSDL and CDSL securely custody your digital shares in Demat form.',
      'Investors profit via Capital Appreciation (share price rises) and Dividends (cash profit distributions).',
      'SEBI strictly regulates brokers and listed companies to protect retail investors from fraud.'
    ],
    quiz: {
      question: 'If you purchase 100 shares of an Indian blue-chip company on the NSE, what rights and financial benefits do you officially hold?',
      options: [
        {
          id: 'opt-1',
          text: 'Fractional ownership, entitlement to corporate dividends, and capital growth as the business expands',
          isCorrect: true,
          explanation: 'Correct! Holding shares makes you a registered shareholder entitled to profits, dividend payouts, and long-term business value creation.'
        },
        {
          id: 'opt-2',
          text: 'A guaranteed fixed monthly salary regardless of company profitability',
          isCorrect: false,
          explanation: 'Stocks do not pay guaranteed salaries; returns depend on company performance and market price appreciation.'
        },
        {
          id: 'opt-3',
          text: 'An obligation to work 40 hours a week at the company\'s nearest corporate office',
          isCorrect: false,
          explanation: 'Shareholders are financial owners/investors, not operational employees.'
        },
        {
          id: 'opt-4',
          text: 'A high-interest loan agreement where the company must return your money with guaranteed interest',
          isCorrect: false,
          explanation: 'That describes corporate bonds/debt, not equity shares!'
        }
      ]
    }
  },
  {
    id: 'lesson-2',
    title: 'Decoding Valuation: P/E Ratio, EPS, P/B & The PEG Ratio',
    tagline: 'Never buy a stock just because the share price looks small—master fundamental valuation',
    category: 'Valuation & Fundamentals',
    readTime: '7 min read',
    xpReward: 150,
    iconName: 'Calculator',
    summary: 'Learn why a ₹50 stock can be dangerously overvalued while a ₹3,000 stock can be an attractive bargain using key fundamental ratios.',
    sections: [
      {
        heading: 'The Rookie Trap: Nominal Share Price vs Valuation',
        content: `One of the most common mistakes new investors make is assuming that a stock trading at ₹30 is "cheap" and a stock trading at ₹3,500 is "expensive." \n\nShare price alone tells you **nothing** about valuation because every company has a different number of total shares outstanding!\n- Company A might have 100 Crore shares priced at ₹30 (Total Market Value = ₹3,000 Crores).\n- Company B might have 1 Crore shares priced at ₹3,000 (Total Market Value = ₹3,000 Crores).\n\nBoth companies are valued at exactly ₹3,000 Crores. To determine whether you are getting good value for your money, you must examine **valuation ratios** that compare the stock price to the company's real profits.`
      },
      {
        heading: 'The Holy Grail: P/E Ratio (Price-to-Earnings)',
        content: `The Price-to-Earnings (P/E) ratio tells you how many rupees investors are willing to pay today for every ₹1 of annual profit the company generates.\n\n$$\\text{Earnings Per Share (EPS)} = \\frac{\\text{Total Net Annual Profit}}{\\text{Total Number of Shares}}$$\n\n$$\\text{P/E Ratio} = \\frac{\\text{Current Market Price}}{\\text{Earnings Per Share (EPS)}}$$\n\n- **Low P/E (e.g., 8–18x):** Common in mature, steady cash-cow industries (like PSU banks, power utilities, or energy companies). They offer stability and high dividend yields.\n- **High P/E (e.g., 45–90x):** Common in high-growth companies (like quick-commerce, specialty chemicals, or EV auto). Investors pay a premium today expecting profits to triple over the next few years.`,
        exampleBox: {
          title: 'The Lemonade Stand Valuation Test 🍋',
          description: 'Stand Alpha costs ₹1,000 to buy and produces ₹100 in yearly net profit (P/E = 10x). Stand Beta costs ₹1,000 to buy and produces only ₹10 in yearly net profit (P/E = 100x).',
          analogy: 'Stand Alpha returns your entire initial investment in just 10 years of earnings, whereas Stand Beta requires 100 years! Stand Alpha provides 10 times more earning power per rupee invested.'
        }
      },
      {
        heading: 'Advanced Fundamental Arsenal: P/B, RoE & The PEG Ratio',
        content: `Sophisticated investors combine P/E with several companion metrics to verify company quality:\n\n1. **Price-to-Book (P/B) Ratio:** Compares share price to the company's Net Asset Value (Book Value). Essential for analyzing banks and NBFCs (like HDFC Bank or SBI).\n2. **Return on Equity (RoE):** Measures how efficiently management generates profit from shareholders' invested capital. An RoE consistently above **15% to 20%** indicates a wide economic moat.\n3. **The PEG Ratio (Price/Earnings-to-Growth):** Developed by legendary investor Peter Lynch:\n$$\\text{PEG Ratio} = \\frac{\\text{P/E Ratio}}{\\text{Annual EPS Growth Rate (\\%)}}$$\n- $\\text{PEG} < 1.0$: Undervalued relative to its rapid earnings growth (Strong Buy territory).\n- $\\text{PEG} = 1.0$: Fairly valued.\n- $\\text{PEG} > 2.0$: Growth expectations may already be overheated.`
      }
    ],
    keyTakeaways: [
      'Nominal share price is arbitrary; always evaluate Price relative to Earnings (P/E) and Book Value (P/B).',
      'P/E = Current Share Price ÷ EPS (Earnings Per Share).',
      'Compare a company\'s P/E against its historical 5-year median and its Industry Sector average.',
      'The PEG ratio (P/E divided by growth rate) prevents you from overpaying for stagnant companies.'
    ],
    quiz: {
      question: 'Stock Alpha trades at ₹400 with an EPS of ₹40 (P/E = 10) growing profits at 15% annually. Stock Beta trades at ₹40 with an EPS of ₹0.20 (P/E = 200) growing profits at 10% annually. Which stock is fundamentally cheaper?',
      options: [
        {
          id: 'opt-1',
          text: 'Stock Beta because ₹40 is a smaller number than ₹400',
          isCorrect: false,
          explanation: 'Nominal price is an optical illusion! Stock Beta requires paying 200 rupees for each 1 rupee of profit.'
        },
        {
          id: 'opt-2',
          text: 'Stock Alpha because its P/E ratio is 10x and PEG ratio is 0.67 (< 1.0), giving superior earnings yield',
          isCorrect: true,
          explanation: 'Excellent! Stock Alpha delivers 10% annual earnings yield (40/400) with a PEG of 0.67, making it a classic undervalued growth pick.'
        },
        {
          id: 'opt-3',
          text: 'Both stocks are identically valued because they trade on the same stock exchange',
          isCorrect: false,
          explanation: 'Valuation is specific to each individual company\'s balance sheet and earnings report.'
        },
        {
          id: 'opt-4',
          text: 'Neither, because P/E ratios are only applicable to government bonds',
          isCorrect: false,
          explanation: 'P/E is the primary equity valuation metric used worldwide for public companies.'
        }
      ]
    }
  },
  {
    id: 'lesson-3',
    title: '52-Week High & Low: Navigating Market Momentum & Cycles',
    tagline: 'Understanding price boundaries, institutional volume breakouts, and value hunting',
    category: 'Technical & Momentum',
    readTime: '6 min read',
    xpReward: 120,
    iconName: 'TrendingUp',
    summary: 'Decipher what the annual 52-week price corridor tells you about investor optimism, institutional accumulation, and cyclical market reversals.',
    sections: [
      {
        heading: 'What Does the 52-Week Range Really Tell You?',
        content: `The 52-Week Range records the absolute highest and lowest prices at which a stock traded during the past 365 trading days. It provides a visual snapshot of the stock's annual trend corridor:\n- **52-Week High:** The pinnacle of buyer optimism, institutional buying power, and peak earnings sentiment.\n- **52-Week Low:** The trough of market pessimism, temporary industry headwinds, or broad macro corrections.\n\nRather than viewing these as random numbers, professional fund managers analyze where a stock sits within this corridor (e.g., trading in the upper 80th percentile or testing the 52-week floor).`
      },
      {
        heading: 'The 52-Week Breakout Strategy: Why New Highs Create Newer Highs',
        content: `A common rookie misconception is: *"If a stock is at its 52-Week High, it has gone up too much and must fall."* In reality, empirical market studies show that stocks hitting fresh 52-week highs with heavy trading volume often continue outperforming the broader market for months!\n\n**Why does this happen?**\n1. **Zero Overhead Resistance:** When a stock hits an all-time or 52-week high, **every single investor who owns the stock is in profit**. There are no trapped sellers eager to sell at break-even!\n2. **Institutional Accumulation:** Massive domestic mutual funds (DIIs) and foreign institutional investors (FIIs) only build massive multi-thousand-Crore positions in companies with accelerating quarterly earnings growth, driving sustained multi-month upward trends.`
      },
      {
        heading: 'Value Hunting at 52-Week Lows: Bargains vs "Value Traps"',
        content: `Buying near the 52-week low can be immensely profitable—but only if you know how to distinguish between a **Temporary Discount** and a **Value Trap**:\n- **The Golden Opportunity:** A market-leading blue chip (like HDFC Bank or TCS) drops toward its 52-week low due to temporary global panic or macro interest rate hikes, while its revenue and balance sheet remain rock-solid. This is Warren Buffett's favorite buying scenario.\n- **The Value Trap:** A company whose share price dropped 60% because its debt is exploding, its management is involved in scandals, or its core product is being made obsolete by newer technology. Cheap stocks can always get 80% cheaper if fundamentals are deteriorating!`
      }
    ],
    keyTakeaways: [
      '52-week High/Low outlines the annual trading channel and sentiment boundaries.',
      'High-volume 52-week breakouts signal strong institutional buying and zero trapped overhead supply.',
      'When hunting for discounts near 52-week lows, verify that quarterly profits and return on equity (RoE) are intact.',
      'Never catch a falling knife in companies with rising debt and declining sales.'
    ],
    quiz: {
      question: 'A top-tier Indian company with record quarterly profits and zero debt drops near its 52-week low solely due to an overseas geopolitical panic. How should a disciplined fundamental investor evaluate this scenario?',
      options: [
        {
          id: 'opt-1',
          text: 'As a high-probability discount opportunity to accumulate a high-quality business on sale',
          isCorrect: true,
          explanation: 'Spot on! High fundamental quality combined with temporary market-wide panic creates classic asymmetric risk-reward value opportunities.'
        },
        {
          id: 'opt-2',
          text: 'Panic-sell all shares immediately because stock prices never recover once they touch 52-week lows',
          isCorrect: false,
          explanation: 'Panic selling locks in temporary paper drawdowns and misses the inevitable fundamental rebound.'
        },
        {
          id: 'opt-3',
          text: 'Assume the company is going bankrupt despite having zero debt and record profits',
          isCorrect: false,
          explanation: 'Share price movements in the short term reflect crowd emotion; balance sheets reflect long-term reality.'
        },
        {
          id: 'opt-4',
          text: 'Borrow high-interest personal loans to gamble everything on 1-day speculative options',
          isCorrect: false,
          explanation: 'Never use leverage or gamble; invest disciplined capital systematically.'
        }
      ]
    }
  },
  {
    id: 'lesson-4',
    title: 'The Mathematical Superpower of Compounding: The 8th Wonder',
    tagline: 'Why starting as a teenager gives you a mathematical advantage that billionaires cannot buy',
    category: 'Wealth Building',
    readTime: '7 min read',
    xpReward: 150,
    iconName: 'Zap',
    summary: 'Master the exponential curve of compound interest, understand Rupee Cost Averaging, and learn how a 10% Step-Up SIP creates multi-Crore generational wealth.',
    sections: [
      {
        heading: 'The Exponential Mathematics of Compounding',
        content: `Albert Einstein famously called compound interest the **8th Wonder of the World**: *"He who understands it, earns it; he who doesn't, pays it."*\n\nIn simple linear growth, you earn interest only on your principal. In **exponential compounding**, you earn returns on your original principal PLUS all the accumulated returns from previous years:\n\n$$A = P \\left(1 + \\frac{r}{n}\\right)^{nt}$$\n\nWhere:\n- $A$ = Final Future Wealth\n- $P$ = Initial Invested Principal\n- $r$ = Annual Compound Rate of Return (e.g., 13% CAGR for Nifty 50)\n- $t$ = Time in Years\n\nNotice that **Time ($t$)** is in the exponent! That means doubling your investment duration does not merely double your money—it multiplies it by $4\\times$, $8\\times$, or $16\\times$!`,
        exampleBox: {
          title: 'The Teenager Time Superpower ⏳',
          description: 'Aarav (Age 15) starts a SIP of ₹3,000/month. He invests for just 10 years until age 25 (Total invested: ₹3.6 Lakhs) and never adds another rupee, letting it compound at 13% CAGR until retirement at age 60.',
          analogy: 'Rohan waits until age 35 to start. He invests ₹3,000/month for 25 consecutive years (Total invested: ₹9.0 Lakhs). At age 60, Aarav has over ₹3.8 CRORES, while Rohan has only ₹68 LAKHS! Starting 20 years earlier allowed Aarav to build 5.5x more wealth while investing 60% less capital!'
        }
      },
      {
        heading: 'Systematic Investment Planning (SIP) & Rupee Cost Averaging',
        content: `Trying to "time the market"—guessing the exact day the market hits a bottom or peak—is mathematically proven to fail even for Wall Street professionals. The antidote is a **Systematic Investment Plan (SIP)**.\n\nWith a SIP, a fixed sum (e.g., ₹2,000) is automatically invested on the same day every month:\n- When the market crashes by 15%, your ₹2,000 buys **MORE shares** at a bargain discount.\n- When the market is booming at record highs, your ₹2,000 buys **FEWER shares** at higher prices.\n\nThis automatic balancing is called **Rupee Cost Averaging**. Over 10–20 years, it drives down your average acquisition cost and completely eliminates the emotional stress of daily market fluctuations.`
      },
      {
        heading: 'The Turbocharger: The 10% Step-Up SIP',
        content: `As you advance in your education and career, your pocket money, internship stipends, and salary will increase each year. By enabling a **Step-Up SIP** (increasing your monthly investment by just 10% every year):\n- A basic ₹5,000/month SIP at 13% over 25 years generates **₹1.15 Crores**.\n- A 10% Step-Up SIP (starting at ₹5,000 and growing to ₹5,500 in Year 2, ₹6,050 in Year 3...) generates **₹2.87 Crores**!\n\nA minor annual lifestyle adjustment yields an extra ₹1.72 Crores in pure wealth creation.`
      }
    ],
    keyTakeaways: [
      'Time is the most critical variable in wealth creation because time sits in the exponent of compounding.',
      'Rupee Cost Averaging via monthly SIPs turns market volatility into an advantage by automatically buying more units during dips.',
      'A 10% annual Step-Up SIP can more than double your 25-year terminal wealth corpus.',
      'Starting in your teens allows your capital to complete 3 to 4 full doubling cycles before your peers even begin.'
    ],
    quiz: {
      question: 'Why does Rupee Cost Averaging in a monthly SIP outperform emotional market timing for long-term investors?',
      options: [
        {
          id: 'opt-1',
          text: 'It automatically buys more units when prices are low and fewer units when prices are high, lowering your average cost without guesswork',
          isCorrect: true,
          explanation: 'Precisely! Rupee Cost Averaging removes emotional hesitation and turns market downturns into wealth-building discount opportunities.'
        },
        {
          id: 'opt-2',
          text: 'It guarantees that the stock market will never experience a red day',
          isCorrect: false,
          explanation: 'Markets will always fluctuate; SIPs ensure you navigate those fluctuations intelligently.'
        },
        {
          id: 'opt-3',
          text: 'It completely exempts all corporate profits from ever being taxed',
          isCorrect: false,
          explanation: 'Tax laws apply to realized capital gains according to holding periods.'
        },
        {
          id: 'opt-4',
          text: 'It doubles your money in 24 hours guaranteed',
          isCorrect: false,
          explanation: 'Compounding is a multi-year snowball process, not an overnight get-rich-quick scheme.'
        }
      ]
    }
  },
  {
    id: 'lesson-5',
    title: 'Portfolio Architecture: Asset Allocation & Risk Management',
    tagline: 'How to structure your ₹10,00,000 portfolio so sudden market crashes never derail your future',
    category: 'Risk Management',
    readTime: '6 min read',
    xpReward: 140,
    iconName: 'ShieldCheck',
    summary: 'Discover how to balance offensive growth assets with defensive anchors, eliminate single-stock catastrophe risk, and master systematic rebalancing.',
    sections: [
      {
        heading: 'Systematic vs Unsystematic Risk: The Free Lunch of Diversification',
        content: `In finance, Nobel laureate Harry Markowitz proved that **Diversification is the only free lunch in investing**—it allows you to reduce risk without reducing expected returns.\n\nRisk comes in two varieties:\n1. **Unsystematic (Company/Sector-Specific) Risk:** If an airline company suffers a strike, or a pharmaceutical firm fails an FDA audit, its stock might plummet 40%. By holding 10–15 quality stocks across diverse sectors, you completely eliminate unsystematic risk!\n2. **Systematic (Market-Wide) Risk:** Macroeconomic factors like RBI interest rate hikes, inflation spikes, or global recessions that pull the entire stock market down together. This is managed through **Asset Allocation** across equities, debt, gold, and cash.`
      },
      {
        heading: 'The 4-Pillar Portfolio Blueprint for ₹10,00,000',
        content: `A resilient, high-growth portfolio allocates capital across complementary economic engines:\n\n- **1. Core Blue-Chip Titans (40% | ₹4,00,000):** Market leaders with near-monopoly moats (e.g., Reliance Industries, TCS, HDFC Bank, Larsen & Toubro). Steady compounders with proven 15%+ RoE.\n- **2. High-Growth Mid-Cap & Tech Disruptors (30% | ₹3,00,000):** Fast-expanding consumer, fintech, and renewable leaders (e.g., Zomato, Tata Motors EV, Trent, Solar giants). Higher volatility, higher alpha.\n- **3. Defensive Cash Cows & FMCG (15% | ₹1,50,000):** Recession-proof daily consumption staples (ITC, Nestle India, Asian Paints). They continue generating cash even during brutal economic winters.\n- **4. Liquid Cash & Sovereign Debt/Gold (15% | ₹1,50,000):** Dry powder held in liquid overnight funds and gold to deploy during sudden market panics when great stocks go on sale.`,
        exampleBox: {
          title: 'The Samosa Basket Analogy 🧺',
          description: 'If you carry 20 fresh samosas in a single thin paper bag and the handle tears, every single samosa is ruined on the street.',
          analogy: 'If you distribute them across 4 sturdy insulated containers, even if one container slips, you still have 15 hot samosas intact. Never let a single bad corporate report destroy your total net worth!'
        }
      },
      {
        heading: 'Portfolio Rebalancing: The Disciplined Secret to Buying Low and Selling High',
        content: `Over time, top-performing stocks will grow to represent a larger percentage of your portfolio than intended (e.g., your tech allocation balloons from 20% to 45%).\n\n**Annual Rebalancing:**\n1. Review your target percentages once a year.\n2. Trim portions of the asset class that has skyrocketed to lock in profits at high valuations.\n3. Reallocate those gains into undervalued, quality sectors that lagged behind.\n\nThis forces you mathematically to execute the golden rule of investing: **Sell High, Buy Low**, completely bypassing human emotion!`
      }
    ],
    keyTakeaways: [
      'Diversification eliminates company-specific unsystematic risk without sacrificing long-term returns.',
      'Structure your capital across Core Blue-Chips, Growth Disruptors, Defensive Staples, and Liquid Cash.',
      'Never allocate more than 10% to 15% of your total net worth into any single individual company.',
      'Rebalance your portfolio annually to lock in profits from overheated winners and buy undervalued quality assets.'
    ],
    quiz: {
      question: 'Which of the following portfolio allocations demonstrates the highest level of risk-adjusted diversification for a growth investor?',
      options: [
        {
          id: 'opt-1',
          text: '100% invested in a single hot penny stock trending on social media',
          isCorrect: false,
          explanation: 'This carries extreme catastrophic risk of complete capital wipeout.'
        },
        {
          id: 'opt-2',
          text: 'Invested across 12 high-quality companies spanning Banking, IT, Auto, FMCG, Healthcare, and Energy, backed by 15% liquid buffer',
          isCorrect: true,
          explanation: 'Perfect! This architecture captures broad economic growth while insulating you against shocks in any single company or sector.'
        },
        {
          id: 'opt-3',
          text: 'Invested in 6 different companies that all operate purely as regional airline carriers',
          isCorrect: false,
          explanation: 'Even though you hold 6 companies, they share identical sector risks (aviation fuel prices, airport fees, travel recessions).'
        },
        {
          id: 'opt-4',
          text: 'Keeping 100% in physical cash under a mattress for 40 years',
          isCorrect: false,
          explanation: 'Physical cash suffers from severe purchasing power destruction due to annual inflation.'
        }
      ]
    }
  },
  {
    id: 'lesson-6',
    title: 'Reading Candlestick Charts & Price Action Dynamics',
    tagline: 'Decipher the 4 key price points inside every candle: Open, High, Low, and Close',
    category: 'Technical Analysis',
    readTime: '6 min read',
    xpReward: 130,
    iconName: 'BarChart2',
    summary: 'Master the anatomy of Japanese candlesticks, identify critical reversal patterns, and learn why trading volume is the ultimate truth teller.',
    sections: [
      {
        heading: 'The Anatomy of a Japanese Candlestick',
        content: `Originating with 18th-century Japanese rice trader Munehisa Homma, candlestick charts are the standard visual language used across global financial trading desks.\n\nEvery candle captures the battle between **Bulls (Buyers)** and **Bears (Sellers)** over a selected timeframe (1 Minute, 1 Hour, or 1 Day) through 4 critical coordinates:\n\n1. **Open (O):** The price at which the very first trade executed when the time period began.\n2. **High (H):** The absolute highest peak price reached during the period.\n3. **Low (L):** The lowest trough price reached during the period.\n4. **Close (C):** The final price when the period ended.\n\n- **Green Candle (Bullish):** $\\text{Close} > \\text{Open}$. Buyers drove the price up and won the session.\n- **Red Candle (Bearish):** $\\text{Close} < \\text{Open}$. Sellers overpowered buyers and forced the price down.\n- **Wicks / Shadows:** The thin lines sticking out above and below the solid rectangular body, marking the extreme price rejection zones.`
      },
      {
        heading: 'Crucial Candlestick Signposts: Hammers, Stars & Dojis',
        content: `Specific candle formations tell you when market momentum is exhausting and about to reverse:\n\n- **The Hammer 🔨 (Bullish Reversal):** Found at the bottom of a downtrend. It features a small body at the top and a long lower shadow (at least 2x the body length). It reveals that bears tried to crash the stock, but massive buyer demand stepped in and pushed the price back to the top before the closing bell.\n- **The Shooting Star 🌠 (Bearish Reversal):** Found at the top of an uptrend. Features a long upper shadow showing buyers pushed to new highs, but heavy institutional selling slammed the price down before close.\n- **The Doji ➕ (Indecision):** Open and Close are virtually identical. Neither bulls nor bears have control; watch for the next candle's breakout direction.`,
        exampleBox: {
          title: 'The Dalal Street Tug of War 🟢 🔴',
          description: 'Think of a trading session as an intense tug-of-war match between 10,000 buyers pulling green and 10,000 sellers pulling red.',
          analogy: 'A solid green candle with almost no upper wick means buyers completely dominated the entire day from the 9:15 AM opening bell straight to the 3:30 PM close! A long upper wick indicates sellers counter-attacked and pushed buyers backward.'
        }
      },
      {
        heading: 'The Golden Rule: Volume Confirms Price Action',
        content: `A candlestick without volume is like a car without an engine. \n\n- **High Volume Breakout:** If a stock breaks above its resistance level with **3x its normal daily volume**, it proves that massive mutual funds and institutional algorithms are buying aggressively. The move has strong conviction.\n- **Low Volume Drift:** If a stock rises on tiny, weak volume, the move is fragile and prone to sudden false breakouts.`
      }
    ],
    keyTakeaways: [
      'A candlestick shows Open, High, Low, and Close (OHLC) in a single intuitive bar.',
      'Green bodies indicate buyers won the session; red bodies indicate sellers won.',
      'Long lower wicks (Hammer patterns) signify strong buying support at key floor levels.',
      'Always check trading volume; institutional participation confirms valid breakout trends.'
    ],
    quiz: {
      question: 'During a trading day, a stock opens at ₹500, plunges to an intraday low of ₹460, but then surges back to close at ₹505 with massive trading volume, forming a Hammer candlestick. What does this indicate?',
      options: [
        {
          id: 'opt-1',
          text: 'Bears attempted to crash the price, but aggressive institutional buyers absorbed all selling pressure and took full control',
          isCorrect: true,
          explanation: 'Exact! The long lower wick proves intense rejection of lower prices and strong bullish buying demand.'
        },
        {
          id: 'opt-2',
          text: 'The exchange experienced a server outage and all trades were cancelled',
          isCorrect: false,
          explanation: 'A hammer is standard price action reflecting market supply and demand.'
        },
        {
          id: 'opt-3',
          text: 'The company is terminating its operations immediately',
          isCorrect: false,
          explanation: 'Price action reflects daily trading sentiment, not company dissolution.'
        },
        {
          id: 'opt-4',
          text: 'Sellers dominated the entire session from start to finish',
          isCorrect: false,
          explanation: 'If sellers had dominated, the candle would have closed near its low (₹460) as a large red body.'
        }
      ]
    }
  },
  {
    id: 'lesson-7',
    title: 'Order Types, Liquidity & Trade Execution Strategies',
    tagline: 'Never overpay for shares by mastering Market, Limit, and Stop-Loss orders',
    category: 'Trading Skills',
    readTime: '5 min read',
    xpReward: 110,
    iconName: 'Layers',
    summary: 'Learn how live order books match buyers and sellers, how to use Limit orders to avoid slippage, and how Stop-Loss orders protect your trading capital.',
    sections: [
      {
        heading: 'How the Electronic Order Book Matches Trades',
        content: `When you trade on the NSE, you are interacting with a live **Limit Order Book** that matches buyers (Bids) and sellers (Asks) in milliseconds:\n- **Bid (Buy Orders):** The highest price buyers are willing to pay right now.\n- **Ask (Sell Orders):** The lowest price sellers are willing to accept right now.\n- **Bid-Ask Spread:** The difference between the highest bid and lowest ask. In highly liquid mega-caps like Reliance or TCS, the spread is just 5 paise (₹0.05). In illiquid small-caps, the spread can be ₹2.00 or more!`
      },
      {
        heading: 'Market Order vs Limit Order: Which Should You Use?',
        content: `1. **Market Order:**\n- Executes **instantly** at the best available current market price.\n- *Advantage:* Guaranteed immediate execution.\n- *Risk:* During fast-moving market open (9:15 AM) or high volatility, your order may execute at a worse price than what you saw on screen (known as **Slippage**).\n\n2. **Limit Order:**\n- You specify the **exact maximum price** you are willing to pay (for buy orders) or minimum price (for sell orders).\n- *Example:* If TCS is at ₹3,920, you place a Limit Buy at ₹3,900. Your order will ONLY execute if the market dips to ₹3,900 or lower. If the price never touches ₹3,900, the trade does not occur.\n- *Advantage:* Total price control. No bad surprises.`,
        exampleBox: {
          title: 'The Mandi Auction Analogy 🍅',
          description: 'A Market Order is like shouting at a wholesale vegetable market: "Give me 50 kg of tomatoes right now at whatever price the seller wants!" You get the tomatoes instantly, but you might pay top rupee.',
          analogy: 'A Limit Order is saying: "I will buy 50 kg of tomatoes only if the vendor drops the price to ₹35/kg or lower. Otherwise, I will keep my money in my pocket."'
        }
      },
      {
        heading: 'The Investor Safety Belt: Stop-Loss (SL) & Position Sizing',
        content: `A **Stop-Loss (SL)** order is an automated order placed with your broker to exit a position if the price falls to a predetermined threshold.\n\n**The 1% Capital Risk Rule:**\nNever risk losing more than 1% of your total portfolio on any single trade!\n- Total Capital: ₹10,00,000 (1% Risk = ₹10,000 maximum loss per trade).\n- If you buy a stock at ₹1,000 and set your Stop-Loss at ₹950 (Risk per share = ₹50):\n$$\\text{Position Size} = \\frac{\\text{Total Risk Allowed (₹10,000)}}{\\text{Risk Per Share (₹50)}} = 200 \\text{ shares}$$\n\nIf the trade fails and hits your stop-loss, you lose only ₹10,000 (1% of your portfolio), leaving 99% of your capital completely intact to trade another day!`
      }
    ],
    keyTakeaways: [
      'Market Orders prioritize immediate speed; Limit Orders prioritize exact price control.',
      'Always use Limit Orders in volatile market sessions to avoid expensive price slippage.',
      'A Stop-Loss order automates discipline and cuts losing trades before they turn into major disasters.',
      'Size your positions so that a triggered stop-loss never costs more than 1% to 2% of your total trading capital.'
    ],
    quiz: {
      question: 'You want to buy shares of Reliance (currently trading at ₹2,950), but your fundamental analysis suggests a fair entry only if it pulls back to ₹2,900. What order type should you place on your terminal?',
      options: [
        {
          id: 'opt-1',
          text: 'A Limit Buy order set at ₹2,900',
          isCorrect: true,
          explanation: 'Correct! The broker holds your Limit Order in the system and executes it only if sellers offer shares at ₹2,900 or lower.'
        },
        {
          id: 'opt-2',
          text: 'A Market Order immediately at 9:15 AM',
          isCorrect: false,
          explanation: 'A Market Order will execute instantly at the current price of ₹2,950, ignoring your desired ₹2,900 entry.'
        },
        {
          id: 'opt-3',
          text: 'A complaint ticket to SEBI requesting a price reduction',
          isCorrect: false,
          explanation: 'Regulators oversee market fairness; they do not set prices for individual transactions!'
        },
        {
          id: 'opt-4',
          text: 'Cancel your demat account entirely',
          isCorrect: false,
          explanation: 'Limit orders are the standard tool built specifically for this purpose.'
        }
      ]
    }
  },
  {
    id: 'lesson-8',
    title: 'The Rule of 72, Inflation & Real Purchasing Power',
    tagline: 'The rapid mental math formula to calculate doubling time and beat the silent wealth destroyer',
    category: 'Wealth Building',
    readTime: '5 min read',
    xpReward: 120,
    iconName: 'Clock',
    summary: 'Master the Rule of 72 mental shortcut, understand why inflation silently erodes bank savings, and learn how real post-tax returns dictate your financial freedom.',
    sections: [
      {
        heading: 'What is the Rule of 72?',
        content: `The **Rule of 72** is a famous mathematical shortcut used by bankers and fund managers to quickly calculate how many years it takes for an investment to double at a given constant annual rate of return:\n\n$$\\text{Years to Double} \\approx \\frac{72}{\\text{Annual Rate of Return (\\%)}}$$\n\n- **Fixed Deposit @ 6% p.a.:** $72 \\div 6 = 12 \\text{ years}$ to double your money.\n- **Balanced Mutual Fund @ 9% p.a.:** $72 \\div 9 = 8 \\text{ years}$ to double.\n- **Nifty 50 Index Equity @ 12% p.a.:** $72 \\div 12 = 6 \\text{ years}$ to double.\n- **High-Alpha Growth Stocks @ 18% p.a.:** $72 \\div 18 = 4 \\text{ years}$ to double!`
      },
      {
        heading: 'Inflation: The Silent Wealth Destroyer',
        content: `If you leave ₹1,00,000 in a savings bank account earning 3% interest while consumer inflation is running at 6%, you are not growing wealth—**your purchasing power is shrinking by 3% every single year!**\n\n$$\\text{Real Return} = \\text{Nominal Investment Return} - \\text{Inflation Rate} - \\text{Taxes}$$\n\n- In 2004, a cinema ticket cost ₹50 and a movie popcorn cost ₹30.\n- In 2024, that same ticket costs ₹300 and popcorn costs ₹250.\n\nTo build real long-term wealth, your investments MUST generate returns well above India's historical inflation rate (5%–7%). Equities remain the primary asset class with a proven historical track record of beating inflation over multi-decade periods.`,
        exampleBox: {
          title: 'The Rule of 72 in Reverse (Inflation Half-Life) 📉',
          description: 'The Rule of 72 works in reverse for inflation! Divide 72 by the inflation rate to find out how quickly your money\'s buying power will be cut in half.',
          analogy: 'At 6% annual inflation: $72 \\div 6 = 12 \\text{ years}$. If you hide ₹10 Lakhs in cash under a mattress today, in just 12 years it will buy only what ₹5 Lakhs buys today!'
        }
      }
    ],
    keyTakeaways: [
      'Divide 72 by your annual interest rate to instantly calculate the years required for your money to double.',
      'Nominal returns are an illusion; always calculate Real Returns after deducting inflation and taxes.',
      'Bank savings accounts (3%) and standard FDs (6-7%) barely keep pace with real lifestyle inflation.',
      'Equities provide the necessary growth engine (12-14% CAGR) to generate true positive real wealth compounding.'
    ],
    quiz: {
      question: 'If you invest ₹50,000 in an Indian diversified equity mutual fund that delivers a 12% average annual return, approximately how many years will it take for your investment to double into ₹1,00,000?',
      options: [
        {
          id: 'opt-1',
          text: '6 years (72 ÷ 12 = 6)',
          isCorrect: true,
          explanation: 'Spot on! According to the Rule of 72: 72 ÷ 12% = 6 years to double your initial ₹50,000 into ₹1,00,000.'
        },
        {
          id: 'opt-2',
          text: '18 years',
          isCorrect: false,
          explanation: 'At 12% return, 18 years would allow your capital to complete 3 full doubling cycles (growing to ₹4,00,000)!'
        },
        {
          id: 'opt-3',
          text: '12 years',
          isCorrect: false,
          explanation: '12 years is the doubling time for a 6% return, not a 12% return.'
        },
        {
          id: 'opt-4',
          text: '50 years',
          isCorrect: false,
          explanation: 'Compounding accelerates far faster than that!'
        }
      ]
    }
  },
  {
    id: 'lesson-9',
    title: 'Financial Statements 101: Balance Sheet, P&L & Cash Flow',
    tagline: 'Learn how to read a company\'s financial health report like a professional forensic analyst',
    category: 'Valuation & Fundamentals',
    readTime: '7 min read',
    xpReward: 160,
    iconName: 'Calculator',
    summary: 'Demystify the 3 core corporate financial statements, understand the difference between accounting profit and real cash, and spot debt warning signs.',
    sections: [
      {
        heading: 'The 3 Pillars of Corporate Accounting',
        content: `Every listed company in India is required by SEBI to publish audited financial reports every quarter (Q1, Q2, Q3, Q4) and an Annual Report. \n\nTo truly understand a business, you must examine all 3 interconnected statements:\n1. **The Profit & Loss Statement (P&L):** The video recording of operations over the past quarter/year.\n2. **The Balance Sheet:** The static snapshot of financial health on a specific day.\n3. **The Cash Flow Statement:** The movement of physical cold hard cash entering and exiting the company's bank accounts.`
      },
      {
        heading: 'Deconstructing the P&L (Income Statement)',
        content: `The P&L tracks how top-line sales transform into bottom-line net profit:\n- **Revenue / Topline:** Total money received from selling goods or services.\n- **COGS (Cost of Goods Sold):** Raw material and manufacturing costs.\n- **Gross Profit:** $\\text{Revenue} - \\text{COGS}$.\n- **EBITDA:** *Earnings Before Interest, Taxes, Depreciation, and Amortization*. Measures pure core operational efficiency.\n- **PAT (Profit After Tax) / Net Profit / Bottomline:** The final profit remaining for shareholders after all expenses, interest on debt, and government taxes are paid.`
      },
      {
        heading: 'Balance Sheet & Cash Flow: Why "Cash is King"',
        content: `A company can show strong net profits on paper while secretly heading toward bankruptcy if its customers haven't actually paid their bills!\n\n$$\\text{Total Assets} = \\text{Total Liabilities} + \\text{Shareholders\' Equity}$$\n\n- **Operating Cash Flow (OCF):** Real cash generated from core customer sales. If a company's Net Profit is rising but its Operating Cash Flow is persistently negative, beware of aggressive accounting gimmicks or unpaid receivables!\n- **Free Cash Flow (FCF):** $\\text{Operating Cash Flow} - \\text{Capital Expenditures (CapEx)}$. FCF is the surplus cash available to pay dividends, buy back shares, or acquire competitors.`,
        exampleBox: {
          title: 'The Bakery Ledger Analogy 🍞',
          description: 'A baker sells 1,000 cakes for ₹1,00,000. He records ₹40,000 net profit on his P&L. However, 800 customers bought on credit and haven\'t paid yet.',
          analogy: 'On paper, the baker is profitable. In reality, he has only ₹20,000 cash in the register and cannot pay his flour suppliers or electric bill next week! Always verify that Operating Cash Flow matches Net Profit.'
        }
      }
    ],
    keyTakeaways: [
      'The P&L shows operational profitability; the Balance Sheet shows assets and debts; the Cash Flow Statement shows real liquidity.',
      'EBITDA measures core business profitability before interest and non-cash depreciation charges.',
      'Always compare Net Profit with Operating Cash Flow (OCF) to verify quality of earnings.',
      'Free Cash Flow (FCF) is the lifeblood that funds dividend payouts and future corporate expansion.'
    ],
    quiz: {
      question: 'A company reports a 30% jump in Net Profit on its P&L statement, but its Cash Flow from Operations (OCF) has been negative for 3 consecutive years while debt is surging. What should a prudent investor conclude?',
      options: [
        {
          id: 'opt-1',
          text: 'Invest immediately because higher paper net profit is the only metric that matters',
          isCorrect: false,
          explanation: 'Paper profits without real cash flow is one of the classic warning signs of impending debt distress.'
        },
        {
          id: 'opt-2',
          text: 'Exercise extreme caution; the company may have high uncollected customer receivables and liquidity distress despite paper profits',
          isCorrect: true,
          explanation: 'Excellent! Divergence between growing paper profits and negative operational cash flow often signals aggressive revenue recognition or working capital stress.'
        },
        {
          id: 'opt-3',
          text: 'Assume the Cash Flow statement was written by mistake and ignore it',
          isCorrect: false,
          explanation: 'Cash Flow is the most reliable financial statement because cash cannot be easily manipulated by accounting choices.'
        },
        {
          id: 'opt-4',
          text: 'Borrow money to buy call options on the stock',
          isCorrect: false,
          explanation: 'Never take excessive risk on companies exhibiting deteriorating cash flow quality.'
        }
      ]
    }
  },
  {
    id: 'lesson-10',
    title: 'Personal Finance Mastery: The 50/30/20 Rule & Zero-Based Budgeting',
    tagline: 'Telling your money where to go instead of wondering where it all disappeared',
    category: 'Personal Finance',
    readTime: '5 min read',
    xpReward: 120,
    iconName: 'PiggyBank',
    summary: 'Learn how to automate your savings, allocate income across Needs, Wants, and Investments, and build an impregnable emergency buffer.',
    sections: [
      {
        heading: 'Why Saving is the Launchpad of All Wealth Creation',
        content: `No matter how brilliant you are at analyzing stock charts, you cannot invest money that you have already spent on unnecessary impulse purchases. Wealth is not determined by what you earn—it is determined by **what you keep and compound**.\n\n**The Traditional (Flawed) Spending Equation:**\n$$\\text{Income} - \\text{Expenses} = \\text{Savings (Usually Zero!)}$$\n\n**The Wealth-Builder\'s Golden Rule: Pay Yourself First:**\n$$\\text{Income} - \\text{Investments} = \\text{Expenses Allowed}$$\n\nThe moment money enters your bank account, immediately route your target investment percentage into your SIP and savings before paying for any discretionary lifestyle spending!`
      },
      {
        heading: 'The 50 / 30 / 20 Framework for Smart Budgeting',
        content: `A simple, battle-tested blueprint for allocating your monthly income:\n\n- **50% for Needs (Essentials):** Groceries, rent/housing, utilities, transport, minimum loan obligations, and health insurance. These are non-negotiable living costs.\n- **30% for Wants (Lifestyle & Fun):** Dining out with friends, streaming subscriptions, weekend trips, gaming gear, and concerts. Enjoying your youth responsibly prevents burnout.\n- **20% for Savings & Investing (Wealth Engine):** Emergency fund maintenance, equity SIPs, and index funds. As your income grows, ambitious wealth builders often scale this from 20% up to 40% or 50%!`
      },
      {
        heading: 'The Impregnable Defense: The 6-Month Emergency Fund',
        content: `Before investing heavily in volatile stock markets, you must establish an **Emergency Fund** containing 3 to 6 months of basic living expenses stored in safe, liquid instruments (like high-yield savings accounts or sweep-in FDs).\n\n**Why is this critical?**\nIf unexpected medical bills or emergencies arise during a major stock market crash (like 2008 or March 2020), your Emergency Fund ensures you are never forced to sell your quality stock portfolio at bottom prices to pay for emergency bills!`,
        exampleBox: {
          title: 'Zero-Based Budgeting 🎯',
          description: 'A method where every single rupee has an assigned job before the month even begins. Income minus total allocations equals zero.',
          analogy: 'If you receive ₹20,000, you assign ₹10,000 to essentials, ₹4,000 to investments, ₹3,000 to an emergency buffer, and ₹3,000 for guilt-free fun. No rupee is left floating aimlessly to be wasted on impulse spending.'
        }
      }
    ],
    keyTakeaways: [
      'Always "Pay Yourself First" by automating investments the day money arrives in your account.',
      'Use the 50/30/20 framework as your foundational baseline for allocating income.',
      'Build a 3-6 month liquid emergency fund before aggressively buying volatile growth equities.',
      'Zero-Based Budgeting gives every rupee a mission and eliminates mindless leakage.'
    ],
    quiz: {
      question: 'According to the "Pay Yourself First" principle and the 50/30/20 rule, what should you do immediately upon receiving your monthly income or pocket allowance?',
      options: [
        {
          id: 'opt-1',
          text: 'Automatically transfer your target investment percentage (e.g. 20%+) into your savings/SIP before spending on discretionary wants',
          isCorrect: true,
          explanation: 'Spot on! Treating your future wealth like a mandatory VIP bill ensures consistent, unbroken financial compounding.'
        },
        {
          id: 'opt-2',
          text: 'Spend 90% on luxury gadgets and save whatever small loose change is left at the end of the month',
          isCorrect: false,
          explanation: 'Spending first and saving what is left almost always results in zero savings.'
        },
        {
          id: 'opt-3',
          text: 'Withdraw all cash and hide it inside a textbook',
          isCorrect: false,
          explanation: 'Physical cash suffers from inflation erosion and loses compounding potential.'
        },
        {
          id: 'opt-4',
          text: 'Gamble the entire amount on high-leverage lottery tickets',
          isCorrect: false,
          explanation: 'Speculative gambling destroys personal financial safety.'
        }
      ]
    }
  },
  {
    id: 'lesson-11',
    title: 'The Psychology of Investing: Defeating Emotional Traps',
    tagline: 'Why temperament and emotional discipline beat raw IQ on the trading floor',
    category: 'Risk Management',
    readTime: '6 min read',
    xpReward: 140,
    iconName: 'ShieldCheck',
    summary: 'Overcome FOMO, conquer loss aversion, avoid social media hype traps, and master the mental habits of the world\'s greatest investors.',
    sections: [
      {
        heading: 'Why IQ Matters Less Than Emotional Temperament',
        content: `Warren Buffett famously stated: *"Investing is not a game where the guy with the 160 IQ beats the guy with 130 IQ. Once you have ordinary intelligence, what you need is the temperament to control the urges that get other people into trouble in investing."*\n\nThe human brain evolved to survive in the wilderness, reacting to danger with **fight or flight**. In financial markets, these primitive biological instincts cause humans to buy when euphoria is at its peak (FOMO) and panic-sell at the exact moment bargains are at their best!`
      },
      {
        heading: 'The 4 Fatal Cognitive Biases in Trading',
        content: `1. **FOMO (Fear Of Missing Out):** Seeing a speculative stock jump 40% in two days and buying at the absolute peak out of jealousy and greed, just before early smart-money investors dump their shares.\n2. **Loss Aversion (Prospect Theory):** Psychological studies show the pain of losing ₹10,000 feels **twice as intense** as the joy of gaining ₹10,000. This leads investors to panic-sell great companies during normal 10% market pullbacks.\n3. **The Sunk Cost Fallacy & Disposition Effect:** Holding onto terrible, bankrupt companies because *"I can't sell until I get my money back,"* while prematurely selling winning compounders just to lock in small 5% gains.\n4. **Anchoring Bias:** Becoming obsessed with the price you originally paid for a stock (e.g. ₹500) rather than objectively evaluating what the company is worth today.`
      },
      {
        heading: 'The Investor Rulebook: Developing Ice in Your Veins',
        content: `Professional investors manage emotions by creating a written **Investment Checklist**:\n- Never buy a stock based on WhatsApp, Telegram, or YouTube tip channels.\n- Write down your thesis before buying: *Why am I buying this? What are the key business risks? At what valuation will I trim?*\n- View market crashes not as scary disasters, but as festive supermarket discount sales where high-quality Indian blue-chip businesses are put on clearance discount!`,
        exampleBox: {
          title: 'Mr. Market\'s Mood Swings 🎭',
          description: 'Benjamin Graham (Warren Buffett\'s mentor) told investors to imagine the stock market as a manic-depressive business partner named "Mr. Market".',
          analogy: 'On some days, Mr. Market is wildly euphoric and offers to buy your shares at crazy expensive prices. On other days, he is utterly depressed and offers to sell you great companies for pocket change. Your job is not to adopt his moods, but to exploit his emotional overreactions!'
        }
      }
    ],
    keyTakeaways: [
      'Market success is 80% emotional discipline and temperament, 20% intellectual knowledge.',
      'FOMO causes retail investors to buy at euphoric tops; Loss Aversion causes panic-selling at market bottoms.',
      'Never trade based on unverified social media tips or speculative gossip.',
      'Treat market downturns as rare clearance sales on premium business ownership.'
    ],
    quiz: {
      question: 'A stock has soared 80% in 5 days with zero increase in earnings, and social media influencers are hyping it with rocket emojis. What cognitive bias is most likely driving late retail investors to buy at the peak?',
      options: [
        {
          id: 'opt-1',
          text: 'FOMO (Fear Of Missing Out) and herd mentality',
          isCorrect: true,
          explanation: 'Exactly! Greed, jealousy of others\' paper gains, and social proof create artificial euphoric bubbles that inevitably correct.'
        },
        {
          id: 'opt-2',
          text: 'Disciplined discounted cash flow analysis',
          isCorrect: false,
          explanation: 'Fundamental analysis would reveal the stock is disconnected from economic reality.'
        },
        {
          id: 'opt-3',
          text: 'Strict adherence to SEBI compliance standards',
          isCorrect: false,
          explanation: 'SEBI regularly warns retail investors against speculative social media pump-and-dump schemes.'
        },
        {
          id: 'opt-4',
          text: 'Long-term dividend compounding strategy',
          isCorrect: false,
          explanation: 'Speculative 5-day rallies have nothing to do with steady dividend investing.'
        }
      ]
    }
  },
  {
    id: 'lesson-12',
    title: 'The Ultimate Guide to Carbon Credits, ESG & Green Energy',
    tagline: 'Understanding the multi-billion-dollar currency of global climate action on modern exchanges',
    category: 'Sustainability',
    readTime: '6 min read',
    xpReward: 150,
    iconName: 'Leaf',
    summary: 'Discover how carbon trading cap-and-trade programs work, why global funds demand ESG compliance, and how India\'s green energy transition creates historic investment opportunities.',
    sections: [
      {
        heading: 'What are Carbon Credits and Cap-and-Trade Systems?',
        content: `As governments worldwide commit to Net-Zero carbon emission targets under the Paris Agreement, emitting greenhouse gases (GHG) has evolved from a free environmental externality into a direct financial cost.\n\n**The Cap-and-Trade Mechanism:**\n1. Regulators set an overall emissions **Cap** (maximum tons of CO2 allowed across industries like steel, cement, power, and aviation).\n2. Regulators issue permits called **Carbon Credits**:\n$$\\text{1 Carbon Credit} = 1 \\text{ Metric Ton of } \\text{CO}_2 \\text{ emissions permitted}$$\n3. Over time, the regulator steadily decreases the total cap, making pollution permits scarcer and more expensive.\n\nCompanies that adopt green energy (solar, green hydrogen, EV fleets) and produce less emissions than their quota have **surplus credits** they can sell on environmental exchanges. Companies that pollute over their quota must buy those credits or face massive government fines!`
      },
      {
        heading: 'Carbon Credits vs Carbon Offsets',
        content: `While often used interchangeably in media, there is a technical distinction:\n- **Carbon Credits (Compliance Markets):** Legally mandated permits issued by regulatory bodies in formal cap-and-trade regimes (like the European Union ETS or India's Carbon Credit Trading Scheme - CCTS).\n- **Carbon Offsets (Voluntary Carbon Markets - VCM):** Generated by verifiable environmental projects that actively sequester or avoid carbon emissions (such as large-scale reforestation, mangrove restoration, direct air capture, or solar microgrids). Companies buy offsets voluntarily to achieve carbon-neutral branding.`,
        exampleBox: {
          title: 'The Clean Classroom Permission Slip Analogy 📜',
          description: 'Suppose a teacher gives every student 5 "Trash Slips" per month. Each slip permits throwing 1 piece of scrap paper in the bin.',
          analogy: 'Student A recycles and needs only 2 slips, leaving 3 extra slips. Student B is wasteful and produces 8 scraps. Student B must pay Student A ₹50 per slip to buy the extra slips. Student A makes a profit for being green, while Student B pays a financial penalty!'
        }
      },
      {
        heading: 'The Green Energy Revolution on Dalal Street',
        content: `India is targeting **500 GW of non-fossil energy capacity by 2030**. This monumental transition is reshaping corporate valuations:\n- **Clean Energy Titans:** Power companies transitioning to solar, wind, and pumped hydro storage (e.g., Tata Power, Adani Green).\n- **EV Ecosystem & Battery Gigafactories:** Auto giants (Tata Motors leading passenger EVs) and auto component makers producing lightweight materials and traction motors.\n- **Green Hydrogen & Ammonia:** Industrial heavyweights (Reliance Industries, L&T, NTPC) building global-scale green hydrogen electrolyzers to decarbonize steel and fertilizer manufacturing.\n- **ESG Investing (Environmental, Social, Governance):** Global sovereign wealth funds (managing over $30 Trillion) increasingly refuse to invest in dirty, non-compliant polluters, channeling massive capital into ESG leaders.`
      }
    ],
    keyTakeaways: [
      '1 Carbon Credit grants the legal right to emit 1 metric ton of CO2 equivalent.',
      'Cap-and-trade systems create a direct economic incentive for corporations to decarbonize.',
      'Compliance credits are government-mandated allowances; offsets originate from verified carbon-reduction projects.',
      'India\'s green energy infrastructure transition represents one of the largest capital expansion opportunities of the 21st century.'
    ],
    quiz: {
      question: 'Under a regulatory Cap-and-Trade program, what economic incentive does a manufacturing company have to invest in clean solar energy and reduce its factory emissions below its allocated cap?',
      options: [
        {
          id: 'opt-1',
          text: 'It can sell its unused surplus carbon credits on the open market to polluting competitors, generating a brand-new revenue stream',
          isCorrect: true,
          explanation: 'Spot on! Cap-and-trade turns sustainability into a direct profit center by allowing clean operators to monetize their saved carbon allowances.'
        },
        {
          id: 'opt-2',
          text: 'It is forced by law to shut down all operations immediately',
          isCorrect: false,
          explanation: 'Clean operators thrive in cap-and-trade markets; polluters face the financial strain.'
        },
        {
          id: 'opt-3',
          text: 'It must pay double taxes to the government for using solar power',
          isCorrect: false,
          explanation: 'Governments provide subsidies and green incentives, not penalties, for solar adoption.'
        },
        {
          id: 'opt-4',
          text: 'Carbon credits can only be converted into physical gold coins',
          isCorrect: false,
          explanation: 'Carbon credits trade electronically on financial and environmental asset markets.'
        }
      ]
    }
  }
];

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'badge-rookie',
    title: 'Dalal Street Rookie',
    description: 'Completed your first genuine learning or simulation activity',
    icon: '🌱',
    unlocked: false,
    category: 'WEALTH',
    xpReward: 50
  },
  {
    id: 'badge-first-trade',
    title: 'First Indian Shareholder',
    description: 'Successfully executed your first stock purchase on the NSE simulator',
    icon: '🎯',
    unlocked: false,
    category: 'TRADING',
    xpReward: 100
  },
  {
    id: 'badge-scholar',
    title: 'Financial Scholar',
    description: 'Completed 3 lessons in the Investor Academy with a perfect quiz score',
    icon: '🎓',
    unlocked: false,
    category: 'LEARNING',
    xpReward: 150
  },
  {
    id: 'badge-diversified',
    title: 'Portfolio Architect',
    description: 'Built a diversified portfolio holding stocks across at least 4 different sectors',
    icon: '🛡️',
    unlocked: false,
    category: 'PORTFOLIO',
    xpReward: 120
  },
  {
    id: 'badge-profit-hunter',
    title: 'Green Candle Hunter',
    description: 'Booked a profitable sell trade with positive net returns',
    icon: '📈',
    unlocked: false,
    category: 'TRADING',
    xpReward: 100
  },
  {
    id: 'badge-crorepati',
    title: 'Compounding Master',
    description: 'Used the SIP & Compounding simulator to model a 1 Crore wealth roadmap',
    icon: '💎',
    unlocked: false,
    category: 'WEALTH',
    xpReward: 80
  },
  {
    id: 'badge-mentor',
    title: 'Chanakya Disciple',
    description: 'Asked Chanakya AI Mentor for advice on stock valuation or market risk',
    icon: '🧠',
    unlocked: false,
    category: 'LEARNING',
    xpReward: 75
  },
  {
    id: 'badge-10-trades',
    title: 'Disciplined Executer',
    description: 'Completed 10 executed orders with disciplined position sizing',
    icon: '⚡',
    unlocked: false,
    category: 'TRADING',
    xpReward: 150
  },
  {
    id: 'badge-10k-profit',
    title: 'Alpha Seeker',
    description: 'Generated over ₹10,000 in net portfolio gains',
    icon: '🏆',
    unlocked: false,
    category: 'WEALTH',
    xpReward: 200
  },
  {
    id: 'badge-watchlister',
    title: 'Market Watcher',
    description: 'Tracked 5 or more companies on your personalized watchlist',
    icon: '⭐',
    unlocked: false,
    category: 'PORTFOLIO',
    xpReward: 60
  }
];

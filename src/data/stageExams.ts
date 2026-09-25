/**
 * Stage gate exams.
 *
 * The Academy listed every stage as open, so a beginner could land in the tax
 * modules on their first visit. Each stage now ends in a twenty question exam,
 * and passing it is what opens the next stage. The questions only cover
 * material the stage's own lessons teach.
 */

export interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  /** Index into `options`. */
  correctIndex: number;
  /** Shown after the exam, against the question, right or wrong. */
  explanation: string;
}

export interface StageExam {
  /** Matches a LEARNING_PATH stage id. */
  stageId: string;
  title: string;
  questions: ExamQuestion[];
}

/** Questions a learner must get right to pass, out of twenty. */
/** One submitted paper: the score and when it was submitted. */
export interface ExamAttempt {
  score: number;
  /** Epoch milliseconds. */
  at: number;
}

/** How many attempts are kept per stage, newest first. */
export const EXAM_ATTEMPT_HISTORY = 12;

export const EXAM_PASS_MARK = 14;

/** How many questions each stage exam asks. */
export const EXAM_LENGTH = 20;

const beginner: ExamQuestion[] = [
  {
    id: 'ex-b-1',
    question: 'What does owning one share of a company actually give you?',
    options: [
      'A loan repayable by the company with interest',
      'A fractional ownership stake in that business',
      'A guarantee that the price will rise',
      'A seat on the board of directors',
    ],
    correctIndex: 1,
    explanation: 'A share is a slice of ownership. You own a fraction of the business, its profits and its losses — not a loan to it.',
  },
  {
    id: 'ex-b-2',
    question: 'A company issues 8 shares in total and you hold 2. What share of the business do you own?',
    options: ['2%', '8%', '25%', '80%'],
    correctIndex: 2,
    explanation: '2 out of 8 is one quarter, so 25%. Ownership is always your shares divided by the total shares outstanding.',
  },
  {
    id: 'ex-b-3',
    question: 'Which of these is the primary market?',
    options: [
      'Buying Reliance shares from another investor on the NSE',
      'Buying shares directly from the company in its IPO',
      'Selling shares you already hold',
      'Trading index futures',
    ],
    correctIndex: 1,
    explanation: 'The primary market is where the company itself issues shares and receives the money. Everything after that is the secondary market.',
  },
  {
    id: 'ex-b-4',
    question: 'When you buy shares on the NSE from another investor, who receives your money?',
    options: ['The company', 'The seller', 'SEBI', 'The exchange'],
    correctIndex: 1,
    explanation: 'In the secondary market the money goes to the investor selling, not to the company. The company was paid once, at issue.',
  },
  {
    id: 'ex-b-5',
    question: 'What does EPS measure?',
    options: [
      'Profit earned per share outstanding',
      'The price of one share',
      'Total company revenue',
      'The dividend paid per share',
    ],
    correctIndex: 0,
    explanation: 'Earnings Per Share is net profit divided by the number of shares. It is the profit attached to each share you own.',
  },
  {
    id: 'ex-b-6',
    question: 'A share trades at ₹400 and earns ₹20 per share. What is its P/E ratio?',
    options: ['5', '20', '80', '400'],
    correctIndex: 1,
    explanation: 'P/E is price divided by earnings: 400 ÷ 20 = 20. You are paying ₹20 for each ₹1 of annual profit.',
  },
  {
    id: 'ex-b-7',
    question: 'Why is comparing the P/E of an IT company with a bank misleading?',
    options: [
      'P/E cannot be calculated for banks',
      'Different industries have structurally different growth, capital and risk profiles',
      'Banks do not report earnings',
      'IT companies never have a P/E above 10',
    ],
    correctIndex: 1,
    explanation: 'A ratio only means something against a comparable one. Sectors carry different growth rates and capital needs, so their normal P/E bands differ.',
  },
  {
    id: 'ex-b-8',
    question: 'What does the P/B ratio compare?',
    options: [
      'Price against book value, the net assets on the balance sheet',
      'Price against last year’s price',
      'Profit against borrowings',
      'Price against the dividend',
    ],
    correctIndex: 0,
    explanation: 'Price-to-Book sets the market price against the accounting net worth of the business.',
  },
  {
    id: 'ex-b-9',
    question: 'A PEG ratio below 1.0 usually suggests what?',
    options: [
      'The company is about to go bankrupt',
      'The price may be modest relative to the company’s earnings growth',
      'The stock pays no dividend',
      'The company has no debt',
    ],
    correctIndex: 1,
    explanation: 'PEG divides P/E by the growth rate. Below 1.0 the price is low relative to how fast earnings are growing — a starting point for research, not a buy signal.',
  },
  {
    id: 'ex-b-10',
    question: 'What is market capitalisation?',
    options: [
      'Share price multiplied by shares outstanding',
      'The company’s annual revenue',
      'The cash held by the company',
      'The total value traded in a day',
    ],
    correctIndex: 0,
    explanation: 'Market cap is what the market says the whole company is worth: price per share times the number of shares.',
  },
  {
    id: 'ex-b-11',
    question: 'Two companies both earn ₹100 crore. One is valued at ₹1,000 crore, the other at ₹3,000 crore. What does that tell you?',
    options: [
      'The cheaper one is always the better buy',
      'The market expects different future growth or carries different risk views',
      'One of them is reporting fraud',
      'Nothing at all',
    ],
    correctIndex: 1,
    explanation: 'Identical current profits with different valuations means the market is pricing different expectations. Which is right is what research is for.',
  },
  {
    id: 'ex-b-12',
    question: 'What is a dividend?',
    options: [
      'A tax on share purchases',
      'A share of company profit paid out to shareholders',
      'A fee charged by the broker',
      'The increase in a share price',
    ],
    correctIndex: 1,
    explanation: 'A dividend is profit distributed in cash to shareholders rather than reinvested in the business.',
  },
  {
    id: 'ex-b-13',
    question: 'Which body regulates the securities market in India?',
    options: ['RBI', 'SEBI', 'NSE', 'The Ministry of Finance'],
    correctIndex: 1,
    explanation: 'SEBI, the Securities and Exchange Board of India, is the market regulator. The RBI regulates banking and monetary policy.',
  },
  {
    id: 'ex-b-14',
    question: 'A stock has a very high P/E. What is the most accurate reading?',
    options: [
      'It is definitely overpriced',
      'The market expects strong future earnings growth, which may or may not arrive',
      'It is a safe investment',
      'Its earnings are falling',
    ],
    correctIndex: 1,
    explanation: 'A high P/E prices in growth. It is an expectation, not a fact, and the risk is that the growth does not show up.',
  },
  {
    id: 'ex-b-15',
    question: 'What is the NIFTY 50?',
    options: [
      'The 50 cheapest stocks on the NSE',
      'An index of 50 large, liquid companies listed on the NSE',
      'A mutual fund scheme',
      'The 50 most traded stocks each day',
    ],
    correctIndex: 1,
    explanation: 'The NIFTY 50 is a benchmark index made up of 50 of the largest and most liquid NSE-listed companies.',
  },
  {
    id: 'ex-b-16',
    question: 'If a company’s share count doubles while profit stays the same, what happens to EPS?',
    options: ['It doubles', 'It halves', 'It is unchanged', 'It goes to zero'],
    correctIndex: 1,
    explanation: 'The same profit spread over twice as many shares halves the profit attached to each one. This is dilution.',
  },
  {
    id: 'ex-b-17',
    question: 'What does "book value" represent?',
    options: [
      'Assets minus liabilities, as recorded in the accounts',
      'The price at which the share first listed',
      'The total sales for the year',
      'The value of the company’s brand',
    ],
    correctIndex: 0,
    explanation: 'Book value is the net worth on the balance sheet: what the company owns less what it owes.',
  },
  {
    id: 'ex-b-18',
    question: 'A "blue chip" company is best described as which of these?',
    options: [
      'Any stock priced above ₹1,000',
      'A large, established business with a long record of stable operations',
      'A newly listed company',
      'A stock that only ever rises',
    ],
    correctIndex: 1,
    explanation: 'Blue chips are the large, established names. Size and history reduce some risks; they remove none.',
  },
  {
    id: 'ex-b-19',
    question: 'Why can a falling share price still mean a good business?',
    options: [
      'Price always reflects business quality exactly',
      'Price reflects what buyers and sellers will pay today, which can drift from business performance',
      'Falling prices are always a mistake',
      'It cannot — price is the business',
    ],
    correctIndex: 1,
    explanation: 'Price is set by supply and demand in the short run. It follows business results over long periods, not day to day.',
  },
  {
    id: 'ex-b-20',
    question: 'What is the safest first step when you find an unfamiliar company?',
    options: [
      'Buy a small quantity to see what happens',
      'Read what the business actually sells and how it earns money',
      'Check whether the price rose yesterday',
      'Ask on social media',
    ],
    correctIndex: 1,
    explanation: 'Understanding the revenue source comes before any number. A ratio on a business you cannot describe is not information.',
  },
];

const explorer: ExamQuestion[] = [
  {
    id: 'ex-e-1',
    question: 'What does the 52-week high tell you?',
    options: [
      'The highest price traded in the last 365 days',
      'The price target set by analysts',
      'The highest price the stock will reach',
      'The listing price',
    ],
    correctIndex: 0,
    explanation: 'It is a record of the past year’s highest traded price. It is context, not a forecast.',
  },
  {
    id: 'ex-e-2',
    question: 'A stock trading near its 52-week low means what, on its own?',
    options: [
      'It is cheap and should be bought',
      'It is a failing business',
      'Only that the price is low relative to the last year — the reason still has to be researched',
      'It will bounce back',
    ],
    correctIndex: 2,
    explanation: 'Position in a range is context. The business behind it is what turns that context into information.',
  },
  {
    id: 'ex-e-3',
    question: 'What is a market correction usually defined as?',
    options: [
      'A fall of about 10% from a recent peak',
      'Any down day',
      'A fall of 50% or more',
      'A change in the index constituents',
    ],
    correctIndex: 0,
    explanation: 'A correction is conventionally a decline of roughly 10% from a recent high; a bear market is around 20% or more.',
  },
  {
    id: 'ex-e-4',
    question: 'A bear market is commonly defined as a decline of at least how much?',
    options: ['5%', '10%', '20%', '50%'],
    correctIndex: 2,
    explanation: 'A fall of about 20% or more from the peak is the usual threshold for a bear market.',
  },
  {
    id: 'ex-e-5',
    question: 'What is momentum, in market terms?',
    options: [
      'The tendency of a price trend to persist for a period',
      'The dividend growth rate',
      'The speed of order execution',
      'A company’s revenue growth',
    ],
    correctIndex: 0,
    explanation: 'Momentum describes a price trend continuing. It is an observed tendency, not a guarantee.',
  },
  {
    id: 'ex-e-6',
    question: 'Compound interest differs from simple interest because it does what?',
    options: [
      'Pays a higher fixed rate',
      'Earns returns on previously earned returns as well as the original amount',
      'Is paid monthly rather than yearly',
      'Is tax free',
    ],
    correctIndex: 1,
    explanation: 'Compounding earns a return on the returns already accumulated. That is why the curve bends upward over time.',
  },
  {
    id: 'ex-e-7',
    question: 'In a compounding projection, which input usually affects the final amount most?',
    options: ['The monthly amount', 'The number of years invested', 'The brokerage rate', 'The starting month'],
    correctIndex: 1,
    explanation: 'Time is the strongest lever because each year compounds on every year before it. Amount matters, but not as much as duration.',
  },
  {
    id: 'ex-e-8',
    question: '₹1,00,000 growing at 12% a year for 6 years ends up closest to which figure?',
    options: ['₹1,20,000', '₹1,72,000', '₹1,97,000', '₹3,00,000'],
    correctIndex: 2,
    explanation: '1.12 to the power of 6 is about 1.97, so roughly ₹1,97,000. Simple interest would have given only ₹1,72,000.',
  },
  {
    id: 'ex-e-9',
    question: 'What is an SIP?',
    options: [
      'A one-time lump sum purchase',
      'Investing a fixed amount at regular intervals',
      'A type of government bond',
      'A brokerage charge',
    ],
    correctIndex: 1,
    explanation: 'A Systematic Investment Plan puts a fixed sum in at fixed intervals, which averages the entry price over time.',
  },
  {
    id: 'ex-e-10',
    question: 'Why does starting an SIP five years earlier matter so much?',
    options: [
      'Earlier units cost less',
      'Those early contributions compound for five extra years',
      'Fund houses reward early investors',
      'Taxes are lower',
    ],
    correctIndex: 1,
    explanation: 'The first contributions have the longest runway, so they do the heaviest compounding.',
  },
  {
    id: 'ex-e-11',
    question: 'What does CAGR stand for?',
    options: [
      'Compound Annual Growth Rate',
      'Cumulative Annual Gross Return',
      'Capital Adjusted Gain Ratio',
      'Consolidated Average Growth Return',
    ],
    correctIndex: 0,
    explanation: 'CAGR is the smoothed annual rate that would take a starting value to an ending value over a period.',
  },
  {
    id: 'ex-e-12',
    question: 'Why can a stock be near its 52-week high and still be reasonably valued?',
    options: [
      'Highs are always justified',
      'If earnings have grown faster than the price, the valuation can be lower than it was before',
      'Highs mean nothing',
      'Because of momentum',
    ],
    correctIndex: 1,
    explanation: 'Valuation is price relative to earnings. If profits rose faster than the price, the multiple contracted even as the price rose.',
  },
  {
    id: 'ex-e-13',
    question: 'What is volatility?',
    options: [
      'The size and frequency of price movement',
      'The rate at which a company grows',
      'The number of shares traded',
      'The chance of bankruptcy',
    ],
    correctIndex: 0,
    explanation: 'Volatility measures how much and how often the price moves. It describes movement, not direction or quality.',
  },
  {
    id: 'ex-e-14',
    question: 'A market cycle typically moves through which sequence?',
    options: [
      'Expansion, peak, contraction, trough',
      'Only up and down',
      'IPO, dividend, buyback',
      'Bull, bull, bull',
    ],
    correctIndex: 0,
    explanation: 'Cycles run through expansion, a peak, contraction and a trough — though the timing is never knowable in advance.',
  },
  {
    id: 'ex-e-15',
    question: 'Why is timing the exact market bottom an unrealistic plan?',
    options: [
      'Bottoms are only identifiable after the fact',
      'Brokers block such orders',
      'The bottom is announced by SEBI',
      'Prices never reach a bottom',
    ],
    correctIndex: 0,
    explanation: 'A bottom is only visible in hindsight. Regular investing avoids needing to identify it.',
  },
  {
    id: 'ex-e-16',
    question: 'What does rupee cost averaging achieve?',
    options: [
      'It guarantees a profit',
      'It buys more units when prices are low and fewer when high, averaging the entry price',
      'It eliminates risk',
      'It reduces brokerage',
    ],
    correctIndex: 1,
    explanation: 'A fixed sum buys more units at low prices and fewer at high ones, which averages the cost of entry.',
  },
  {
    id: 'ex-e-17',
    question: 'If an investment doubles in 6 years, its approximate CAGR is closest to which figure?',
    options: ['6%', '12%', '20%', '33%'],
    correctIndex: 1,
    explanation: 'By the Rule of 72, 72 ÷ 6 ≈ 12% a year.',
  },
  {
    id: 'ex-e-18',
    question: 'Why should a projected return never be treated as a promise?',
    options: [
      'Projections assume a constant rate that real markets do not deliver',
      'Calculators are usually wrong',
      'Returns are fixed by SEBI',
      'Inflation is illegal',
    ],
    correctIndex: 0,
    explanation: 'A projection applies one smooth rate. Real returns arrive unevenly, and the order of good and bad years matters.',
  },
  {
    id: 'ex-e-19',
    question: 'Two investors put in the same total amount; one started ten years earlier. What usually separates their outcomes?',
    options: [
      'Brokerage charges',
      'The extra decade of compounding on the earlier contributions',
      'The choice of broker',
      'Nothing',
    ],
    correctIndex: 1,
    explanation: 'Same money, more time, more compounding. Duration is the variable doing the work.',
  },
  {
    id: 'ex-e-20',
    question: 'Which statement about past performance is accurate?',
    options: [
      'It reliably predicts future returns',
      'It describes what happened, and gives no guarantee about what will happen',
      'It is irrelevant and should be ignored',
      'It is set by the exchange',
    ],
    correctIndex: 1,
    explanation: 'History is evidence about a business and a market, not a forecast of returns.',
  },
];

const builder: ExamQuestion[] = [
  {
    id: 'ex-bu-1',
    question: 'What is asset allocation?',
    options: [
      'Choosing which broker to use',
      'How you divide money across different kinds of assets',
      'The order in which you buy shares',
      'The tax treatment of gains',
    ],
    correctIndex: 1,
    explanation: 'Allocation is the split across asset types. It decides most of how a portfolio behaves.',
  },
  {
    id: 'ex-bu-2',
    question: 'Why does diversification reduce risk?',
    options: [
      'It guarantees a profit',
      'Holdings that do not move together mean one bad outcome cannot sink the whole portfolio',
      'It lowers brokerage costs',
      'It increases expected return',
    ],
    correctIndex: 1,
    explanation: 'Spreading across holdings that respond to different forces limits how much any single wrong idea can cost you.',
  },
  {
    id: 'ex-bu-3',
    question: 'You hold 70% of your portfolio in one stock. What is the main risk?',
    options: [
      'Higher brokerage',
      'Concentration: one company’s problem becomes your portfolio’s problem',
      'Slower execution',
      'Higher taxes',
    ],
    correctIndex: 1,
    explanation: 'Concentration means a single company’s bad news drives your entire result. That is a position size question, not a stock quality one.',
  },
  {
    id: 'ex-bu-4',
    question: 'What does rebalancing mean?',
    options: [
      'Selling everything and starting again',
      'Restoring the portfolio to its target weights after prices drift them apart',
      'Switching brokers',
      'Doubling down on losers',
    ],
    correctIndex: 1,
    explanation: 'Prices move weights away from the plan. Rebalancing trims what grew and tops up what lagged, back to target.',
  },
  {
    id: 'ex-bu-5',
    question: 'What does a candlestick body show?',
    options: [
      'The range between the open and the close',
      'The highest and lowest prices',
      'The traded volume',
      'The number of trades',
    ],
    correctIndex: 0,
    explanation: 'The body spans open to close. The thin wicks show the extremes reached during the period.',
  },
  {
    id: 'ex-bu-6',
    question: 'A long upper wick on a candle suggests what happened?',
    options: [
      'Price pushed higher but sellers drove it back down before the close',
      'No trading occurred',
      'The stock hit a circuit limit',
      'Buyers were in control all session',
    ],
    correctIndex: 0,
    explanation: 'An upper wick records a rally that was rejected: price reached up there and did not stay.',
  },
  {
    id: 'ex-bu-7',
    question: 'What does a green (or white) candle body indicate?',
    options: [
      'The close was above the open',
      'The stock paid a dividend',
      'Volume was unusually high',
      'The close was below the open',
    ],
    correctIndex: 0,
    explanation: 'A green body means the period closed higher than it opened — buyers ended the session in front.',
  },
  {
    id: 'ex-bu-8',
    question: 'What is support, in price action terms?',
    options: [
      'A price area where buying has repeatedly halted declines',
      'A broker service desk',
      'The lowest price ever traded',
      'A government guarantee',
    ],
    correctIndex: 0,
    explanation: 'Support is an area where demand has previously been enough to stop a fall. It is a tendency, not a floor.',
  },
  {
    id: 'ex-bu-9',
    question: 'What is a market order?',
    options: [
      'An order to buy or sell immediately at the best available price',
      'An order that executes only at a price you set',
      'An order that triggers after a stop level',
      'An order placed before the market opens',
    ],
    correctIndex: 0,
    explanation: 'A market order prioritises execution over price: it fills now, at whatever the book offers.',
  },
  {
    id: 'ex-bu-10',
    question: 'What is a limit order?',
    options: [
      'An order that fills immediately at any price',
      'An order that fills only at your specified price or better',
      'An order that cancels at noon',
      'An order restricted to one lot',
    ],
    correctIndex: 1,
    explanation: 'A limit order prioritises price over certainty: it fills only at your price or better, and may not fill at all.',
  },
  {
    id: 'ex-bu-11',
    question: 'What is the trade-off a limit order makes?',
    options: [
      'Lower brokerage against slower settlement',
      'Price control against the risk of not being filled',
      'Higher taxes against better price',
      'There is no trade-off',
    ],
    correctIndex: 1,
    explanation: 'You choose your price and accept that the market may never come to it.',
  },
  {
    id: 'ex-bu-12',
    question: 'What does a stop-loss order do?',
    options: [
      'Guarantees you cannot lose money',
      'Triggers an exit order once the price reaches a level you set',
      'Prevents the stock from falling',
      'Cancels all your open orders',
    ],
    correctIndex: 1,
    explanation: 'A stop-loss triggers an order at a chosen level. In a fast market the fill can be worse than the trigger price.',
  },
  {
    id: 'ex-bu-13',
    question: 'What is liquidity?',
    options: [
      'How easily you can buy or sell without moving the price much',
      'The cash a company holds',
      'The dividend yield',
      'The speed of your internet connection',
    ],
    correctIndex: 0,
    explanation: 'A liquid stock absorbs your order without a large price move. Thin stocks move against you as you trade.',
  },
  {
    id: 'ex-bu-14',
    question: 'What is the bid-ask spread?',
    options: [
      'The gap between the highest buy offer and the lowest sell offer',
      'The broker’s commission',
      'The difference between today’s high and low',
      'The exchange fee',
    ],
    correctIndex: 0,
    explanation: 'The spread is the distance between the best bid and best ask. A wide spread is a cost you pay on entry and exit.',
  },
  {
    id: 'ex-bu-15',
    question: 'Why is a wide bid-ask spread a real cost?',
    options: [
      'It is charged by SEBI',
      'You typically buy at the higher ask and sell at the lower bid, losing the gap',
      'It raises your tax rate',
      'It delays settlement',
    ],
    correctIndex: 1,
    explanation: 'Crossing the spread on both entry and exit means the position starts behind by roughly the spread.',
  },
  {
    id: 'ex-bu-16',
    question: 'What is slippage?',
    options: [
      'The difference between the price you expected and the price you got',
      'A late settlement',
      'A failed login',
      'A dividend adjustment',
    ],
    correctIndex: 0,
    explanation: 'Slippage is the gap between expected and executed price, and it widens in fast or thin markets.',
  },
  {
    id: 'ex-bu-17',
    question: 'What does position sizing decide?',
    options: [
      'Which stock to buy',
      'How much one wrong idea can cost you',
      'When the market opens',
      'Your tax slab',
    ],
    correctIndex: 1,
    explanation: 'Sizing converts a view into an exposure. It is the main control over the damage a single mistake can do.',
  },
  {
    id: 'ex-bu-18',
    question: 'Volume on a candlestick chart tells you what?',
    options: [
      'How many shares changed hands in that period',
      'The company’s revenue',
      'The number of shareholders',
      'The price range',
    ],
    correctIndex: 0,
    explanation: 'Volume is the quantity traded. A move on heavy volume had more participation behind it than the same move on thin volume.',
  },
  {
    id: 'ex-bu-19',
    question: 'Why does a chart pattern not predict the next candle?',
    options: [
      'Patterns are illegal',
      'A pattern is a record of what already happened; future prices depend on new information and new participants',
      'Charts are randomly generated',
      'Candles are decorative',
    ],
    correctIndex: 1,
    explanation: 'A chart describes the past. Reading it well means understanding what buyers and sellers did, not forecasting what they will do.',
  },
  {
    id: 'ex-bu-20',
    question: 'You want certainty of execution above all. Which order type fits?',
    options: ['Limit order', 'Market order', 'Stop-limit order', 'Good-till-cancelled limit'],
    correctIndex: 1,
    explanation: 'A market order buys certainty of a fill at the cost of price control.',
  },
];

const analyst: ExamQuestion[] = [
  {
    id: 'ex-a-1',
    question: 'What does the Rule of 72 estimate?',
    options: [
      'The years needed to double money at a given annual rate',
      'The tax due on a gain',
      'The number of stocks to hold',
      'The fair P/E for a sector',
    ],
    correctIndex: 0,
    explanation: 'Divide 72 by the annual rate for a quick estimate of the doubling period.',
  },
  {
    id: 'ex-a-2',
    question: 'At 9% a year, roughly how long does money take to double?',
    options: ['4 years', '6 years', '8 years', '12 years'],
    correctIndex: 2,
    explanation: '72 ÷ 9 = 8 years.',
  },
  {
    id: 'ex-a-3',
    question: 'At 6% inflation, purchasing power roughly halves in how many years?',
    options: ['6', '12', '18', '24'],
    correctIndex: 1,
    explanation: 'The rule works in reverse for inflation: 72 ÷ 6 = 12 years to lose half your purchasing power.',
  },
  {
    id: 'ex-a-4',
    question: 'You earn 10% while inflation runs at 6%. What is your approximate real return?',
    options: ['16%', '10%', '4%', '0%'],
    correctIndex: 2,
    explanation: 'Real return is roughly the nominal return less inflation: about 4%. That is the part that reaches your purchasing power.',
  },
  {
    id: 'ex-a-5',
    question: 'Why is a nominal return misleading on its own?',
    options: [
      'It ignores inflation, which erodes what the money can buy',
      'It is always overstated by brokers',
      'It cannot be calculated accurately',
      'It excludes dividends',
    ],
    correctIndex: 0,
    explanation: 'A 7% return during 7% inflation leaves purchasing power unchanged. Only the real return is economically meaningful.',
  },
  {
    id: 'ex-a-6',
    question: 'The balance sheet shows what?',
    options: [
      'Assets, liabilities and equity at a point in time',
      'Revenue and expenses over a year',
      'Cash movements over a year',
      'The share price history',
    ],
    correctIndex: 0,
    explanation: 'It is a snapshot: what the company owns, what it owes and what is left for shareholders, on one date.',
  },
  {
    id: 'ex-a-7',
    question: 'Which accounting identity must always hold?',
    options: [
      'Assets = Liabilities + Equity',
      'Revenue = Profit + Tax',
      'Cash = Assets − Revenue',
      'Equity = Revenue − Expenses',
    ],
    correctIndex: 0,
    explanation: 'Everything the company owns is funded either by borrowing or by owners’ capital. That is why it balances.',
  },
  {
    id: 'ex-a-8',
    question: 'The profit and loss statement covers what?',
    options: [
      'A point in time',
      'Revenue, costs and profit over a period',
      'Only cash transactions',
      'Only the company’s debts',
    ],
    correctIndex: 1,
    explanation: 'The P&L reports performance across a period — a quarter or a year — rather than a single date.',
  },
  {
    id: 'ex-a-9',
    question: 'Why can a profitable company still run out of cash?',
    options: [
      'Profit is recognised on accrual, so sales booked may not yet be collected',
      'Profit is always fictional',
      'Cash is not needed by profitable firms',
      'It cannot happen',
    ],
    correctIndex: 0,
    explanation: 'Accrual accounting books a sale when it is made, not when it is paid. Working capital can absorb cash while profit looks healthy.',
  },
  {
    id: 'ex-a-10',
    question: 'What is free cash flow?',
    options: [
      'Operating cash flow less capital expenditure',
      'Revenue less tax',
      'The cash balance on the balance sheet',
      'Dividends paid',
    ],
    correctIndex: 0,
    explanation: 'FCF is the cash left after the business has paid to maintain and grow its asset base.',
  },
  {
    id: 'ex-a-11',
    question: 'What does ROE measure?',
    options: [
      'Net profit as a percentage of shareholders’ equity',
      'Revenue growth',
      'Debt as a share of assets',
      'Dividend per share',
    ],
    correctIndex: 0,
    explanation: 'Return on Equity shows how much profit is generated on the owners’ capital.',
  },
  {
    id: 'ex-a-12',
    question: 'Why does high debt make earnings more volatile?',
    options: [
      'Interest is a fixed cost that must be paid whether or not profits fall',
      'Lenders take a share of profit',
      'Debt raises the tax rate',
      'It does not',
    ],
    correctIndex: 0,
    explanation: 'Fixed interest magnifies both good and bad years, because it does not shrink when revenue does.',
  },
  {
    id: 'ex-a-13',
    question: 'The cash flow statement is usually split into which three parts?',
    options: [
      'Operating, investing and financing',
      'Past, present and future',
      'Assets, liabilities and equity',
      'Revenue, cost and profit',
    ],
    correctIndex: 0,
    explanation: 'Operating covers the trading business, investing covers assets bought and sold, financing covers debt and equity.',
  },
  {
    id: 'ex-a-14',
    question: 'What does the 50/30/20 rule suggest?',
    options: [
      '50% needs, 30% wants, 20% savings and debt repayment',
      '50% equity, 30% debt, 20% gold',
      '50% savings, 30% needs, 20% wants',
      '50% large cap, 30% mid cap, 20% small cap',
    ],
    correctIndex: 0,
    explanation: 'It is a budgeting split of take-home pay: half to needs, under a third to wants, at least a fifth to saving.',
  },
  {
    id: 'ex-a-15',
    question: 'What is zero-based budgeting?',
    options: [
      'Spending nothing each month',
      'Assigning every rupee of income a job until nothing is unallocated',
      'Budgeting only for emergencies',
      'Keeping a zero bank balance',
    ],
    correctIndex: 1,
    explanation: 'Income minus every allocation equals zero. Saving becomes a line item rather than whatever happens to be left.',
  },
  {
    id: 'ex-a-16',
    question: 'How large is an emergency fund usually recommended to be?',
    options: [
      'One week of expenses',
      'Three to six months of essential expenses',
      'Five years of income',
      'Whatever is left after investing',
    ],
    correctIndex: 1,
    explanation: 'Three to six months of essential costs, held in something safe and accessible, is the common guidance.',
  },
  {
    id: 'ex-a-17',
    question: 'Why should an emergency fund not sit in equities?',
    options: [
      'Equity returns are too high',
      'It may be needed exactly when markets are down, forcing a sale at a loss',
      'Equities cannot be sold',
      'It would attract higher tax',
    ],
    correctIndex: 1,
    explanation: 'Emergencies and market falls often coincide. The fund’s job is availability, not return.',
  },
  {
    id: 'ex-a-18',
    question: 'Two companies report identical profits, but one has far higher debt. What follows?',
    options: [
      'They carry the same risk',
      'The indebted one has more fragile earnings and less room in a downturn',
      'The indebted one is better managed',
      'Debt has no bearing on risk',
    ],
    correctIndex: 1,
    explanation: 'Identical profit with more fixed obligations means less cushion. Financial strength is part of the comparison.',
  },
  {
    id: 'ex-a-19',
    question: 'Why read the debt and cash figures before the share price?',
    options: [
      'The price is not published until later',
      'Financial strength explains why similar businesses can be valued very differently',
      'Prices are unreliable',
      'It is required by law',
    ],
    correctIndex: 1,
    explanation: 'Starting from the balance sheet stops the price from anchoring your view of the business.',
  },
  {
    id: 'ex-a-20',
    question: 'What does depreciation represent in the accounts?',
    options: [
      'A cash payment made this year',
      'The spreading of an asset’s cost across the years it is used',
      'A fall in the share price',
      'A tax penalty',
    ],
    correctIndex: 1,
    explanation: 'Depreciation is a non-cash charge that allocates an asset’s cost over its useful life.',
  },
];

const responsible: ExamQuestion[] = [
  {
    id: 'ex-r-1',
    question: 'What is loss aversion?',
    options: [
      'Losses being felt more intensely than equivalent gains',
      'Refusing to invest at all',
      'Selling every position that falls',
      'A tax rule on losses',
    ],
    correctIndex: 0,
    explanation: 'The pain of a loss is felt more strongly than the pleasure of the same-sized gain, which distorts decisions.',
  },
  {
    id: 'ex-r-2',
    question: 'The disposition effect describes which behaviour?',
    options: [
      'Selling winners too early and holding losers too long',
      'Buying only large caps',
      'Trading only on Fridays',
      'Avoiding dividends',
    ],
    correctIndex: 0,
    explanation: 'Investors book gains to feel right and hold losses to avoid feeling wrong — the opposite of what the evidence usually warrants.',
  },
  {
    id: 'ex-r-3',
    question: 'What is confirmation bias?',
    options: [
      'Seeking information that supports a view you already hold',
      'Confirming your order before submitting it',
      'Verifying a broker’s identity',
      'Checking the closing price',
    ],
    correctIndex: 0,
    explanation: 'You notice the evidence that agrees with you and skim past the rest, which makes a weak thesis feel strong.',
  },
  {
    id: 'ex-r-4',
    question: 'What is anchoring?',
    options: [
      'Fixing on an initial number, such as your purchase price, when judging value',
      'Holding a stock for over a year',
      'Setting a stop-loss',
      'Averaging down',
    ],
    correctIndex: 0,
    explanation: 'The price you paid is irrelevant to what the business is worth now, but it is remarkably hard to ignore.',
  },
  {
    id: 'ex-r-5',
    question: 'What is recency bias?',
    options: [
      'Weighting the latest events far more heavily than longer history',
      'Buying only recent IPOs',
      'Reviewing your portfolio daily',
      'Preferring new brokers',
    ],
    correctIndex: 0,
    explanation: 'The last few months feel more informative than the last ten years, which is rarely true.',
  },
  {
    id: 'ex-r-6',
    question: 'Why write down a rule before entering a position?',
    options: [
      'It is required by SEBI',
      'A written rule survives contact with a moving price better than an intention does',
      'It reduces brokerage',
      'It guarantees a profit',
    ],
    correctIndex: 1,
    explanation: 'Decisions made calmly, in advance and in writing, are the ones that hold when the price moves against you.',
  },
  {
    id: 'ex-r-7',
    question: 'What should a trading journal record beyond the entry and exit?',
    options: [
      'The reasoning, and what evidence would show the idea was wrong',
      'Only the profit',
      'The broker’s name',
      'The weather',
    ],
    correctIndex: 0,
    explanation: 'The reasoning and the disconfirming evidence are what let you judge the decision separately from the outcome.',
  },
  {
    id: 'ex-r-8',
    question: 'Why judge a decision separately from its outcome?',
    options: [
      'Outcomes are illegal to review',
      'A good decision can lose and a poor one can win, because chance is involved',
      'Outcomes are always fair',
      'Decisions do not matter',
    ],
    correctIndex: 1,
    explanation: 'With randomness in the mix, a single outcome is weak evidence about process quality.',
  },
  {
    id: 'ex-r-9',
    question: 'What is herd behaviour?',
    options: [
      'Following the crowd rather than independent evidence',
      'Investing in agriculture',
      'Buying a basket of stocks',
      'Trading in large volumes',
    ],
    correctIndex: 0,
    explanation: 'Doing what everyone else is doing feels safe and is the mechanism behind most bubbles.',
  },
  {
    id: 'ex-r-10',
    question: 'What is overconfidence, in investing terms?',
    options: [
      'Overestimating your ability to predict outcomes, usually leading to too much trading',
      'Investing in large companies',
      'Using a stop-loss',
      'Holding cash',
    ],
    correctIndex: 0,
    explanation: 'Overconfidence shows up as excess trading and oversized positions, both of which cost money.',
  },
  {
    id: 'ex-r-11',
    question: 'Mr Market, in Benjamin Graham’s analogy, represents what?',
    options: [
      'A moody counterparty whose daily quotes you may accept or ignore',
      'The regulator',
      'A reliable valuation service',
      'Your broker',
    ],
    correctIndex: 0,
    explanation: 'He offers you a price every day. You are never obliged to trade at it — his mood is not your valuation.',
  },
  {
    id: 'ex-r-12',
    question: 'What does ESG stand for?',
    options: [
      'Environmental, Social and Governance',
      'Equity, Stocks and Gold',
      'Earnings, Sales and Growth',
      'Energy, Services and Goods',
    ],
    correctIndex: 0,
    explanation: 'ESG covers environmental impact, social factors and how a company is governed.',
  },
  {
    id: 'ex-r-13',
    question: 'What is greenwashing?',
    options: [
      'Presenting a business as more environmentally responsible than its operations justify',
      'Cleaning industrial equipment',
      'Investing only in renewables',
      'A carbon tax',
    ],
    correctIndex: 0,
    explanation: 'The marketing is the claim; where the revenue actually comes from is the evidence.',
  },
  {
    id: 'ex-r-14',
    question: 'What is a carbon credit?',
    options: [
      'A tradable permit representing a quantity of greenhouse gas emissions',
      'A bank loan for solar panels',
      'A tax deduction for cyclists',
      'A government bond',
    ],
    correctIndex: 0,
    explanation: 'One credit typically represents a tonne of CO₂ equivalent, and the permits can be traded.',
  },
  {
    id: 'ex-r-15',
    question: 'How should you verify a company’s sustainability claim?',
    options: [
      'Read its advertising',
      'Check which activities actually generate its revenue',
      'Check the share price',
      'Ask other investors',
    ],
    correctIndex: 1,
    explanation: 'A green label is a claim. The revenue split is evidence.',
  },
  {
    id: 'ex-r-16',
    question: 'Why is "the price went up, so I was right" unreliable reasoning?',
    options: [
      'Prices are fixed',
      'Short-term price moves have many causes unrelated to your thesis',
      'Being right is impossible',
      'It is always correct',
    ],
    correctIndex: 1,
    explanation: 'A move can come from flows, news or sentiment. It does not confirm the reasoning you used.',
  },
  {
    id: 'ex-r-17',
    question: 'What is the practical value of a pre-set exit plan?',
    options: [
      'It removes the decision from the moment you are least able to make it well',
      'It guarantees the exit price',
      'It reduces tax',
      'It is required by the exchange',
    ],
    correctIndex: 0,
    explanation: 'Deciding in advance means the plan, not the adrenaline, governs the exit.',
  },
  {
    id: 'ex-r-18',
    question: 'What does FOMO usually lead to?',
    options: [
      'Buying late, after a move, at a worse price',
      'Better research',
      'Lower risk',
      'Higher dividends',
    ],
    correctIndex: 0,
    explanation: 'Fear of missing out gets people in near the top, when the easy part of the move is already behind.',
  },
  {
    id: 'ex-r-19',
    question: 'Why is reviewing your own past trades valuable even when they were profitable?',
    options: [
      'Profits may have come from luck rather than the process you intended',
      'It is required for tax filing',
      'It increases returns automatically',
      'It is not valuable',
    ],
    correctIndex: 0,
    explanation: 'Reviewing the reasoning, not just the result, is how you tell a repeatable process from a lucky one.',
  },
  {
    id: 'ex-r-20',
    question: 'Which is the most honest statement about investing risk?',
    options: [
      'Risk can be removed with enough research',
      'Risk can be understood, sized and managed, but not eliminated',
      'Risk only applies to small companies',
      'Diversification eliminates risk',
    ],
    correctIndex: 1,
    explanation: 'Research and diversification change how much risk you carry and where. Neither removes it.',
  },
];

const taxation: ExamQuestion[] = [
  {
    id: 'ex-t-1',
    question: 'Under India’s progressive slab system, what happens when your income crosses into a higher slab?',
    options: [
      'Your entire income is taxed at the higher rate',
      'Only the amount above the threshold is taxed at the higher rate',
      'You pay a flat penalty',
      'Your previous years are reassessed',
    ],
    correctIndex: 1,
    explanation: 'Slabs are layers. Each layer is taxed at its own rate, so only the income above a threshold attracts the higher rate.',
  },
  {
    id: 'ex-t-2',
    question: 'Which section governs the new default tax regime?',
    options: ['Section 80C', 'Section 115BAC', 'Section 111A', 'Section 112A'],
    correctIndex: 1,
    explanation: 'Section 115BAC sets out the new regime, the default since FY 2023-24.',
  },
  {
    id: 'ex-t-3',
    question: 'Under the new regime for FY 2025-26, income up to which figure is taxed at nil?',
    options: ['₹2,50,000', '₹3,00,000', '₹4,00,000', '₹5,00,000'],
    correctIndex: 2,
    explanation: 'The first ₹4,00,000 falls in the nil slab under the new regime for FY 2025-26.',
  },
  {
    id: 'ex-t-4',
    question: 'What rate of Health and Education Cess is added to the computed tax?',
    options: ['1%', '2%', '4%', '10%'],
    correctIndex: 2,
    explanation: 'A 4% Health and Education Cess is applied on top of the tax computed from the slabs.',
  },
  {
    id: 'ex-t-5',
    question: 'How long must a listed equity share be held to qualify as a long-term capital asset?',
    options: [
      'More than 12 months',
      'More than 24 months',
      'More than 36 months',
      'More than 6 months',
    ],
    correctIndex: 0,
    explanation: 'Listed equity held for more than twelve months is long-term; twelve months or less is short-term.',
  },
  {
    id: 'ex-t-6',
    question: 'What is the tax rate on short-term capital gains on listed equity under Section 111A?',
    options: ['10%', '15%', '20%', 'Your slab rate'],
    correctIndex: 2,
    explanation: 'STCG on listed equity under Section 111A is taxed at 20%, following the Budget 2024 change.',
  },
  {
    id: 'ex-t-7',
    question: 'What is the long-term capital gains rate on listed equity under Section 112A?',
    options: ['10%', '12.5%', '15%', '20%'],
    correctIndex: 1,
    explanation: 'LTCG on listed equity is taxed at 12.5%, without indexation.',
  },
  {
    id: 'ex-t-8',
    question: 'How much long-term capital gain on listed equity is exempt each year under Section 112A?',
    options: ['₹1,00,000', '₹1,25,000', '₹2,00,000', 'No exemption'],
    correctIndex: 1,
    explanation: 'The first ₹1,25,000 of LTCG on listed equity in a financial year is exempt.',
  },
  {
    id: 'ex-t-9',
    question: 'You realise ₹2,00,000 of long-term gain on listed equity. Roughly how much is taxable?',
    options: ['₹2,00,000', '₹1,00,000', '₹75,000', 'Nil'],
    correctIndex: 2,
    explanation: 'Subtract the ₹1,25,000 exemption: ₹75,000 is taxable, at 12.5%.',
  },
  {
    id: 'ex-t-10',
    question: 'What is tax loss harvesting?',
    options: [
      'Booking a realised loss to offset realised gains within the same financial year',
      'Claiming a deduction for unrealised losses',
      'Avoiding tax by not filing',
      'Transferring shares to a relative',
    ],
    correctIndex: 0,
    explanation: 'Selling a losing position realises the loss, which can be set off against realised gains. Only realised losses count.',
  },
  {
    id: 'ex-t-11',
    question: 'A loss must be realised by which date to be set off in a financial year?',
    options: ['31 December', '31 January', '31 March', '31 July'],
    correctIndex: 2,
    explanation: 'The financial year ends on 31 March. A loss still on paper after that date does not count for that year.',
  },
  {
    id: 'ex-t-12',
    question: 'A long-term capital loss can be set off against which gains?',
    options: [
      'Long-term capital gains only',
      'Any income including salary',
      'Short-term gains only',
      'It cannot be set off at all',
    ],
    correctIndex: 0,
    explanation: 'Long-term losses set off only against long-term gains. Short-term losses are more flexible: they can go against either.',
  },
  {
    id: 'ex-t-13',
    question: 'For how many assessment years can an unabsorbed capital loss be carried forward?',
    options: ['2', '4', '8', 'Indefinitely'],
    correctIndex: 2,
    explanation: 'Capital losses can be carried forward for eight assessment years, provided the return is filed on time.',
  },
  {
    id: 'ex-t-14',
    question: 'What is the condition for carrying a capital loss forward?',
    options: [
      'Filing the return by the due date under Section 139(1)',
      'Holding the shares for two years',
      'Informing your broker',
      'Paying advance tax',
    ],
    correctIndex: 0,
    explanation: 'A late return forfeits the carry-forward. The deadline under Section 139(1) is what preserves it.',
  },
  {
    id: 'ex-t-15',
    question: 'What is STT?',
    options: [
      'Securities Transaction Tax, levied on exchange trades',
      'A state transport tax',
      'A tax on dividends',
      'A broker’s commission',
    ],
    correctIndex: 0,
    explanation: 'Securities Transaction Tax is charged on trades executed on a recognised exchange.',
  },
  {
    id: 'ex-t-16',
    question: 'How are dividends taxed in the hands of an Indian resident investor today?',
    options: [
      'Exempt from tax',
      'Added to total income and taxed at slab rates',
      'Taxed at a flat 10%',
      'Taxed at 12.5%',
    ],
    correctIndex: 1,
    explanation: 'Since the dividend distribution tax was abolished, dividends are taxed in the investor’s hands at their slab rate.',
  },
  {
    id: 'ex-t-17',
    question: 'What does grandfathering under Section 112A protect?',
    options: [
      'Gains accrued up to 31 January 2018 on listed equity',
      'All gains made before you turned 60',
      'Inherited shares only',
      'Dividends from PSU stocks',
    ],
    correctIndex: 0,
    explanation: 'The cost is stepped up to the higher of actual cost or the 31 January 2018 fair market value, shielding gains accrued before that date.',
  },
  {
    id: 'ex-t-18',
    question: 'Why do frequent trades raise your cost base even when each charge looks small?',
    options: [
      'Charges scale with how often you trade, not with how well you trade',
      'Brokers increase rates for active traders',
      'Tax rates rise with trade count',
      'They do not',
    ],
    correctIndex: 0,
    explanation: 'STT, stamp duty, GST and brokerage attach to every trade. Turnover, not skill, drives the total.',
  },
  {
    id: 'ex-t-19',
    question: 'What is the difference between tax planning and tax evasion?',
    options: [
      'Planning uses the law as written; evasion conceals or misstates facts and is illegal',
      'There is no difference',
      'Planning is for companies, evasion for individuals',
      'Evasion is legal below a threshold',
    ],
    correctIndex: 0,
    explanation: 'Arranging affairs within the law is planning. Hiding income or misreporting is evasion, and it is a criminal matter.',
  },
  {
    id: 'ex-t-20',
    question: 'Why does filing depend on records you can actually produce?',
    options: [
      'The return must be reconcilable against broker statements and the AIS',
      'The form requires photographs',
      'Records are optional',
      'Only auditors need records',
    ],
    correctIndex: 0,
    explanation: 'Your reported figures have to stand against the statements and the Annual Information Statement the department already holds.',
  },
];

/**
 * Builds one attempt at an exam.
 *
 * The authored answers cluster in the first two positions, and a retry that
 * showed the same order every time would reward memorising positions rather
 * than the material. Both the questions and each question's options are
 * shuffled per attempt, and `correctIndex` is remapped to follow its option.
 *
 * `random` is injectable so the shuffle can be tested.
 */
export const buildExamAttempt = (
  exam: StageExam,
  random: () => number = Math.random,
): ExamQuestion[] => {
  const shuffle = <T,>(items: T[]): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  return shuffle(exam.questions).map((question) => {
    const answer = question.options[question.correctIndex];
    const options = shuffle(question.options);
    return { ...question, options, correctIndex: options.indexOf(answer) };
  });
};

export const STAGE_EXAMS: StageExam[] = [
  { stageId: 'beginner', title: 'Beginner stage exam', questions: beginner },
  { stageId: 'explorer', title: 'Explorer stage exam', questions: explorer },
  { stageId: 'builder', title: 'Builder stage exam', questions: builder },
  { stageId: 'analyst', title: 'Analyst stage exam', questions: analyst },
  { stageId: 'responsible', title: 'Responsible Simulator stage exam', questions: responsible },
  { stageId: 'taxation', title: 'Tax Smart stage exam', questions: taxation },
];

export const getStageExam = (stageId: string): StageExam | undefined =>
  STAGE_EXAMS.find((exam) => exam.stageId === stageId);

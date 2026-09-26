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

/**
 * How many recently served question ids are remembered per stage.
 *
 * One paper's worth. It has to stay well below a bank's size: remembering
 * more questions than a bank holds would mark every question as seen and put
 * the learner straight back on repeats, which is what a test here checks.
 */
export const EXAM_SEEN_MEMORY = EXAM_LENGTH;

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
  {
    id: 'ex-b-21',
    question: 'What is the main difference between the NSE and the BSE?',
    options: [
      'They are two separate exchanges a company can be listed on',
      'One trades shares and the other trades only bonds',
      'One is for Indian investors and the other for foreign investors',
      'One is regulated by SEBI and the other is not',
    ],
    correctIndex: 0,
    explanation: 'Both are stock exchanges regulated by SEBI. A large company is usually listed on both, and its price on each is very close.',
  },
  {
    id: 'ex-b-22',
    question: 'What does a stock exchange actually do?',
    options: [
      'It decides what each share is worth',
      'It matches buyers with sellers and records the trade',
      'It lends money to companies that need it',
      'It guarantees that share prices rise over time',
    ],
    correctIndex: 1,
    explanation: 'An exchange is a marketplace. It matches orders and settles them; the price comes from what buyers and sellers agree to.',
  },
  {
    id: 'ex-b-23',
    question: 'Who regulates the securities market in India?',
    options: ['The RBI', 'SEBI', 'The NSE', 'The Ministry of Finance directly'],
    correctIndex: 1,
    explanation: 'SEBI, the Securities and Exchange Board of India, is the regulator. The RBI regulates banking and monetary policy.',
  },
  {
    id: 'ex-b-24',
    question: 'What is a demat account for?',
    options: [
      'Holding your shares in electronic form',
      'Holding the cash you use to buy shares',
      'Recording how much tax you owe',
      'Borrowing money against your shares',
    ],
    correctIndex: 0,
    explanation: 'A demat account holds shares electronically. The cash sits in your linked bank account, and the broker connects the two.',
  },
  {
    id: 'ex-b-25',
    question: 'What is an IPO?',
    options: [
      'The first time a company offers its shares to the public',
      'A company buying back its own shares',
      'A bonus issue of free shares to existing holders',
      'A company being removed from the exchange',
    ],
    correctIndex: 0,
    explanation: 'An Initial Public Offering is the first sale of shares to the public, after which the shares trade on an exchange.',
  },
  {
    id: 'ex-b-26',
    question: 'A share trades at ₹500 and pays a ₹10 dividend a year. What is its dividend yield?',
    options: ['2%', '5%', '10%', '50%'],
    correctIndex: 0,
    explanation: 'Dividend yield is the yearly dividend divided by the share price: ₹10 ÷ ₹500 = 2%.',
  },
  {
    id: 'ex-b-27',
    question: 'What is the bid price?',
    options: [
      'The highest price a buyer is currently willing to pay',
      'The lowest price a seller is currently willing to accept',
      'The price of the last trade that happened',
      'The price the company set at its IPO',
    ],
    correctIndex: 0,
    explanation: 'The bid is the best buying price on offer, the ask is the best selling price, and the gap between them is the spread.',
  },
  {
    id: 'ex-b-28',
    question: 'What is a market order?',
    options: [
      'An order to buy or sell at whatever the current price is',
      'An order that only fills at a price you name',
      'An order that fills only at the market close',
      'An order that cancels itself after a day',
    ],
    correctIndex: 0,
    explanation: 'A market order prioritises getting filled over getting a price. A limit order does the opposite.',
  },
  {
    id: 'ex-b-29',
    question: 'You place a limit order to buy at ₹100 and the stock never trades below ₹104. What happens?',
    options: [
      'The order does not fill',
      'It fills at ₹104 anyway',
      'It fills at ₹100 at the end of the day',
      'The broker fills it and charges you the difference',
    ],
    correctIndex: 0,
    explanation: 'A limit order sets the worst price you will accept. If the market never reaches it, it simply does not execute.',
  },
  {
    id: 'ex-b-30',
    question: 'What does NIFTY 50 track?',
    options: [
      'The 50 largest companies by market value on the NSE',
      'The 50 most traded companies on the BSE',
      'The 50 newest companies to list in India',
      'The 50 companies that paid the highest dividends',
    ],
    correctIndex: 0,
    explanation: 'NIFTY 50 is an index of 50 large, liquid NSE-listed companies, used as a benchmark for the Indian market.',
  },
  {
    id: 'ex-b-31',
    question: 'A company has 20 crore shares outstanding, each trading at ₹150. What is its market capitalisation?',
    options: ['₹3,000 crore', '₹170 crore', '₹150 crore', '₹20 crore'],
    correctIndex: 0,
    explanation: 'Market cap is shares outstanding times the share price: 20 crore × ₹150 = ₹3,000 crore.',
  },
  {
    id: 'ex-b-32',
    question: 'Company A trades at ₹50 and Company B at ₹5,000. Which is the bigger company?',
    options: [
      'Company B, because its share price is higher',
      'Company A, because more people can afford its shares',
      'You cannot tell without knowing how many shares each has issued',
      'They must be the same size',
    ],
    correctIndex: 2,
    explanation: 'Share price on its own says nothing about size. Size is price times share count, which is market capitalisation.',
  },
  {
    id: 'ex-b-33',
    question: 'What are NSE trading hours for the normal equity session?',
    options: ['09:15 to 15:30 IST', '09:00 to 17:00 IST', '10:00 to 16:00 IST', '08:00 to 14:00 IST'],
    correctIndex: 0,
    explanation: 'The normal session runs 09:15 to 15:30 IST on weekdays, with a pre-open window before it.',
  },
  {
    id: 'ex-b-34',
    question: 'What is a circuit limit on a stock?',
    options: [
      'A price band beyond which trading in that stock is paused',
      'The maximum number of shares one person may own',
      'The broker’s limit on how much you can spend in a day',
      'The minimum price a share is allowed to reach',
    ],
    correctIndex: 0,
    explanation: 'Circuit limits cap how far a price can move in a session. They exist to slow panic and give information time to spread.',
  },
  {
    id: 'ex-b-35',
    question: 'Why is a company’s share price different from its book value per share?',
    options: [
      'Price reflects what buyers expect in future; book value records what the accounts say now',
      'Book value is always wrong',
      'Price includes tax and book value does not',
      'They are the same thing measured in different currencies',
    ],
    correctIndex: 0,
    explanation: 'Book value is an accounting figure of assets less liabilities. Price is a forward-looking opinion, so the two rarely match.',
  },
  {
    id: 'ex-b-36',
    question: 'What does it mean that a share is "liquid"?',
    options: [
      'It can be bought or sold quickly without moving the price much',
      'The company holds a lot of cash',
      'The share pays a dividend every month',
      'The price changes very little from day to day',
    ],
    correctIndex: 0,
    explanation: 'Liquidity is about how easily you can get in and out. An illiquid share may be hard to sell without accepting a worse price.',
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
  {
    id: 'ex-e-21',
    question: 'What does average daily traded volume tell you about a share?',
    options: [
      'How easily you could buy or sell a meaningful quantity',
      'Whether the share is cheap or expensive',
      'How much profit the company made',
      'Whether the price will rise tomorrow',
    ],
    correctIndex: 0,
    explanation: 'Volume is an indication of liquidity, not of value or direction. Thin volume makes getting out harder than getting in.',
  },
  {
    id: 'ex-e-22',
    question: 'What is a stock split?',
    options: [
      'Each share is divided into more shares, with the price adjusted down to match',
      'The company sells off one of its divisions',
      'Shareholders are paid a special dividend',
      'The company is removed from the index',
    ],
    correctIndex: 0,
    explanation: 'A split changes the share count and the price together. The value of your holding does not change at the moment of the split.',
  },
  {
    id: 'ex-e-23',
    question: 'A company announces a 1:1 bonus issue. What happens to your holding?',
    options: [
      'Your share count doubles and the price roughly halves',
      'Your share count doubles and the price stays the same',
      'You receive a cash payment equal to your holding',
      'Nothing changes at all',
    ],
    correctIndex: 0,
    explanation: 'A bonus issue capitalises reserves into new shares. You hold more shares of a proportionally smaller slice each.',
  },
  {
    id: 'ex-e-24',
    question: 'What does a sector index such as NIFTY IT let you see?',
    options: [
      'How one part of the market is moving compared with the whole',
      'Which individual stock will perform best next quarter',
      'The total profit of every IT company in India',
      'How much foreign money entered the market',
    ],
    correctIndex: 0,
    explanation: 'Sector indices let you separate a move in one industry from a move in the market as a whole.',
  },
  {
    id: 'ex-e-25',
    question: 'The whole market falls 3% and your stock falls 3%. What does that suggest?',
    options: [
      'The fall may be market-wide rather than about this company',
      'The company must have released bad news',
      'The stock is now cheap',
      'The stock has low volatility',
    ],
    correctIndex: 0,
    explanation: 'Separating market moves from company moves is the first question to ask before reacting to a fall.',
  },
  {
    id: 'ex-e-26',
    question: 'What is beta, roughly?',
    options: [
      'How much a stock tends to move relative to the market',
      'How much profit a company makes per share',
      'The dividend as a percentage of the price',
      'How long a company has been listed',
    ],
    correctIndex: 0,
    explanation: 'A beta above one has historically moved more than the market, below one less. It describes the past, not a promise.',
  },
  {
    id: 'ex-e-27',
    question: 'What is dividend yield?',
    options: [
      'The annual dividend divided by the current share price',
      'The total dividend the company has ever paid',
      'The profit per share',
      'The rise in the share price over a year',
    ],
    correctIndex: 0,
    explanation: 'Yield moves with price. A yield that looks unusually high is often a price that has fallen sharply, not generosity.',
  },
  {
    id: 'ex-e-28',
    question: 'What is a SIP?',
    options: [
      'Investing a fixed amount at regular intervals',
      'Buying a large amount at the market low',
      'A loan taken to buy shares',
      'A tax-saving deposit with a bank',
    ],
    correctIndex: 0,
    explanation: 'A Systematic Investment Plan buys at regular intervals regardless of price, which removes the need to time entries.',
  },
  {
    id: 'ex-e-29',
    question: 'Why does investing a fixed amount each month buy more units when prices fall?',
    options: [
      'Because the same money buys more when each unit costs less',
      'Because the fund gives a discount in bad months',
      'Because dividends are higher when prices fall',
      'It does not — you always buy the same number of units',
    ],
    correctIndex: 0,
    explanation: 'This is rupee cost averaging: a fixed amount buys more units cheaply and fewer when they are dear.',
  },
  {
    id: 'ex-e-30',
    question: 'Over ten years, which matters more to a compounded result?',
    options: [
      'Staying invested through the whole period',
      'Picking the exact best day to enter',
      'Checking the price every day',
      'Trading as often as possible',
    ],
    correctIndex: 0,
    explanation: 'Compounding needs time. Missing a handful of the strongest days by being out of the market has historically cost a great deal.',
  },
  {
    id: 'ex-e-31',
    question: 'What is an index fund?',
    options: [
      'A fund that simply holds the constituents of an index',
      'A fund that picks the best stocks each month',
      'A fund that only invests when the market is cheap',
      'A fund guaranteed to beat the market',
    ],
    correctIndex: 0,
    explanation: 'An index fund tracks rather than selects, which is why its costs are usually much lower than an actively managed fund.',
  },
  {
    id: 'ex-e-32',
    question: 'Why does a fund’s expense ratio matter over long periods?',
    options: [
      'It is deducted every year and compounds against you',
      'It is charged once when you buy',
      'It only applies if the fund loses money',
      'It is refunded if the fund underperforms',
    ],
    correctIndex: 0,
    explanation: 'A 1% annual charge is not 1% of your final result. It is 1% taken every year, compounding against your returns.',
  },
  {
    id: 'ex-e-33',
    question: 'A share is down 50% from its high. How much must it rise to get back to that high?',
    options: ['50%', '75%', '100%', '150%'],
    correctIndex: 2,
    explanation: 'Falling from 100 to 50 is a 50% loss, but 50 back to 100 is a 100% gain. Losses need larger gains to undo.',
  },
  {
    id: 'ex-e-34',
    question: 'What is a trading range?',
    options: [
      'A band between a support level and a resistance level where price has been moving',
      'The difference between the bid and the ask',
      'The maximum a broker will let you trade',
      'The gap between the open and the close',
    ],
    correctIndex: 0,
    explanation: 'A range describes where price has been repeatedly turning back. It describes the past and can break at any time.',
  },
  {
    id: 'ex-e-35',
    question: 'What does "past performance is not indicative of future results" mean in practice?',
    options: [
      'A strong recent run tells you little about what happens next',
      'Past returns are always reversed in the future',
      'Historical data should never be looked at',
      'Only companies with poor records are worth buying',
    ],
    correctIndex: 0,
    explanation: 'History informs your understanding of a business and its volatility. It does not forecast the next period’s return.',
  },
  {
    id: 'ex-e-36',
    question: 'Two investors earn the same 12% average, but one’s returns swing wildly. What differs?',
    options: [
      'The volatile path is harder to hold through, and withdrawals along it hurt more',
      'Nothing at all, the outcome is identical',
      'The volatile one always ends with more money',
      'The steady one pays more tax',
    ],
    correctIndex: 0,
    explanation: 'The same average can come from very different paths. Volatility matters for what you can stick with and for money taken out along the way.',
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
  {
    id: 'ex-bu-21',
    question: 'You hold five stocks, all banks. How diversified are you?',
    options: [
      'Barely — one regulatory or rate shock hits all five together',
      'Very, because five is more than one',
      'Fully, because they are different companies',
      'It depends only on how much money is in each',
    ],
    correctIndex: 0,
    explanation: 'Diversification is about uncorrelated risks, not company count. Five names in one sector share most of the same risks.',
  },
  {
    id: 'ex-bu-22',
    question: 'What is correlation between two holdings?',
    options: [
      'How much they tend to move together',
      'How much profit each makes',
      'How long you have held each',
      'The difference in their share prices',
    ],
    correctIndex: 0,
    explanation: 'Adding a holding that moves with everything you already own adds little diversification, however good the business is.',
  },
  {
    id: 'ex-bu-23',
    question: 'What is position sizing?',
    options: [
      'Deciding how much of your capital a single idea may risk',
      'Deciding which stock to buy',
      'Deciding when to sell',
      'Deciding how many different stocks to hold',
    ],
    correctIndex: 0,
    explanation: 'Sizing decides how much a wrong answer costs. It is the part of risk you control completely.',
  },
  {
    id: 'ex-bu-24',
    question: 'You risk 2% of a ₹1,00,000 portfolio on a trade with a stop 10% below entry. Roughly what position size does that imply?',
    options: ['₹20,000', '₹2,000', '₹10,000', '₹50,000'],
    correctIndex: 0,
    explanation: 'Risk of ₹2,000 divided by a 10% move gives a ₹20,000 position: size follows from the risk you accept and where you are wrong.',
  },
  {
    id: 'ex-bu-25',
    question: 'What is a stop-loss meant to do?',
    options: [
      'Define in advance where your idea is wrong and cap the loss',
      'Guarantee you never lose money',
      'Lock in a profit target',
      'Prevent the price from falling',
    ],
    correctIndex: 0,
    explanation: 'A stop is a decision made calmly beforehand. It caps a loss; in a gap or a fast market it may fill worse than the level set.',
  },
  {
    id: 'ex-bu-26',
    question: 'Why can a stop-loss fill below the price you set?',
    options: [
      'Because the market can gap past your level without trading at it',
      'Because brokers charge a penalty',
      'Because stops are only checked once a day',
      'It cannot — a stop always fills at the level',
    ],
    correctIndex: 0,
    explanation: 'A stop triggers an order; it does not reserve a price. Overnight news can open the stock well below your level.',
  },
  {
    id: 'ex-bu-27',
    question: 'What does a moving average show?',
    options: [
      'The average closing price over a set number of recent sessions',
      'The average price the company sold its products for',
      'The price the stock will move to next',
      'The average of the day’s high and low',
    ],
    correctIndex: 0,
    explanation: 'A moving average smooths noise to show a trend. It lags by construction and predicts nothing.',
  },
  {
    id: 'ex-bu-28',
    question: 'What is volume confirming a price move supposed to suggest?',
    options: [
      'That more participants were involved in the move',
      'That the move will certainly continue',
      'That the company released results',
      'That the stock is cheap',
    ],
    correctIndex: 0,
    explanation: 'Volume describes participation. A move on thin volume involved fewer people; that is information, not a forecast.',
  },
  {
    id: 'ex-bu-29',
    question: 'What is support, in chart terms?',
    options: [
      'A price area where buying has previously stopped a fall',
      'A guaranteed floor under the price',
      'The lowest price of the year',
      'A level set by the exchange',
    ],
    correctIndex: 0,
    explanation: 'Support is a place where buyers previously appeared. It describes history and is broken regularly.',
  },
  {
    id: 'ex-bu-30',
    question: 'Why is rebalancing uncomfortable in practice?',
    options: [
      'It means selling what has done well and buying what has not',
      'It always creates a loss',
      'It is prohibited for retail investors',
      'It costs more than it can ever return',
    ],
    correctIndex: 0,
    explanation: 'Rebalancing runs against recent performance, which is exactly why it is a rule rather than a judgement call.',
  },
  {
    id: 'ex-bu-31',
    question: 'What does an emergency fund have to do with investing?',
    options: [
      'It stops you having to sell investments at a bad time',
      'It increases your returns',
      'It is required before opening a demat account',
      'It replaces the need to diversify',
    ],
    correctIndex: 0,
    explanation: 'Forced selling is where real damage happens. Cash set aside means the market’s timing does not have to match yours.',
  },
  {
    id: 'ex-bu-32',
    question: 'What is drawdown?',
    options: [
      'The fall from a portfolio’s peak to its lowest point after it',
      'The amount of cash you have withdrawn',
      'The annual fee a fund charges',
      'The difference between your buy and sell price',
    ],
    correctIndex: 0,
    explanation: 'Drawdown measures the worst stretch you would have had to sit through, which is often a better test than the average return.',
  },
  {
    id: 'ex-bu-33',
    question: 'What is a bracket order?',
    options: [
      'An entry with a target and a stop attached to it',
      'An order split across several brokers',
      'An order that only fills at the open',
      'An order for a basket of stocks at once',
    ],
    correctIndex: 0,
    explanation: 'A bracket commits you to both exits at the moment of entry, before the position starts influencing your judgement.',
  },
  {
    id: 'ex-bu-34',
    question: 'What does CNC mean on an Indian broker’s ticket?',
    options: [
      'Cash and Carry — a delivery trade you can hold beyond the day',
      'A margin trade that must be closed the same day',
      'An order cancelled at the close',
      'A trade in a company not on the NSE',
    ],
    correctIndex: 0,
    explanation: 'CNC is delivery: shares go to your demat. MIS is intraday and is squared off before the session ends.',
  },
  {
    id: 'ex-bu-35',
    question: 'Why does leverage make a small adverse move dangerous?',
    options: [
      'Losses are calculated on the full position, not on the margin you put up',
      'Brokers charge extra interest on losses',
      'Leverage only magnifies gains',
      'It forces you to hold overnight',
    ],
    correctIndex: 0,
    explanation: 'Five times leverage means a 20% adverse move wipes out the margin. The gearing works in both directions.',
  },
  {
    id: 'ex-bu-36',
    question: 'What is the point of writing a trade plan before entering?',
    options: [
      'You decide while calm what you will do when you are not',
      'It guarantees the trade works',
      'Brokers require one',
      'It reduces your brokerage charges',
    ],
    correctIndex: 0,
    explanation: 'The plan is made in the only moment you are not holding the position: before you hold it.',
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
  {
    id: 'ex-a-21',
    question: 'What does the P/E ratio compare?',
    options: [
      'The share price against the earnings per share',
      'The share price against the book value',
      'Profit against revenue',
      'Debt against equity',
    ],
    correctIndex: 0,
    explanation: 'P/E says how many rupees the market pays for one rupee of annual earnings. It is a comparison, not a verdict.',
  },
  {
    id: 'ex-a-22',
    question: 'A company has a P/E of 90. What is the most accurate reading?',
    options: [
      'The market expects strong earnings growth, which may or may not arrive',
      'The company is certainly overpriced',
      'The company is losing money',
      'The company pays a high dividend',
    ],
    correctIndex: 0,
    explanation: 'A high multiple is an expectation priced in. It is a statement about the future, and the future can disappoint.',
  },
  {
    id: 'ex-a-23',
    question: 'Why is comparing P/E across different industries misleading?',
    options: [
      'Different industries have different growth rates and capital needs',
      'P/E is calculated differently in each industry',
      'Only technology companies report earnings',
      'P/E is meaningless outside banking',
    ],
    correctIndex: 0,
    explanation: 'A utility and a software company have different normal multiples. Compare like with like, or the ratio tells you nothing.',
  },
  {
    id: 'ex-a-24',
    question: 'What does the cash flow statement show that the income statement does not?',
    options: [
      'Cash actually moving in and out, rather than accounting profit',
      'The company’s total assets',
      'The number of employees',
      'The share price history',
    ],
    correctIndex: 0,
    explanation: 'Profit is an opinion shaped by accounting choices; cash is a fact. A profitable company can still run out of cash.',
  },
  {
    id: 'ex-a-25',
    question: 'What does return on equity measure?',
    options: [
      'Profit generated per rupee of shareholder capital',
      'The dividend paid per share',
      'The rise in the share price this year',
      'Revenue divided by the number of shares',
    ],
    correctIndex: 0,
    explanation: 'ROE measures how efficiently a business turns owners’ capital into profit. Heavy borrowing can flatter it.',
  },
  {
    id: 'ex-a-26',
    question: 'Why can a high ROE be misleading on its own?',
    options: [
      'It can be produced by heavy debt rather than a good business',
      'It is always an accounting error',
      'It only applies to banks',
      'It ignores revenue entirely',
    ],
    correctIndex: 0,
    explanation: 'Equity is the denominator. Borrowing shrinks it, so leverage alone can lift ROE without the business improving.',
  },
  {
    id: 'ex-a-27',
    question: 'What does the debt-to-equity ratio tell you?',
    options: [
      'How much of the business is funded by borrowing rather than by owners',
      'How much interest the company pays',
      'Whether the company is profitable',
      'How liquid the company’s shares are',
    ],
    correctIndex: 0,
    explanation: 'Debt amplifies outcomes both ways and must be serviced whether or not the business has a good year.',
  },
  {
    id: 'ex-a-28',
    question: 'A company’s operating cash flow is ₹500 crore and it spends ₹350 crore on new plant and equipment. What is its free cash flow?',
    options: ['₹150 crore', '₹850 crore', '₹500 crore', '₹350 crore'],
    correctIndex: 0,
    explanation: 'Free cash flow is operating cash flow less capital expenditure: ₹500 crore − ₹350 crore = ₹150 crore.',
  },
  {
    id: 'ex-a-29',
    question: 'What is a company’s operating margin?',
    options: [
      'Operating profit as a percentage of revenue',
      'Net profit divided by total assets',
      'Revenue growth year on year',
      'The gap between the bid and the ask',
    ],
    correctIndex: 0,
    explanation: 'Margin shows how much of each rupee of sales survives the cost of running the business.',
  },
  {
    id: 'ex-a-30',
    question: 'Revenue grew 30% but operating margin fell from 20% to 12%. What does that suggest?',
    options: [
      'Growth is costing more than it used to',
      'The company is certainly in trouble',
      'Revenue must have been misreported',
      'The share price will fall',
    ],
    correctIndex: 0,
    explanation: 'Growth bought at a falling margin is a different story from growth at a stable one. The question is whether it is investment or pressure.',
  },
  {
    id: 'ex-a-31',
    question: 'What is CAGR?',
    options: [
      'The constant annual rate that would produce the observed total growth',
      'The average of each year’s returns',
      'The best year in the period',
      'The return after tax and inflation',
    ],
    correctIndex: 0,
    explanation: 'CAGR smooths a bumpy path into one equivalent rate. It hides the volatility along the way by design.',
  },
  {
    id: 'ex-a-32',
    question: 'Why is the average of annual returns usually higher than the CAGR?',
    options: [
      'Because a loss and an equal-sized gain do not cancel out',
      'Because averages are calculated incorrectly',
      'Because CAGR ignores dividends',
      'They are always identical',
    ],
    correctIndex: 0,
    explanation: 'Down 50% then up 50% leaves you at 75, not 100. Compounding punishes volatility, and CAGR reflects that.',
  },
  {
    id: 'ex-a-33',
    question: 'What is the difference between the trailing and forward P/E?',
    options: [
      'Trailing uses reported past earnings; forward uses estimated future earnings',
      'Trailing is used in India and forward abroad',
      'Forward P/E is always lower',
      'They use different share prices',
    ],
    correctIndex: 0,
    explanation: 'A forward multiple rests on somebody’s forecast. It is only as reliable as that estimate.',
  },
  {
    id: 'ex-a-34',
    question: 'What is dilution?',
    options: [
      'New shares being issued, reducing each existing holder’s ownership share',
      'A fall in the share price',
      'A company selling a division',
      'A reduction in the dividend',
    ],
    correctIndex: 0,
    explanation: 'Your slice shrinks when the pie is cut into more pieces, even if the business itself is unchanged.',
  },
  {
    id: 'ex-a-35',
    question: 'Why does a share buyback raise earnings per share?',
    options: [
      'The same profit is divided across fewer shares',
      'The company earns more profit',
      'It raises the share price directly',
      'Buybacks reduce corporate tax',
    ],
    correctIndex: 0,
    explanation: 'EPS rises arithmetically from a smaller denominator. Whether that helped shareholders depends on the price paid.',
  },
  {
    id: 'ex-a-36',
    question: 'What is a related party transaction and why do analysts watch them?',
    options: [
      'Business done with insiders or connected entities, where terms may not be at arm’s length',
      'Any transaction with a foreign company',
      'A trade between two shareholders',
      'A transaction that must be approved by SEBI',
    ],
    correctIndex: 0,
    explanation: 'They can be entirely legitimate, but they are a place where value can quietly leave a company, so they deserve reading.',
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
  {
    id: 'ex-r-21',
    question: 'What is survivorship bias?',
    options: [
      'Judging by the winners you can see while the failures have disappeared',
      'Preferring older companies to newer ones',
      'Holding a loser too long',
      'Believing a rising stock will keep rising',
    ],
    correctIndex: 0,
    explanation: 'Success stories are the ones that get told. The people who tried the same thing and failed are not in the sample.',
  },
  {
    id: 'ex-r-22',
    question: 'Someone shows a screenshot of a 400% gain. What is missing?',
    options: [
      'Every other position they hold, and the ones they closed at a loss',
      'The name of their broker',
      'The date of the trade',
      'Nothing — the screenshot is proof',
    ],
    correctIndex: 0,
    explanation: 'A single position tells you nothing about a record. Nobody screenshots the losses, and a screenshot is trivially fabricated.',
  },
  {
    id: 'ex-r-23',
    question: 'What is the sunk cost fallacy in a portfolio?',
    options: [
      'Holding a position because of what you already lost rather than what you now expect',
      'Selling too early to lock in a gain',
      'Refusing to pay brokerage',
      'Buying only cheap shares',
    ],
    correctIndex: 0,
    explanation: 'Money already lost is gone either way. The only question that matters is what you would do with this capital today.',
  },
  {
    id: 'ex-r-24',
    question: 'What is overconfidence bias likely to do to your trading?',
    options: [
      'Increase how often you trade and how large you size',
      'Make you hold cash for too long',
      'Improve your win rate',
      'Reduce your brokerage costs',
    ],
    correctIndex: 0,
    explanation: 'A run of luck reads as skill. Frequency and size go up, and costs and risk go up with them.',
  },
  {
    id: 'ex-r-25',
    question: 'Why does a trading journal help more than remembering?',
    options: [
      'Memory rewrites what you thought at the time to match what happened',
      'A journal is required by SEBI',
      'It reduces your tax bill',
      'It guarantees better entries',
    ],
    correctIndex: 0,
    explanation: 'Hindsight edits the reasoning. Written at the time, the record cannot be quietly revised.',
  },
  {
    id: 'ex-r-26',
    question: 'What is revenge trading?',
    options: [
      'Entering again quickly to win back what you just lost',
      'Selling a stock because you dislike the company',
      'Copying a trade someone else made',
      'Trading only in the last hour of the session',
    ],
    correctIndex: 0,
    explanation: 'The next trade is chosen by the last loss rather than by the setup. It is usually where a bad day becomes a bad week.',
  },
  {
    id: 'ex-r-27',
    question: 'A tip on social media promises a guaranteed multi-bagger. What should you conclude?',
    options: [
      'Nobody can guarantee a return, and the promise itself is a warning sign',
      'They must have inside information worth following',
      'It is safe if many people are sharing it',
      'It is only a risk if the account is anonymous',
    ],
    correctIndex: 0,
    explanation: 'Guaranteed returns do not exist in equities. In India, unregistered advice is also an offence under SEBI rules.',
  },
  {
    id: 'ex-r-28',
    question: 'What is a pump and dump?',
    options: [
      'Hyping a thinly traded stock to sell into the buying it creates',
      'A company buying back its own shares',
      'An exchange pausing trading in a stock',
      'A fund rebalancing at quarter end',
    ],
    correctIndex: 0,
    explanation: 'The organisers sell into the excitement they manufactured. Low-liquidity stocks are the usual target because they move easily.',
  },
  {
    id: 'ex-r-29',
    question: 'How should you check whether an adviser is allowed to advise in India?',
    options: [
      'Look for a SEBI registration number and verify it on the SEBI site',
      'Check how many followers they have',
      'Ask whether they have made money',
      'See if they appear on television',
    ],
    correctIndex: 0,
    explanation: 'Registration is verifiable and an audience is not. SEBI publishes the list of registered investment advisers.',
  },
  {
    id: 'ex-r-30',
    question: 'What is FOMO likely to cost an investor?',
    options: [
      'Buying late, after the move, at the worst prices',
      'Missing dividends',
      'Higher brokerage rates',
      'A delay in opening an account',
    ],
    correctIndex: 0,
    explanation: 'By the time a move is impossible to ignore, much of it has happened. Fear of missing out buys the last part of it.',
  },
  {
    id: 'ex-r-31',
    question: 'What is the base rate you should ask about before following a strategy?',
    options: [
      'How the strategy has done across everyone who tried it, not just the person telling you',
      'The interest rate set by the RBI',
      'The brokerage charged per trade',
      'The dividend yield of the stock',
    ],
    correctIndex: 0,
    explanation: 'One person’s outcome is a sample of one. The useful question is what typically happens to people who do this.',
  },
  {
    id: 'ex-r-32',
    question: 'Why is a paper trading result not proof of skill?',
    options: [
      'No real money was at risk, so the emotional pressure was absent',
      'Paper trading uses wrong prices',
      'Paper trades are not recorded',
      'It is proof — simulation matches reality',
    ],
    correctIndex: 0,
    explanation: 'Simulation teaches mechanics and process well. It cannot reproduce how it feels to watch real savings fall.',
  },
  {
    id: 'ex-r-33',
    question: 'What does "risk capital" mean?',
    options: [
      'Money you could lose entirely without changing how you live',
      'Money borrowed specifically to invest',
      'The margin a broker requires',
      'Money kept aside for taxes',
    ],
    correctIndex: 0,
    explanation: 'Rent, fees and emergency money are not risk capital. Investing money you need soon forces decisions at the worst moments.',
  },
  {
    id: 'ex-r-34',
    question: 'Why is borrowing to invest especially dangerous for a beginner?',
    options: [
      'The debt is due regardless of what the investment does',
      'Interest rates always rise',
      'Borrowed money cannot be used in a demat account',
      'It increases brokerage charges',
    ],
    correctIndex: 0,
    explanation: 'A fall becomes a fall plus a repayment schedule, which removes your ability to wait.',
  },
  {
    id: 'ex-r-35',
    question: 'What is the most useful question to ask after a profitable trade?',
    options: [
      'Was the process sound, or did I get lucky?',
      'How much more could I have made?',
      'Which friend should I tell?',
      'Should I double the size next time?',
    ],
    correctIndex: 0,
    explanation: 'Good outcomes from bad process are the most expensive lessons, because they get repeated.',
  },
  {
    id: 'ex-r-36',
    question: 'What is a cooling-off rule and why might you set one?',
    options: [
      'A self-imposed pause after a big loss, so the next decision is not made while upset',
      'A SEBI rule preventing trading after a loss',
      'A broker’s limit on daily trades',
      'A tax rule about selling within a month',
    ],
    correctIndex: 0,
    explanation: 'The rule is set in advance precisely because you will not want to follow it at the moment it applies.',
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
  {
    id: 'ex-t-21',
    question: 'When is a capital gain on shares taxable?',
    options: [
      'In the year the shares are sold',
      'Every year the shares rise in value',
      'Only when the money is withdrawn from the bank',
      'When the company declares a dividend',
    ],
    correctIndex: 0,
    explanation: 'Gains are taxed on realisation. An unrealised gain on a holding you still own is not taxed.',
  },
  {
    id: 'ex-t-22',
    question: 'What is the difference between a realised and an unrealised gain?',
    options: [
      'Realised means you sold; unrealised means you still hold the position',
      'Realised means profitable; unrealised means loss-making',
      'Realised applies to shares, unrealised to mutual funds',
      'There is no difference',
    ],
    correctIndex: 0,
    explanation: 'Only a realised gain is a tax event, and only a realised loss can be set off.',
  },
  {
    id: 'ex-t-23',
    question: 'Can a short-term capital loss be set off against a long-term capital gain?',
    options: [
      'Yes — a short-term loss can be set off against either short-term or long-term gains',
      'No, losses can never be set off',
      'Only against short-term gains',
      'Only with prior approval from the assessing officer',
    ],
    correctIndex: 0,
    explanation: 'A short-term loss is the more flexible one. A long-term loss, by contrast, can only be set off against long-term gains.',
  },
  {
    id: 'ex-t-24',
    question: 'A long-term capital loss can be set off against what?',
    options: [
      'Long-term capital gains only',
      'Any head of income',
      'Salary income',
      'Short-term capital gains only',
    ],
    correctIndex: 0,
    explanation: 'The restriction runs one way: long-term losses are confined to long-term gains.',
  },
  {
    id: 'ex-t-25',
    question: 'Can a capital loss be set off against salary income?',
    options: [
      'No — a capital loss can only be set off against capital gains',
      'Yes, up to ₹2 lakh a year',
      'Yes, without any limit',
      'Only if the loss is long-term',
    ],
    correctIndex: 0,
    explanation: 'A capital loss stays within the capital gains head. It cannot reduce salary, business or other income, which is why it is carried forward instead.',
  },
  {
    id: 'ex-t-26',
    question: 'What must you do to be allowed to carry a capital loss forward?',
    options: [
      'File your income tax return by the due date',
      'Inform your broker in writing',
      'Hold the shares for at least a year',
      'Nothing — carry-forward is automatic',
    ],
    correctIndex: 0,
    explanation: 'A late return forfeits the carry-forward of the loss, which is one of the costliest routine filing mistakes.',
  },
  {
    id: 'ex-t-27',
    question: 'How are dividends from Indian companies taxed in the investor’s hands?',
    options: [
      'Added to total income and taxed at the investor’s slab rate',
      'Completely exempt',
      'Taxed at a flat 10% with no other liability',
      'Taxed only if reinvested',
    ],
    correctIndex: 0,
    explanation: 'Since the dividend distribution tax was abolished, dividends are taxed in the shareholder’s hands at slab rates.',
  },
  {
    id: 'ex-t-28',
    question: 'Does the STT you paid on a sale reduce the capital gains tax you owe?',
    options: [
      'No — STT cannot be deducted when working out capital gains',
      'Yes — it is deducted from the gain in full',
      'Yes — it is credited against the tax due',
      'Only on long-term gains',
    ],
    correctIndex: 0,
    explanation: 'The Act does not allow STT as a deduction when computing capital gains. It is a cost of trading that stays a cost. Someone taxed on trading as business income is treated differently.',
  },
  {
    id: 'ex-t-29',
    question: 'How is income from intraday equity trading normally treated?',
    options: [
      'As speculative business income, not as capital gains',
      'As long-term capital gains',
      'As exempt income',
      'As salary income',
    ],
    correctIndex: 0,
    explanation: 'Intraday equity, where no delivery is taken, is speculative business income and is taxed at slab rates.',
  },
  {
    id: 'ex-t-30',
    question: 'A speculative business loss can be set off against what?',
    options: [
      'Speculative business income only',
      'Any business income',
      'Capital gains',
      'Salary',
    ],
    correctIndex: 0,
    explanation: 'Speculative losses are ring-fenced to speculative income, and can be carried forward for four years rather than eight.',
  },
  {
    id: 'ex-t-31',
    question: 'What is the holding period test that decides short versus long term for listed equity?',
    options: [
      'The date of sale less the date of purchase, against a twelve-month threshold',
      'The calendar year in which you bought',
      'Whether you held across a financial year end',
      'The number of times you traded the stock',
    ],
    correctIndex: 0,
    explanation: 'It is the actual holding period per lot, which is why selling a few weeks early can change the rate that applies.',
  },
  {
    id: 'ex-t-32',
    question: 'You bought the same stock three times at different dates and sell part of it. Which lot is treated as sold?',
    options: [
      'The earliest purchased, on a first in first out basis',
      'The most expensive lot',
      'Whichever lot you nominate',
      'The most recently purchased',
    ],
    correctIndex: 0,
    explanation: 'FIFO applies to demat holdings, so the oldest shares are treated as sold first, which affects the holding period.',
  },
  {
    id: 'ex-t-33',
    question: 'What is advance tax?',
    options: [
      'Tax paid in instalments during the year rather than entirely at the end',
      'Tax paid on income you expect next year',
      'A deposit made when opening a demat account',
      'Tax deducted by your broker on every trade',
    ],
    correctIndex: 0,
    explanation: 'Where the liability crosses the threshold, advance tax is due in instalments; shortfalls attract interest.',
  },
  {
    id: 'ex-t-34',
    question: 'What is Form 26AS or the Annual Information Statement useful for?',
    options: [
      'Checking what the department already knows about your income and taxes paid',
      'Filing a complaint against a broker',
      'Opening a trading account',
      'Claiming a dividend',
    ],
    correctIndex: 0,
    explanation: 'Reconciling your return against it is how mismatches get caught before a notice arrives.',
  },
  {
    id: 'ex-t-35',
    question: 'Why does tax rarely justify holding a losing position?',
    options: [
      'The tax saved is a fraction of the loss taken to save it',
      'Losses cannot be claimed at all',
      'Selling a loser increases your tax',
      'Tax rules forbid selling at a loss',
    ],
    correctIndex: 0,
    explanation: 'The tax tail should not wag the investment dog. A decision to hold must stand on its own merits first.',
  },
  {
    id: 'ex-t-36',
    question: 'Under the old regime, which section covers deductions such as ELSS, PPF and life insurance premiums?',
    options: ['Section 80C', 'Section 80D', 'Section 24', 'Section 10(38)'],
    correctIndex: 0,
    explanation: 'Section 80C covers that group of deductions under the old regime. The new default regime forgoes most such deductions for lower slab rates.',
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
/**
 * Draws one paper.
 *
 * Each bank holds far more questions than a paper asks, and `recentlySeen`
 * carries the ids served on recent attempts. Questions the learner has not met
 * are drawn first, so a retake is a fresh set rather than the same twenty in a
 * new order — which is what a learner got when every bank held exactly twenty.
 *
 * When the unseen pool runs dry the seen ones are shuffled back in, so a
 * determined retaker always gets a full paper.
 */
export const buildExamAttempt = (
  exam: StageExam,
  random: () => number = Math.random,
  recentlySeen: string[] = [],
): ExamQuestion[] => {
  const shuffle = <T,>(items: T[]): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const seen = new Set(recentlySeen);
  const fresh = shuffle(exam.questions.filter((question) => !seen.has(question.id)));
  const repeats = shuffle(exam.questions.filter((question) => seen.has(question.id)));

  return [...fresh, ...repeats].slice(0, EXAM_LENGTH).map((question) => {
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

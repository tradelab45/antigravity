import express from "express";
import path from "path";
import fs from "fs";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createAuthLimiter } from './src/server/authRateLimit';
import { configureTrustProxy } from './src/server/proxy';
import { FALLBACK_GOOGLE_CLIENT_ID, isGoogleClientId } from './src/config/google';
import { createAcademyService } from './src/server/academyService';
import { createMarketDataRouter } from './src/server/routes/market-data';
import { createScreenerRouter } from './src/server/routes/screener';
import { createTradesRouter } from './src/server/routes/trading-simulator';
import { createAdminRouter } from './src/server/routes/admin';
import { clientKey, consume, reset as resetRateLimit, type RateLimitRule } from './src/server/rateLimit';
import { readJson, updateJson, writeJsonAtomic } from './src/server/jsonStore';
import {
  CODE_TTL_MS,
  peekChallenge,
  discardChallenge,
  issueChallenge,
  maskEmail,
  reissueCode,
  verifyChallenge,
  type ChallengePurpose,
} from './src/server/otp';
import { deliverCode, deliveryMode, otpRequired } from './src/server/otpDelivery';
import { checkPassword } from './src/utils/passwordPolicy';
import {
  INITIAL_CAPITAL as INITIAL_LEDGER_CAPITAL,
  emptyLedger,
  executeOrder,
  orderPage,
  portfolioValue as computePortfolioValue,
  sanitiseLedger,
  squareOffIntraday,
  syncView,
  type Ledger,
  type LedgerOrder,
} from './src/server/ledger';
import {
  DEFAULT_CLASS_DAYS,
  createRoom,
  extendRoom,
  generateClassCode,
  memberHandle,
  normaliseClassCode,
  roomExpired,
  sanitiseRooms,
  type ClassRoom,
} from './src/server/classRooms';
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  issueSession,
  readSession,
  revokeAllSessionsForUser,
  revokeSession,
  rotateSessionsForUser,
  sessionCookieOptions,
  sessionSecretIsPersistent,
} from './src/server/sessions';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3005;

// Health check endpoints for Cloud Run & load balancers (FIRST)
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});
app.get("/livez", (req, res) => {
  res.status(200).send("OK");
});

app.use(express.json());
// Who the caller is, when the app sits behind a hosting provider's proxy. See
// src/server/proxy.ts: without it every visitor shared the proxy's address.
configureTrustProxy(app);
// The Academy authenticates through the same signed session as everything
// else. It had a session store and a logout route of its own, and that route
// was registered here, ahead of the real one: signing out answered from the
// Academy's handler and the app's session was never revoked.
const academyService = createAcademyService(
  path.join(process.cwd(), 'data', 'academy.json'),
  (req) => sessionUser(req)?.id ?? null,
);
app.use('/api/academy', academyService.router);
app.use('/api/auth', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });


// Initialize Gemini client lazily/safely
let genAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAI;
}



// Market data: the Upstox, Yahoo Finance and Google Finance feeds, the NSE stock
// catalogue and every /api/stocks, /api/upstox, /api/indian-stock-api,
// /api/google-finance and /api/market route live in
// src/server/routes/market-data.ts. That module owns the live stock list, so the
// screener route below reads it through getStocks and the shutdown handler closes
// the feed through stopFeed.
const marketData = createMarketDataRouter();
app.use(marketData.router);

// Screener.in company data. The route lives in the screener module; it reads
// the live stock list through the market-data getter rather than a snapshot.
app.use(createScreenerRouter({ getStocks: () => marketData.getStocks() }));


// In-memory caches to prevent quota exhaustion and reduce API latency
const DEFAULT_MARKET_NEWS = [
  { id: 'news-1', headline: 'NSE Nifty 50 trades resiliently as domestic mutual funds inject steady SIP capital', source: 'Dalal Street Wire', time: '20m ago', tag: 'NIFTY 50', sentiment: 'BULLISH' },
  { id: 'news-2', headline: 'Banking & Auto leaders gain momentum on positive quarterly credit expansion data', source: 'Financial Express', time: '1h ago', tag: 'SECTOR TREND', sentiment: 'BULLISH' },
  { id: 'news-3', headline: 'FIIs maintain disciplined asset allocation in Indian large-caps amidst global cues', source: 'Mint Market Desk', time: '2h ago', tag: 'FII / DII', sentiment: 'NEUTRAL' },
  { id: 'news-4', headline: 'Clean Energy & EV infrastructure players see surging long-term investor interest', source: 'Economic Times', time: '3h ago', tag: 'CLEAN ENERGY', sentiment: 'BULLISH' }
];

let cachedMarketPulse: { text: string; timestamp: number } | null = {
  text: "The Indian market is showing strong fundamentals today with steady domestic retail participation!",
  timestamp: Date.now()
};
let cachedMarketNews: { news: any[]; timestamp: number } | null = {
  news: DEFAULT_MARKET_NEWS,
  timestamp: Date.now()
};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Helper to extract a clean, concise error message without dumping raw JSON
function getCleanErrorMessage(err: any): string {
  if (!err) return "Unknown error";
  let msg = err.message || (typeof err === "string" ? err : "");
  let code = err.status || err.code || err?.error?.code;

  if (typeof msg === "string" && msg.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.error) {
        msg = parsed.error.message || msg;
        code = parsed.error.code || code;
      }
    } catch {
      // not JSON
    }
  }

  if (code === 429 || String(msg).includes("429") || String(msg).toLowerCase().includes("quota") || String(msg).toLowerCase().includes("rate limit")) {
    return "Rate limit / quota exceeded (429)";
  }
  if (code === 503 || String(msg).includes("503") || String(msg).toLowerCase().includes("high demand") || String(msg).toLowerCase().includes("unavailable")) {
    return "Model high demand spike (503)";
  }
  return String(msg).slice(0, 120) || "API error";
}

// Resilient Gemini generator with model fallback for 503 / 429 spikes
async function callGeminiWithFallback(
  prompt: string,
  systemPrompt: string,
  temperature = 0.7,
  useSearch = false
): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");
  }

  const primaryModel = "gemini-3.8-flash";
  const secondaryModel = "gemini-3.7-flash";
  const fallbackModel = "gemini-3.1-flash-lite";

  try {
    const config: any = {
      systemInstruction: systemPrompt,
      temperature,
    };
    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: prompt,
      config,
    });

    if (response && response.text) {
      return response.text;
    }
    throw new Error("Empty response from AI");
  } catch (err: any) {
    // Fallback 1: Try gemini-3.7-flash
    try {
      const response37 = await ai.models.generateContent({
        model: secondaryModel,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          temperature,
        },
      });
      if (response37 && response37.text) return response37.text;
    } catch {
      // Fallback 2: Try flash-lite model if primary and secondary have transient failure
      try {
        const responseLite = await ai.models.generateContent({
          model: fallbackModel,
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            temperature,
          },
        });
        if (responseLite && responseLite.text) return responseLite.text;
      } catch {
        // All models unavailable
      }
    }
    
    throw err || new Error("All Gemini model attempts failed");
  }
}

function getRuleBasedChatReply(message: string, context?: any): string {
  const lower = message.toLowerCase();
  let reply = "Namaste young investor! I am Chanakya Jr., your Dalal Street mentor (powered by Gemini 3.8 Flash intelligence). ";
  
  if (lower.includes("audit") || lower.includes("review my portfolio") || lower.includes("portfolio audit")) {
    const holdingsCount = context?.holdingsCount || (context?.holdings ? context.holdings.length : 0);
    const cash = context?.cashBalance || 1000000;
    const pv = context?.portfolioValue || 1000000;
    const cashPct = Math.round((cash / (pv || 1)) * 100);
    
    reply += `\n\n### 🛡️ **Dalal Street Portfolio Audit Report**\n` +
      `- **Total Portfolio Equity:** ₹${Number(pv).toLocaleString('en-IN')}\n` +
      `- **Available Cash Buffer:** ₹${Number(cash).toLocaleString('en-IN')} (${cashPct}%)\n` +
      `- **Holdings Active:** ${holdingsCount} equities\n\n` +
      `**Chanakya's Diagnostic:** ${holdingsCount === 0 ? "You're 100% in cash! Safe, but missing out on compound growth. Start small with Nifty 50 anchors (Reliance, HDFC Bank, TCS)." : holdingsCount < 3 ? "⚠️ **Concentration Alert:** You have fewer than 3 stocks. If one suffers a quarterly dip, your portfolio suffers. Diversify across IT, Banking, FMCG, and Auto!" : "🟢 **Healthy Breadth:** Good job spreading capital! Ensure no single position exceeds 20% of your total virtual capital."}\n\n` +
      `*Golden Rule: Always keep 15-20% cash ready for buying the dips during market corrections!*`;
  } else if (lower.includes("gemini") || lower.includes("3.8") || lower.includes("flash") || lower.includes("model")) {
    reply += "⚡ **Gemini 3.8 Flash Architecture:** I am powered by Google's cutting-edge Gemini 3.8 Flash multimodal reasoning model! It provides ultra-fast sub-second latency, grounded real-time Google Search data for Dalal Street indices, financial report parsing, and bilingual Hindi/English explanations tailored for teen investors.";
  } else if (lower.includes("breakout") || lower.includes("rsi") || lower.includes("macd") || lower.includes("technical")) {
    reply += "📈 **Technical Analysis Mastery:**\n" +
      "1. **RSI (Relative Strength Index):** Below 30 = *Oversold* (Bargain alert!), Above 70 = *Overbought* (Caution, pullback risk!).\n" +
      "2. **20 EMA & 50 DMA Breakouts:** When a stock's price crosses above its 20 Exponential Moving Average with high trading volume, bulls have taken charge!\n" +
      "3. **Stop-Loss Rule:** Never enter a technical breakout without a strict 2-3% stop loss. Cut your losses early and let your winners run!";
  } else if (lower.includes("option") || lower.includes("f&o") || lower.includes("greek") || lower.includes("call") || lower.includes("put")) {
    reply += "🎯 **Options & Greeks Demystified:**\n" +
      "- **Call Option (CE):** You bet the stock price will rise above the strike price.\n" +
      "- **Put Option (PE):** You bet the stock price will drop below the strike price.\n" +
      "- **Delta:** How much the option price moves for every ₹1 move in the underlying stock.\n" +
      "- **Theta (Time Decay):** Options lose value every day you hold them, like an ice cube melting in the sun! Over 90% of retail options buyers lose money. Start with equity delivery (CNC) before exploring F&O!";
  } else if (lower.includes("tax") || lower.includes("stcg") || lower.includes("ltcg") || lower.includes("budget")) {
    reply += "🏛️ **Indian Stock Market Taxation (Latest Rules):**\n" +
      "1. **STCG (Short-Term Capital Gains):** If you sell shares held for *under 12 months*, profit is taxed at **20%**.\n" +
      "2. **LTCG (Long-Term Capital Gains):** If you hold for *over 12 months*, gains up to ₹1,25,000 per year are completely **tax-free**! Any profit above ₹1.25 Lakhs is taxed at a low **12.5%**.\n" +
      "💡 *Lesson:* The Indian tax code rewards long-term investors and taxes short-term traders more heavily!";
  } else if (lower.includes("namaste") || lower.includes("hindi") || lower.includes("हिंदी") || lower.includes("kaise") || lower.includes("shuru")) {
    reply += "🙏 **नमस्ते युवा निवेशक!**\n" +
      "दलाल स्ट्रीट में आपका स्वागत है। याद रखें: **'जो धैर्य रखता है, बाजार उसका मित्र बन जाता है।'**\n" +
      "- कभी भी एक ही शेयर में अपना सारा पैसा न लगाएं (विविधीकरण रखें)।\n" +
      "- निफ्टी 50 की मजबूत कंपनियों (जैसे रिलायंस, टीसीएस, एचडीएफसी) में समझदारी से वर्चुअल ₹10 लाख का निवेश अभ्यास करें।\n" +
      "आप मुझसे हिंदी या इंग्लिश किसी भी भाषा में शेयर बाजार के सवाल पूछ सकते हैं!";
  } else if (lower.includes("pe") || lower.includes("p/e") || lower.includes("price to earnings")) {
    reply += "💡 **P/E Ratio Explained Simply:** Imagine a Lemonade Stand that makes ₹10 profit every year. If the owner asks you to pay ₹150 to buy the stand, the P/E ratio is 150 ÷ 10 = 15! It tells you how many rupees you are paying for every ₹1 of company profit. A high P/E (like Zomato at 114) means investors expect massive future growth, while a low P/E (like SBI at 9.8) means you're getting a bargain!";
  } else if (lower.includes("52 week") || lower.includes("high") || lower.includes("low")) {
    reply += "📈 **52-Week High & Low:** This is the highest and lowest price a stock traded at over the past 365 days. If a stock is near its 52-week High, it has strong momentum (bulls are winning). If it is near its 52-week Low, it might either be on a mega-sale or facing temporary problems!";
  } else if (lower.includes("diversif") || lower.includes("portfolio") || lower.includes("risk") || lower.includes("allocate")) {
    reply += "🛡️ **Golden Rule of Diversification:** 'Never put all your samosas in one paper bag!' If the bag drops, all samosas are ruined. In the stock market, spread your ₹10,00,000 across different sectors (like Banking + IT + FMCG + Auto + Clean Energy) so if one sector drops, your other sectors protect your capital!";
  } else if (lower.includes("compounding") || lower.includes("sip") || lower.includes("growth")) {
    reply += "🚀 **The Superpower of Compounding:** Albert Einstein called compounding the 8th wonder of the world! If you invest ₹5,000 every month in an index fund generating 13% annual returns, after 25 years your ₹15 Lakhs invested transforms into over ₹1.1 Crore! Time in the market beats timing the market!";
  } else if (lower.includes("zomato") || lower.includes("reliance") || lower.includes("tcs") || lower.includes("tata")) {
    reply += "📊 **Stock Comparison Tip:** Look at the company fundamentals! Large-caps like **Reliance** and **TCS** offer steady dividends, strong cash flows, and lower volatility. High-growth consumer tech like **Zomato** (Blinkit) offers thrilling expansion but carries higher valuation multiples (P/E > 100). A smart rookie balances both!";
  } else if (lower.includes("dividend") || lower.includes("cash")) {
    reply += "💰 **How Dividends Work:** When companies like ITC, TCS, or Infosys make big annual profits, they reward shareholders with direct cash deposits into their bank accounts. It is like earning rent on real estate or pocket money from your investments!";
  } else {
    reply += `Great question about "${message}"! Remember: investing is not gambling—it is owning a slice of real Indian businesses like Reliance, TCS, or Tata Motors. Always check company profits, P/E ratio, and debt before making a trade. You have ₹10,00,000 virtual cash in your RupeeRookie account to experiment safely without losing real money!`;
  }
  return reply;
}

function getRuleBasedStockAnalysis(stock: any): string {
  const isCheap = stock.peRatio < stock.industryPe;
  const isNearHigh = (stock.price / stock.high52) > 0.88;
  const isNearLow = (stock.price / stock.low52) < 1.15;
  
  return `### 🔍 Teen Investor Breakdown: **${stock.name} (${stock.symbol})**

1. 🍕 **The Business & Brand Power**
- **What they do:** Leading power in the **${stock.sector}** space.
- **Brands you recognize:** ${stock.popularBrands && stock.popularBrands.length ? stock.popularBrands.join(', ') : stock.name}.
- **Why it matters:** ${stock.teenSummary || stock.description}

2. 📊 **The Numbers Decoded**
- **Valuation (P/E Ratio):** Currently **${stock.peRatio}** vs Industry average of **${stock.industryPe}** (${isCheap ? '🟢 Attractively valued compared to peers' : '🟡 Trading at a growth premium'}).
- **52-Week Range:** ₹${stock.price} (52W High: ₹${stock.high52} | 52W Low: ₹${stock.low52}). ${isNearHigh ? '🚀 Near 52-week highs with strong momentum.' : isNearLow ? '🏷️ Trading close to 52-week lows (potential value buy or turnaround candidate).' : '⚖️ Trading comfortably in a stable consolidation channel.'}
- **Market Cap:** ₹${(stock.marketCapCr).toLocaleString('en-IN')} Crores. Dividend Yield: **${stock.dividendYield}%**.

3. 🎯 **The Rookie Verdict**
- **Strengths:** ${stock.strengths?.slice(0, 2).join(' • ') || 'Dominant market presence'}
- **Key Risks:** ${stock.risks?.slice(0, 2).join(' • ') || 'Sectoral market fluctuations'}
- **Strategy:** ${isCheap ? 'A solid defensive pick with favorable valuation.' : 'A high-momentum growth company best accumulated on market dips.'}`;
}

// 4. Gemini AI "Chanakya Jr. / Teen Financial Mentor" powered by Gemini 3.8 Flash
app.get("/api/gemini/status", (_req, res) => {
  const configured = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    configured,
    model: 'gemini-3.8-flash',
    modelName: 'Gemini 3.8 Flash',
    speed: 'Ultra-Fast Reasoning',
    mode: configured ? 'gemini-3.8-flash-grounded' : 'offline-educational',
    searchGrounding: configured,
    features: [
      'Gemini 3.8 Flash Ultra-Fast Reasoning',
      'Google Search Live Market Grounding',
      'NSE Technicals & Fundamental Moats',
      'Automated Portfolio Risk Audits',
      'Bilingual Hindi & English Mentorship',
    ],
    checkedAt: new Date().toISOString(),
  });
});

app.post("/api/gemini/chat", async (req, res) => {
  // These spend the operator's Gemini quota, and were reachable by anyone who
  // could reach the server. They are features for a signed-in learner, so they
  // now need a session and a cap.
  if (!sessionUser(req)) return res.status(401).json({ error: "Sign in first." });
  if (rateLimited(res, `ai:${clientKey(req.ip)}`, AI_LIMIT,
    "You have used the AI coach a lot in the last hour. Try again later.")) return;

  const { message, context, portfolioContext, history = [] } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: "Message prompt is required" });
  }

  const combinedContext = context || portfolioContext;

  const systemPrompt = `You are 'Chanakya Jr.', a friendly, wise, witty, and deeply knowledgeable Indian Financial Mentor for teenagers (ages 13-19) on the RupeeRookie stock simulator app, powered by Gemini 3.8 Flash.
Your goals:
1. Explain complex financial concepts (P/E ratio, 52-week High/Low, Market Cap in Crores, Dividend Yield, Order types, Balance sheet, Sector cycles, Options Greeks like Delta and Theta) using relatable teen analogies (pizza slices, FIFA/gaming XP, cricket batting averages, pocket money, smartphone brands).
2. Teach disciplined investing principles (Diversification, Long-term compounding, 2% risk management rule, avoiding FOMO & F&O gambler traps).
3. Connect concepts to famous Indian brands teens recognize (Tata Motors Nexon EV, Zomato & Blinkit, Jio 5G, Classmate stationery by ITC, Maggi by Nestle, Fastrack watches by Titan).
4. Provide up-to-date real-time market insights using Google Search grounding for latest NSE prices, earnings reports, and Union Budget tax policies (STCG 20%, LTCG 12.5% over ₹1.25L).
5. Support bilingual communication seamlessly: answer in Hindi, Hinglish, or English depending on how the user addresses you.
6. Keep the tone encouraging, energetic, educational, and easy to read with crisp formatting (bullet points, bold highlights, emojis).
7. Always remind them this is educational virtual simulation money (₹10,00,000 sandbox cash) to build lifelong financial wisdom.

Context about the user's current portfolio:
${combinedContext ? JSON.stringify(combinedContext) : 'None provided'}
`;

  try {
    const ai = getGeminiClient();
    if (!ai) throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");

    // Construct multi-turn chat history
    const contents: any[] = [];
    for (const msg of history) {
      if (msg.id === 'welcome' || msg.id === 'error' || !msg.sender) continue;
      const role = msg.sender === 'user' ? 'user' : 'model';
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += `\n\n${msg.text}`;
      } else {
          contents.push({ role, parts: [{ text: msg.text }] });
      }
    }
    
    // Add current user message
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
       contents[contents.length - 1].parts[0].text += `\n\n${message}`;
    } else {
       contents.push({ role: 'user', parts: [{ text: message }] });
    }

    let responseText = "";
    let responseMode = 'gemini-3.8-flash-grounded';
    let responseSources: Array<{ title: string; url?: string }> = [];
    
    // Primary attempt: Gemini 3.8 Flash with Google Search Grounding
    try {
      const primaryRes = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          tools: [{ googleSearch: {} }],
        },
      });
      if (primaryRes && primaryRes.text) {
        responseText = primaryRes.text;
        responseMode = 'gemini-3.8-flash-grounded';
        const chunks = (primaryRes as any)?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        responseSources = chunks.map((chunk: any) => ({ title: chunk?.web?.title || 'Google Search result', url: chunk?.web?.uri })).filter((source: any) => source.url).slice(0, 4);
        if (responseSources.length === 0) responseSources = [{ title: 'Gemini 3.8 Flash · Google Search Grounded' }];
      }
    } catch {
      // Secondary fallback: Gemini 3.7 Flash
      try {
        const secondaryRes = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
            tools: [{ googleSearch: {} }],
          },
        });
        if (secondaryRes && secondaryRes.text) {
          responseText = secondaryRes.text;
          responseMode = 'gemini-3.7-flash-grounded';
          responseSources = [{ title: 'Gemini 3.7 Flash · Google Search' }];
        }
      } catch {
        // Tertiary fallback: Gemini 3.1 Flash Lite
        try {
          const fallbackRes = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7,
            },
          });
          if (fallbackRes && fallbackRes.text) {
            responseText = fallbackRes.text;
            responseMode = 'gemini-3.1-flash-lite';
            responseSources = [{ title: 'Gemini 3.1 Flash-Lite · Model output' }];
          }
        } catch {
          // Handled by rule-based fallback below
        }
      }
    }

    if (responseText) {
      return res.json({ 
        text: responseText, 
        mode: responseMode, 
        model: 'gemini-3.8-flash',
        sources: responseSources, 
        generatedAt: new Date().toISOString() 
      });
    } else {
      throw new Error("Empty response from AI");
    }
  } catch {
    const fallbackText = getRuleBasedChatReply(message, combinedContext);
    return res.json({ 
      text: fallbackText, 
      reply: fallbackText, 
      mode: 'offline-educational', 
      model: 'gemini-3.8-flash-rule-engine',
      sources: [{ title: 'Chanakya Dalal Street Intelligence Engine' }], 
      generatedAt: new Date().toISOString() 
    });
  }
});

// Dedicated Portfolio Health Audit with Gemini 3.8 Flash
app.post("/api/gemini/portfolio-audit", async (req, res) => {
  if (!sessionUser(req)) return res.status(401).json({ error: "Sign in first." });
  if (rateLimited(res, `ai:${clientKey(req.ip)}`, AI_LIMIT,
    "You have used the AI coach a lot in the last hour. Try again later.")) return;

  const { holdings = [], cashBalance = 1000000, portfolioValue = 1000000 } = req.body;
  
  const auditPrompt = `Conduct a comprehensive Dalal Street Portfolio Audit for a student investor on RupeeRookie.
Current Cash: ₹${cashBalance}
Total Portfolio Value: ₹${portfolioValue}
Holdings: ${JSON.stringify(holdings)}

Evaluate:
1. Sector Diversification Score (0 to 100).
2. Risk Concentration Alert (is any single stock >25% of capital?).
3. Top 3 Strengths of their allocation.
4. Top 2 Vulnerabilities & suggested hedges (e.g. adding IT, Banking, or FMCG).
5. Chanakya's Golden Sutra for this specific portfolio.
Format with clear markdown, bold stats, and encouraging mentorship tone.`;

  const systemPrompt = `You are 'Chanakya Jr.', powered by Gemini 3.8 Flash. Provide expert, encouraging, realistic Indian equity portfolio diagnostics for teen and beginner investors.`;

  try {
    const analysis = await callGeminiWithFallback(auditPrompt, systemPrompt, 0.5, true);
    return res.json({ success: true, audit: analysis, model: 'gemini-3.8-flash' });
  } catch {
    const holdingsCount = holdings.length;
    const cashPct = Math.round((cashBalance / (portfolioValue || 1)) * 100);
    
    let auditScore = 70;
    if (holdingsCount >= 4) auditScore += 15;
    if (cashPct >= 10 && cashPct <= 40) auditScore += 15;
    if (holdingsCount === 1) auditScore -= 25;

    const fallbackAudit = `### 🛡️ Chanakya Portfolio Diagnostic (Powered by Gemini 3.8 Flash Engine)
**Overall Health Score:** **${auditScore}/100** ${auditScore >= 80 ? '🟢 Excellent' : auditScore >= 60 ? '🟡 Balanced' : '🔴 High Concentration Risk'}

1. 📊 **Asset Allocation Health**
- **Virtual Net Worth:** ₹${Number(portfolioValue).toLocaleString('en-IN')}
- **Cash Buffer:** ₹${Number(cashBalance).toLocaleString('en-IN')} (${cashPct}% dry powder)
- **Active Positions:** ${holdingsCount} equities

2. ⚠️ **Risk & Diversification Breakdown**
${holdingsCount === 0 
  ? '• Your portfolio is currently 100% in cash. You have maximum safety but zero inflation defense! Consider deploying virtual capital into Nifty 50 compounders like Reliance, TCS, or HDFC Bank.'
  : holdingsCount < 3 
  ? `• **High Concentration Risk:** You only hold ${holdingsCount} stock(s). If one company experiences quarterly pullbacks, your whole portfolio takes the hit. Aim for 4 to 6 non-correlated sectors.`
  : '• **Solid Breadth:** You are spreading your virtual capital across multiple companies, mitigating single-stock volatility.'}

3. 🎯 **Chanakya's Actionable Prescriptions**
- **The 20% Single-Stock Cap:** Ensure no single company occupies more than ₹2,00,000 (20%) of your total capital.
- **Maintain 15% Cash Cushion:** Keep at least ₹1,50,000 in cash to capitalize on market-wide flash corrections.
- **Sector Rotation:** Pair cyclical growth (Auto, Metals) with steady defensive anchors (FMCG, IT Services).

*💡 "ज्ञान और विविधीकरण ही बाजार में आपकी सबसे बड़ी ढाल हैं।"*`;

    return res.json({ success: true, audit: fallbackAudit, model: 'gemini-3.8-flash-rule-engine' });
  }
});

// 5. Stock Deep AI Analysis for teens
app.post("/api/gemini/analyze-stock", async (req, res) => {
  if (!sessionUser(req)) return res.status(401).json({ error: "Sign in first." });
  if (rateLimited(res, `ai:${clientKey(req.ip)}`, AI_LIMIT,
    "You have used the AI coach a lot in the last hour. Try again later.")) return;

  const { stock } = req.body;
  if (!stock) {
    return res.status(400).json({ error: "Stock data is required" });
  }

  const prompt = `Give a high-impact, 3-section Teen Investor Report on ${stock.name} (${stock.symbol}):
Current Price: ₹${stock.price}, 52W High: ₹${stock.high52}, 52W Low: ₹${stock.low52}, P/E: ${stock.peRatio}, Industry P/E: ${stock.industryPe}, Market Cap: ₹${stock.marketCapCr} Cr, Dividend Yield: ${stock.dividendYield}%.
Brands: ${stock.popularBrands?.join(", ")}.

Break it down into:
1. 🍕 **The Business & Brand Power** (What they sell & why people pay them)
2. 📊 **The Numbers (P/E & 52-Week High/Low decoded)**
3. 🎯 **The Rookie Verdict** (Why a teenager should or shouldn't add this to their simulated portfolio)`;

  const systemPrompt = "You are Chanakya Jr., a teen stock analyst. Use bold bullet points and clear, engaging language.";

  try {
    const analysis = await callGeminiWithFallback(prompt, systemPrompt, 0.6);
    return res.json({ analysis });
  } catch {
    const fallbackAnalysis = getRuleBasedStockAnalysis(stock);
    return res.json({ analysis: fallbackAnalysis });
  }
});

// 3. AI-generated Market Pulse (with 10-minute cache)
app.get("/api/market-pulse", async (req, res) => {
  const now = Date.now();
  if (cachedMarketPulse && (now - cachedMarketPulse.timestamp < CACHE_TTL_MS)) {
    return res.json({ success: true, pulse: cachedMarketPulse.text, cached: true });
  }

  try {
    const prompt = "Based on today's Indian stock market, give a single, energetic 1-sentence summary of the overall market sentiment for teen investors. Use simple words.";
    const systemPrompt = "You are an Indian stock market mentor for teenagers. Return only a 1-sentence energetic market pulse.";
    
    let summary = "The market is showing a mix of steady growth and exciting new opportunities today!";
    
    try {
      const generated = await callGeminiWithFallback(prompt, systemPrompt, 0.7);
      if (generated) {
        summary = generated.replace(/\n/g, ' ').trim();
      }
    } catch {
      // Fallback below
    }
    
    cachedMarketPulse = { text: summary, timestamp: now };
    res.json({ success: true, pulse: summary });
  } catch {
    const fallback = "The market is full of action today, keep an eye on your favorite stocks!";
    cachedMarketPulse = { text: fallback, timestamp: now };
    res.json({ success: true, pulse: fallback });
  }
});

// 6. Real-time Market News (with 10-minute cache)
app.get("/api/market-news", async (req, res) => {
  const now = Date.now();
  if (cachedMarketNews && (now - cachedMarketNews.timestamp < CACHE_TTL_MS)) {
    return res.json({ success: true, news: cachedMarketNews.news, cached: true });
  }

  try {
    const ai = getGeminiClient();
    if (!ai) throw new Error("GEMINI_API_KEY_NOT_CONFIGURED");

    const prompt = `Fetch the top 4 latest financial news headlines relevant to the NSE (National Stock Exchange of India). 
Return ONLY a valid JSON array of 4 objects, each matching this exact schema: 
[{"id": "news-1", "headline": "Headline text", "source": "Source Name", "time": "2h ago", "tag": "NIFTY 50", "sentiment": "BULLISH"}]`;

    let newsData: any[] | null = null;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      });
      if (response && response.text) {
        newsData = JSON.parse(response.text);
      }
    } catch {
      try {
        const responseLite = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        });
        if (responseLite && responseLite.text) {
          newsData = JSON.parse(responseLite.text);
        }
      } catch {
        // Fallback to curated news
      }
    }

    if (Array.isArray(newsData) && newsData.length > 0) {
      cachedMarketNews = { news: newsData, timestamp: now };
      return res.json({ success: true, news: newsData });
    } else {
      throw new Error("No structured news received");
    }
  } catch {
    cachedMarketNews = { news: DEFAULT_MARKET_NEWS, timestamp: now };
    res.json({ success: true, news: DEFAULT_MARKET_NEWS });
  }
});

// ==========================================
// 7. USER AUTHENTICATION & SPREADSHEET / NOTEBOOKLLM EXPORT
// ==========================================

interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  passwordHash?: string;
  // Set when the account signed up or was linked through Google Sign-In.
  googleId?: string;
  // Kept temporarily so existing local prototype accounts can be migrated on login.
  password?: string;
  phone?: string;
  ageGroup?: string;
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  initialCapital: number;
  registeredAt: string;
  lastLoginAt: string;
  portfolioValue?: number;
  totalTrades?: number;
  isAdmin?: boolean;
  role?: 'ADMIN' | 'USER';
  /** The class board this learner joined, uppercased. Absent means none. */
  classCode?: string;
  /**
   * What this learner's browser last reported.
   *
   * Trades run entirely on the device — the server never sees an order — so
   * these are reported figures, not measured ones. They are named `reported`
   * so nothing downstream can mistake them for the server's own accounting,
   * and the board says as much on screen.
   */
  reportedPortfolioValue?: number;
  reportedTrades?: number;
  reportedAt?: string;
}

const USERS_FILE = path.join(process.cwd(), "data", "users.json");
/**
 * Password for the seeded account — which is the owner's, since it carries
 * the address in ADMIN_EMAILS.
 *
 * It was a hardcoded literal, so every deployment shipped with the owner
 * account open to anyone who read the source. It then became random per
 * process unless DEMO_ACCOUNT_PASSWORD was set, and that locked the owner out
 * for good: the random hash was written to users.json the first time anyone
 * signed up, and a stored hash always won, so setting the variable afterwards
 * changed nothing.
 *
 * OWNER_PASSWORD (or the older DEMO_ACCOUNT_PASSWORD) is now authoritative
 * whenever it is set, over any stored hash — it is the operator's way back
 * into the owner account. Without it the account keeps whatever password it
 * has, or, having none, one nobody knows. Hashed once here rather than on
 * every read of the user file.
 */
const CONFIGURED_OWNER_PASSWORD = (process.env.OWNER_PASSWORD || process.env.DEMO_ACCOUNT_PASSWORD || "").trim() || null;
if (CONFIGURED_OWNER_PASSWORD && CONFIGURED_OWNER_PASSWORD.length < 12) {
  console.warn("[auth] OWNER_PASSWORD is shorter than 12 characters. It protects an administrator account.");
}
const OWNER_PASSWORD_HASH = hashPassword(CONFIGURED_OWNER_PASSWORD || randomBytes(24).toString("hex"));

const ADMIN_EMAILS = ["aaravvjain23@gmail.com"];
const ADMIN_USERNAMES = ["aaravvjain23@gmail.com", "aarav", "aarav_trader"];

function isUserAdminAccount(user: { email?: string; username?: string; isAdmin?: boolean; role?: string } | null | undefined): boolean {
  if (!user) return false;
  const email = (user.email || "").trim().toLowerCase();
  const username = (user.username || "").trim().toLowerCase();
  if (ADMIN_EMAILS.includes(email) || ADMIN_USERNAMES.includes(username)) return true;
  if ((user.isAdmin === true || user.role === "ADMIN") && ADMIN_EMAILS.includes(email)) return true;
  return false;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password: string, user: StoredUser): boolean {
  if (user.passwordHash) {
    const [salt, storedKey] = user.passwordHash.split(":");
    if (!salt || !storedKey) return false;

    const suppliedKey = scryptSync(password, salt, 64);
    const storedBuffer = Buffer.from(storedKey, "hex");
    return suppliedKey.length === storedBuffer.length && timingSafeEqual(suppliedKey, storedBuffer);
  }

  // Legacy accounts from earlier builds used plain text. A successful login
  // migrates the value to scrypt immediately below.
  return Boolean(user.password && user.password === password);
}

function toSafeUser(user: StoredUser) {
  const safeUser = { ...user };
  delete safeUser.password;
  delete safeUser.passwordHash;
  safeUser.isAdmin = isUserAdminAccount(user);
  safeUser.role = safeUser.isAdmin ? "ADMIN" : "USER";
  return safeUser;
}

// Ensure data folder exists
try {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch {
  // directory creation handled
}

function loadUsers(): StoredUser[] {
  try {
    if (fs.existsSync(USERS_FILE) || fs.existsSync(`${USERS_FILE}.bak`)) {
      const users = readJson<StoredUser[]>(USERS_FILE, null);
      if (!Array.isArray(users)) return seedUsers();
      return users.map((user) => {
        if (user.id === "usr_rookie_demo" && (CONFIGURED_OWNER_PASSWORD || (!user.passwordHash && !user.password))) {
          const { password: _legacy, ...rest } = user;
          return { ...rest, passwordHash: OWNER_PASSWORD_HASH };
        }
        return user;
      });
    }
  } catch {
    // fallback
  }
  return seedUsers();
}

/** The account a fresh install starts with. */
function seedUsers(): StoredUser[] {
  return [
    {
      id: "usr_rookie_demo",
      fullName: "Aarav Jain",
      email: "aaravvjain23@gmail.com",
      username: "aarav_trader",
      passwordHash: OWNER_PASSWORD_HASH,
      phone: "",
      ageGroup: "16-18 (Teen Investor)",
      experienceLevel: "BEGINNER",
      initialCapital: 1000000,
      registeredAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      lastLoginAt: new Date().toISOString(),
      portfolioValue: 1000000,
      totalTrades: 0
    }
  ];
}

function saveUsers(users: StoredUser[]): void {
  try {
    writeJsonAtomic(USERS_FILE, users);
  } catch (err) {
    console.error("Error saving users to disk:", err);
  }
}

// ==========================================
// TRADES PERSISTENCE & AUDIT LEDGER
// ==========================================

export interface StoredTrade {
  id: string;
  orderId?: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  symbol: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'GTT';
  productType: 'CNC' | 'MIS';
  quantity: number;
  price: number;
  totalAmount: number;
  timestamp: string;
  status: 'EXECUTED' | 'PENDING' | 'CANCELLED';
  realizedPnL?: number;
}

const TRADES_FILE = path.join(process.cwd(), "data", "trades.json");

function getInitialTrades(): StoredTrade[] {
  const now = Date.now();
  return [
    {
      id: "TRD-10921",
      orderId: "ORD-9812",
      userId: "usr_rookie_demo",
      userName: "Aarav Jain",
      userEmail: "aaravvjain23@gmail.com",
      symbol: "RELIANCE",
      stockName: "Reliance Industries Ltd.",
      type: "BUY",
      orderType: "MARKET",
      productType: "CNC",
      quantity: 10,
      price: 2985.40,
      totalAmount: 29854.00,
      timestamp: new Date(now - 12 * 60 * 1000).toISOString(),
      status: "EXECUTED",
      realizedPnL: 0
    },
    {
      id: "TRD-10920",
      orderId: "ORD-9811",
      userId: "usr_rookie_demo",
      userName: "Aarav Jain",
      userEmail: "aaravvjain23@gmail.com",
      symbol: "TCS",
      stockName: "Tata Consultancy Services",
      type: "BUY",
      orderType: "LIMIT",
      productType: "CNC",
      quantity: 5,
      price: 3940.80,
      totalAmount: 19704.00,
      timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
      status: "EXECUTED",
      realizedPnL: 0
    },
    {
      id: "TRD-10919",
      orderId: "ORD-9805",
      userId: "usr_rookie_demo",
      userName: "Aarav Jain",
      userEmail: "aaravvjain23@gmail.com",
      symbol: "TATAMOTORS",
      stockName: "Tata Motors Ltd.",
      type: "SELL",
      orderType: "MARKET",
      productType: "CNC",
      quantity: 10,
      price: 984.50,
      totalAmount: 9845.00,
      timestamp: new Date(now - 90 * 60 * 1000).toISOString(),
      status: "EXECUTED",
      realizedPnL: 450.00
    },
    {
      id: "TRD-10918",
      orderId: "ORD-9799",
      userId: "usr_rookie_demo",
      userName: "Aarav Jain",
      userEmail: "aaravvjain23@gmail.com",
      symbol: "HDFCBANK",
      stockName: "HDFC Bank Ltd.",
      type: "BUY",
      orderType: "MARKET",
      productType: "CNC",
      quantity: 20,
      price: 1742.60,
      totalAmount: 34852.00,
      timestamp: new Date(now - 180 * 60 * 1000).toISOString(),
      status: "EXECUTED",
      realizedPnL: 0
    },
    {
      id: "TRD-10917",
      orderId: "ORD-9792",
      userId: "usr_rookie_demo",
      userName: "Aarav Jain",
      userEmail: "aaravvjain23@gmail.com",
      symbol: "ZOMATO",
      stockName: "Zomato Ltd.",
      type: "BUY",
      orderType: "MARKET",
      productType: "MIS",
      quantity: 50,
      price: 262.80,
      totalAmount: 13140.00,
      timestamp: new Date(now - 240 * 60 * 1000).toISOString(),
      status: "EXECUTED",
      realizedPnL: 0
    },
    {
      id: "TRD-10916",
      orderId: "ORD-9788",
      userId: "usr_rookie_demo",
      userName: "Aarav Jain",
      userEmail: "aaravvjain23@gmail.com",
      symbol: "INFY",
      stockName: "Infosys Ltd.",
      type: "BUY",
      orderType: "MARKET",
      productType: "CNC",
      quantity: 15,
      price: 1845.20,
      totalAmount: 27678.00,
      timestamp: new Date(now - 360 * 60 * 1000).toISOString(),
      status: "EXECUTED",
      realizedPnL: 0
    }
  ];
}

function loadTrades(): StoredTrade[] {
  try {
    const parsed = readJson<StoredTrade[]>(TRADES_FILE, null);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fallback
  }
  const initial = getInitialTrades();
  saveTrades(initial);
  return initial;
}

function saveTrades(trades: StoredTrade[]): void {
  try {
    writeJsonAtomic(TRADES_FILE, trades);
  } catch (err) {
    console.error("Error saving trades to disk:", err);
  }
}

// User Signup
/**
 * Reads one cookie off the request.
 *
 * Written out rather than pulling in cookie-parser: the app needs exactly one
 * cookie, and a dependency for that is not worth the supply chain.
 */
function readCookie(req: express.Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    if (part.slice(0, index).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

/** Signs the browser in: sets the session cookie and answers with the account. */
function grantSession(
  res: express.Response,
  user: StoredUser,
  extra: Record<string, unknown> = {},
  issued: { token: string; expiresAt: number } = issueSession(user.id),
) {
  const { token, expiresAt } = issued;
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  res.json({
    success: true,
    user: toSafeUser(user),
    session: { expiresAt, verified: true },
    ...extra,
  });
}

/**
 * The account behind the request's session cookie, or null.
 *
 * Routes that act on an account use this rather than a userId from the body:
 * a body is whatever the caller typed, a session is something this server
 * issued and can refuse.
 */
function sessionUser(req: express.Request): StoredUser | null {
  const claims = readSession(readCookie(req, SESSION_COOKIE));
  if (!claims) return null;
  return loadUsers().find(u => u.id === claims.userId) || null;
}

/**
 * Starts the verification step for a sign-in whose first factor has already
 * passed, and answers the request.
 *
 * The account is deliberately not returned here. Until the code comes back the
 * caller holds nothing but an opaque challenge id and a masked address, so a
 * stolen password or a replayed Google credential is not by itself a session.
 */
async function beginVerification(
  res: express.Response,
  user: StoredUser,
  purpose: ChallengePurpose,
): Promise<void> {
  const { challengeId, code, expiresAt } = issueChallenge(user.id, user.email, purpose);
  const outcome = await deliverCode(user.email, code, expiresAt);

  if (!outcome.delivered) {
    // Fail closed. A code that could not be sent must not become an optional
    // step, or the second factor is whatever the attacker prefers.
    discardChallenge(challengeId);
    res.status(503).json({
      success: false,
      message: outcome.message || "The verification code could not be sent. Try again shortly.",
    });
    return;
  }

  res.json({
    success: true,
    requiresVerification: true,
    challengeId,
    maskedEmail: maskEmail(user.email),
    expiresInSeconds: Math.round(CODE_TTL_MS / 1000),
    // Present only when OTP_DEV_ECHO is on outside production.
    ...(outcome.devCode ? { devCode: outcome.devCode } : {}),
  });
}

/**
 * Throttles for the sign-in surface. Every one of these routes could be tried
 * as fast as the server would answer, which is how a six-digit code or a weak
 * password gets guessed.
 *
 * Each route is limited twice: once on the caller's address, and once on the
 * account being targeted. The address rule stops one machine working through a
 * list of accounts; the account rule stops a spread of addresses working on one
 * account. A successful sign-in clears the account counter, so a person who
 * mistypes a password four times and then gets it right is not left blocked.
 */
/** The AI routes spend the operator's quota, so they get a cap of their own. */
const AI_LIMIT: RateLimitRule = { limit: 40, windowMs: 60 * 60_000 };

// The address rules are sized for a classroom, not a person. A school or
// college puts every learner behind one network address, so a rule that
// assumed one person per address blocked the thirty-first student in the room
// — and before the proxy fix, the whole site. What stops a password being
// guessed is the per-account rule, which stays tight; the address rules are a
// flood guard.
const AUTH_LIMITS: Record<string, RateLimitRule> = {
  loginIp: { limit: 200, windowMs: 15 * 60_000 },
  loginAccount: { limit: 8, windowMs: 15 * 60_000 },
  signupIp: { limit: 120, windowMs: 60 * 60_000 },
  googleIp: { limit: 200, windowMs: 15 * 60_000 },
  otpRequest: { limit: 60, windowMs: 15 * 60_000 },
  otpVerify: { limit: 200, windowMs: 15 * 60_000 },
  classJoin: { limit: 120, windowMs: 15 * 60_000 },
  // A reset code is an email to someone's inbox, so the account rule is the
  // one that stops a person being flooded; the address rule, like the others,
  // allows for a classroom behind one address.
  passwordResetIp: { limit: 60, windowMs: 60 * 60_000 },
  passwordResetAccount: { limit: 5, windowMs: 60 * 60_000 },
};

/**
 * Applies one rule and answers the request itself when the caller is over it.
 * Returns true when the request should stop here.
 */
function rateLimited(
  res: express.Response,
  key: string,
  rule: RateLimitRule,
  message: string,
): boolean {
  const verdict = consume(key, rule);
  if (verdict.allowed) return false;
  res.set("Retry-After", String(verdict.retryAfterSeconds));
  res.status(429).json({
    success: false,
    message,
    retryAfterSeconds: verdict.retryAfterSeconds,
  });
  return true;
}

app.post("/api/auth/signup", createAuthLimiter(150, 60 * 60 * 1000), async (req, res) => {
  try {
    const caller = clientKey(req.ip);
    if (rateLimited(res, `signup:ip:${caller}`, AUTH_LIMITS.signupIp,
      "Too many accounts created from here. Try again later.")) return;

    const { fullName, email, username, password, phone, ageGroup, experienceLevel } = req.body;
    if (!fullName || !email || !username || !password) {
      return res.status(400).json({ success: false, message: "Full name, email, username, and password are required." });
    }

    const cleanFullName = String(fullName).trim().slice(0, 80);
    const cleanEmail = String(email).trim().toLowerCase().slice(0, 120);
    const cleanUsername = String(username).trim().toLowerCase().slice(0, 30);
    const cleanPassword = String(password);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      return res.status(400).json({ success: false, message: "Username must be 3–30 characters using letters, numbers, or underscores." });
    }
    // A length rule alone let `password` and `12345678` through. The policy
    // also refuses the account's own name, username and email, which are the
    // first guesses anyone trying this account already has.
    const strength = checkPassword(cleanPassword, {
      fullName: cleanFullName,
      username: cleanUsername,
      email: cleanEmail,
    });
    if (!strength.ok) {
      return res.status(400).json({ success: false, message: strength.message });
    }

    const users = loadUsers();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername);
    
    if (existing) {
      return res.status(400).json({ success: false, message: "An account with this email or username already exists." });
    }

    const newUser: StoredUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      fullName: cleanFullName,
      email: cleanEmail,
      username: cleanUsername,
      passwordHash: hashPassword(cleanPassword),
      phone: String(phone || "").trim().slice(0, 24),
      ageGroup: ageGroup || "13-17 (Teen)",
      experienceLevel: ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(experienceLevel) ? experienceLevel : "BEGINNER",
      initialCapital: 1000000,
      registeredAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      portfolioValue: 1000000,
      totalTrades: 0
    };

    users.unshift(newUser);
    saveUsers(users);

    // Automatically push record to Google Sheets in the background if configured
    const webhookUrl = 
      process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
      process.env.GOOGLE_SHEETS_URL ||
      process.env.SHEETS_URL ||
      process.env.GOOGLE_SHEET_URL ||
      process.env.SHEET_URL ||
      process.env.WEBHOOK_URL ||
      process.env.GOOGLE_SCRIPT_URL;

    if (webhookUrl && (webhookUrl.startsWith("http://") || webhookUrl.startsWith("https://"))) {
      try {
        const payload = {
          userId: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          username: newUser.username,
          phone: newUser.phone || "",
          ageGroup: newUser.ageGroup || "16-18 (Teen)",
          experienceLevel: newUser.experienceLevel || "BEGINNER",
          initialCapital: newUser.initialCapital || 1000000,
          registeredAt: newUser.registeredAt,
          timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          source: "RupeeRookie Simulator"
        };

        fetch(webhookUrl, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(payload),
          redirect: "follow"
        })
        .then(async (sheetRes) => {
          if (!sheetRes.ok) {
            console.warn(`[Google Sheets Webhook] Response status: ${sheetRes.status} ${sheetRes.statusText}`);
          } else {
            console.log(`[Google Sheets Webhook] Successfully delivered user signup for ${newUser.email}`);
          }
        })
        .catch((err) => {
          console.warn("[Google Sheets Webhook] Network Notice:", err.message);
        });
      } catch (err: any) {
        console.warn("[Google Sheets Webhook] Sync exception:", err.message);
      }
    }

    grantSession(res, newUser, { message: "Account created successfully!" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to register user" });
  }
});

// User Login
app.post("/api/auth/login", createAuthLimiter(300), async (req, res) => {
  try {
    const caller = clientKey(req.ip);
    if (rateLimited(res, `login:ip:${caller}`, AUTH_LIMITS.loginIp,
      "Too many sign-in attempts from here. Try again later.")) return;

    const { identifier, password } = req.body;
    if (typeof identifier !== 'string' || identifier.length > 120 || typeof password !== 'string' || password.length > 128 || !identifier || !password) {
      return res.status(400).json({ success: false, message: "Email or username and password are required." });
    }

    const cleanId = identifier.toLowerCase().trim();
    // Keyed on what was typed rather than on the resolved account, so the
    // counter also covers attempts against an identifier that does not exist.
    if (rateLimited(res, `login:id:${cleanId}`, AUTH_LIMITS.loginAccount,
      "Too many sign-in attempts for this account. Try again later.")) return;

    const users = loadUsers();
    const user = users.find(
      u => u.email.toLowerCase() === cleanId || 
           u.username.toLowerCase() === cleanId ||
           (u.id === 'usr_rookie_demo' && (cleanId === 'xyz@gmail.com' || cleanId === 'aaravvjain23@gmail.com' || cleanId === 'rookie_trader' || cleanId === 'aarav_trader'))
    );

    if (!user || !verifyPassword(String(password), user)) {
      return res.status(401).json({ success: false, message: "Invalid email/username or password." });
    }

    if (!user.passwordHash) {
      user.passwordHash = hashPassword(String(password));
      delete user.password;
    }
    user.lastLoginAt = new Date().toISOString();
    saveUsers(users);

    // The run of failures is over, so the account counter starts again.
    resetRateLimit(`login:id:${cleanId}`);

    if (otpRequired()) {
      await beginVerification(res, user, "login");
      return;
    }

    grantSession(res, user, { message: `Welcome back, ${user.fullName}!` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Login failed" });
  }
});

/**
 * Exchanges a verification code for the account.
 *
 * Wrong codes are counted twice over: the challenge itself allows five before
 * it is destroyed, and the caller's address is capped separately so a stream
 * of fresh challenges cannot be used to walk the keyspace.
 */
app.post("/api/auth/otp/verify", (req, res) => {
  try {
    const caller = clientKey(req.ip);
    if (rateLimited(res, `otp:verify:${caller}`, AUTH_LIMITS.otpVerify,
      "Too many verification attempts. Try again later.")) return;

    const { challengeId, code } = req.body;
    if (!challengeId || typeof challengeId !== "string" || !code) {
      return res.status(400).json({ success: false, message: "A verification code is required." });
    }
    if (!/^\d{4,8}$/.test(String(code).trim())) {
      return res.status(400).json({ success: false, message: "That code does not look right." });
    }

    // Checked before the code is, because verifying consumes the challenge:
    // a reset code offered here would otherwise be refused and destroyed at
    // once, and the person would have to start the reset over.
    if (peekChallenge(challengeId)?.purpose === "reset") {
      return res.status(400).json({
        success: false,
        message: "That code is for resetting a password, not for signing in.",
      });
    }

    const result = verifyChallenge(challengeId, String(code));
    if (!result.ok) {
      const message =
        result.reason === "expired" ? "That code has expired. Ask for a new one." :
        result.reason === "exhausted" ? "Too many wrong codes. Start the sign-in again." :
        result.reason === "unknown" ? "That sign-in is no longer pending. Start again." :
        `That code is not right. ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? "" : "s"} left.`;
      return res.status(401).json({ success: false, message, attemptsLeft: result.attemptsLeft });
    }

    const users = loadUsers();
    const user = users.find(u => u.id === result.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "That account no longer exists." });
    }

    user.lastLoginAt = new Date().toISOString();
    saveUsers(users);

    grantSession(res, user, { message: `Welcome back, ${user.fullName}!` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Verification failed" });
  }
});

/**
 * Sends a fresh code for a sign-in already in progress. The old code stops
 * working immediately, so a resend never leaves two live codes on one account.
 */
app.post("/api/auth/otp/resend", async (req, res) => {
  try {
    const caller = clientKey(req.ip);
    if (rateLimited(res, `otp:resend:${caller}`, AUTH_LIMITS.otpRequest,
      "Too many codes requested. Try again later.")) return;

    const { challengeId } = req.body;
    if (!challengeId || typeof challengeId !== "string") {
      return res.status(400).json({ success: false, message: "That sign-in is no longer pending. Start again." });
    }

    const reissued = reissueCode(challengeId);
    if (!reissued) {
      return res.status(410).json({ success: false, message: "That sign-in is no longer pending. Start again." });
    }

    const outcome = await deliverCode(reissued.email, reissued.code, reissued.expiresAt);
    if (!outcome.delivered) {
      discardChallenge(challengeId);
      return res.status(503).json({
        success: false,
        message: outcome.message || "The verification code could not be sent.",
      });
    }

    res.json({
      success: true,
      maskedEmail: maskEmail(reissued.email),
      expiresInSeconds: Math.round(CODE_TTL_MS / 1000),
      ...(outcome.devCode ? { devCode: outcome.devCode } : {}),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Could not resend the code" });
  }
});

/** Abandons a pending sign-in, so its code cannot be used later. */
app.post("/api/auth/otp/cancel", (req, res) => {
  const { challengeId } = req.body;
  if (challengeId && typeof challengeId === "string") discardChallenge(challengeId);
  res.json({ success: true });
});

/**
 * Class boards.
 *
 * A teacher hands out a code, learners join it, and the board lists who is in
 * it with what their own browser reports. Nothing here is verified: the
 * simulator executes trades on the device, so a figure can be edited by anyone
 * willing to open developer tools. The board is for a class to see itself,
 * not for deciding a prize, and the UI says so.
 */
const CLASSES_FILE = path.join(process.cwd(), "data", "classes.json");

/**
 * Boards created through /api/class/create, keyed by code.
 *
 * A code that predates this file has no entry and keeps working exactly as it
 * did — anyone with it can join, and nobody can manage it. Inventing an owner
 * for such a board would hand control to whichever learner happened to join
 * first, so it stays unmanaged until a teacher creates a fresh code.
 */
// Through the same store as the ledgers. Written straight over the file, a
// crash mid-write left it unparseable, the read answered {} and the next save
// made that permanent: every teacher's board gone at once.
function loadRooms(): Record<string, ClassRoom> {
  try {
    return sanitiseRooms(readJson<unknown>(CLASSES_FILE, {}));
  } catch (err) {
    console.error("[classes] could not be read:", err);
    return {};
  }
}

function saveRooms(rooms: Record<string, ClassRoom>): void {
  try {
    writeJsonAtomic(CLASSES_FILE, rooms);
  } catch (err) {
    console.error("[classes] could not be written:", err);
  }
}

/** The board's record, or null for a code nobody created here. */
const roomFor = (code: string): ClassRoom | null => loadRooms()[code] || null;

/** First name plus a last initial: enough to find yourself, not a directory. */
const boardDisplayName = (fullName: string): string => {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Learner";
  if (parts.length === 1) return parts[0].slice(0, 24);
  return `${parts[0].slice(0, 20)} ${parts[parts.length - 1][0].toUpperCase()}.`;
};

app.post("/api/class/join", (req, res) => {
  const caller = clientKey(req.ip);
  if (rateLimited(res, `class:join:${caller}`, AUTH_LIMITS.classJoin,
    "Too many attempts. Try again later.")) return;

  // The account comes from the session, never from the body: a userId in a
  // request is whatever the caller typed, so taking it on trust let anyone
  // join, report for or remove any other learner.
  const signedIn = sessionUser(req);
  if (!signedIn) return res.status(401).json({ success: false, message: "Sign in first." });
  if (isPublicDemo(signedIn)) {
    return res.status(403).json({
      success: false,
      message: "The demo account is shared, so it can't join a class board. Sign up to join yours.",
    });
  }

  const code = normaliseClassCode(req.body?.classCode);
  if (!code) {
    return res.status(400).json({
      success: false,
      message: "A class code is 4 to 16 letters, numbers or hyphens.",
    });
  }

  const users = loadUsers();
  const user = users.find(u => u.id === signedIn.id);
  if (!user) return res.status(404).json({ success: false, message: "Account not found." });

  // A board created here has a door. One that predates the registry does not,
  // and keeps letting anyone in, because that is what it has always done.
  const room = roomFor(code);
  if (room) {
    if (roomExpired(room)) {
      return res.status(410).json({
        success: false,
        message: "That class board has finished. Ask your teacher for this year's code.",
      });
    }
    if (room.removed.includes(memberHandle(room, user.id))) {
      return res.status(403).json({
        success: false,
        message: "Your teacher removed you from that board. Ask them to let you back in.",
      });
    }
  }

  user.classCode = code;
  saveUsers(users);
  res.json({ success: true, classCode: code, managed: Boolean(room), message: `Joined ${code}.` });
});

/**
 * Creates a class board a teacher owns.
 *
 * Owning one is what makes the controls possible: removing somebody who
 * should not be on it, and an end date so that next year's class does not
 * inherit last year's board. A code already in use cannot be claimed — the
 * learners on it did not agree to be managed by whoever asked first.
 */
app.post("/api/class/create", (req, res) => {
  const caller = clientKey(req.ip);
  if (rateLimited(res, `class:create:${caller}`, AUTH_LIMITS.otpRequest,
    "Too many boards created from here. Try again later.")) return;

  const owner = sessionUser(req);
  if (!owner) return res.status(401).json({ success: false, message: "Sign in first." });
  // Every visitor on the shared demo is the same account, so a board it
  // created would be owned by all of them: any of them could remove its
  // students or delete it.
  if (isPublicDemo(owner)) {
    return res.status(403).json({
      success: false,
      message: "The demo account is shared, so it can't own a class board. Sign up to create one.",
    });
  }

  const rooms = loadRooms();
  const requested = req.body?.classCode ? normaliseClassCode(req.body.classCode) : null;
  if (req.body?.classCode && !requested) {
    return res.status(400).json({
      success: false,
      message: "A class code is 4 to 16 letters, numbers or hyphens.",
    });
  }

  const users = loadUsers();
  const inUse = (code: string) =>
    Boolean(rooms[code]) || users.some(u => u.classCode === code);

  let code = requested;
  if (code) {
    if (inUse(code)) {
      return res.status(409).json({
        success: false,
        message: `${code} is already in use. Choose another code.`,
      });
    }
  } else {
    // A generated code has to be one nobody is using, and the loop has to end
    // even in the unlikely case that it keeps colliding.
    for (let attempt = 0; attempt < 20 && !code; attempt += 1) {
      const candidate = generateClassCode();
      if (!inUse(candidate)) code = candidate;
    }
    if (!code) {
      return res.status(503).json({ success: false, message: "Could not find a free code. Try again." });
    }
  }

  const room = createRoom(code, owner.id, Number(req.body?.days) || DEFAULT_CLASS_DAYS);
  rooms[code] = room;
  saveRooms(rooms);

  // The teacher joins their own board, so they appear on it like everyone else.
  const account = users.find(u => u.id === owner.id);
  if (account) {
    account.classCode = code;
    saveUsers(users);
  }

  res.json({
    success: true,
    classCode: code,
    expiresAt: room.expiresAt,
    message: `Class board ${code} is open. Share the code with your class.`,
  });
});

app.post("/api/class/leave", (req, res) => {
  const signedIn = sessionUser(req);
  if (!signedIn) return res.status(401).json({ success: false, message: "Sign in first." });

  const users = loadUsers();
  const user = users.find(u => u.id === signedIn.id);
  if (!user) return res.status(404).json({ success: false, message: "Account not found." });

  delete user.classCode;
  delete user.reportedPortfolioValue;
  delete user.reportedTrades;
  delete user.reportedAt;
  saveUsers(users);
  res.json({ success: true, message: "Left the class board." });
});

/** The learner's own device reports where it has got to. */
app.post("/api/class/report", (req, res) => {
  // Per learner. Keyed on the address, one school's network shared sixty
  // reports an hour between every student in it.
  const signedIn = sessionUser(req);
  if (signedIn && rateLimited(res, `class:report:${signedIn.id}`, { limit: 60, windowMs: 60 * 60_000 },
    "Too many updates. Try again later.")) return;

  if (!signedIn) return res.status(401).json({ success: false, message: "Sign in first." });

  const { portfolioValue, totalTrades } = req.body || {};
  const users = loadUsers();
  const user = users.find(u => u.id === signedIn.id);
  if (!user) return res.status(404).json({ success: false, message: "Account not found." });
  if (!user.classCode) {
    return res.status(409).json({ success: false, message: "Join a class board first." });
  }

  const value = Number(portfolioValue);
  const trades = Number(totalTrades);
  // Bounds rather than trust: a figure outside what the simulator can produce
  // is refused, so the board cannot be decorated with an absurd number.
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000) {
    return res.status(400).json({ success: false, message: "That portfolio value is out of range." });
  }
  if (!Number.isFinite(trades) || trades < 0 || trades > 100_000) {
    return res.status(400).json({ success: false, message: "That trade count is out of range." });
  }

  user.reportedPortfolioValue = Math.round(value);
  user.reportedTrades = Math.round(trades);
  user.reportedAt = new Date().toISOString();
  saveUsers(users);
  res.json({ success: true });
});

app.get("/api/class/:code/board", (req, res) => {
  const caller = clientKey(req.ip);
  if (rateLimited(res, `class:board:${caller}`, { limit: 120, windowMs: 15 * 60_000 },
    "Too many requests. Try again later.")) return;

  const code = normaliseClassCode(req.params.code);
  if (!code) return res.status(400).json({ success: false, message: "That is not a class code." });

  // The server now holds the ledger, so a member who has traded through it has
  // a figure this server computed rather than one their browser claimed. A
  // member with no ledger — an older account, or one used only on a static
  // build — still falls back to what they reported, and each row says which
  // of the two it is.
  const ledgers = loadLedgers();
  const quotes = quoteMap();
  const room = roomFor(code);
  const viewer = sessionUser(req);
  const isOwner = Boolean(room && viewer && room.ownerId === viewer.id);

  const members = loadUsers()
    .filter(u => u.classCode === code)
    // No email, no username, no id: a code is not a key to a directory. The
    // handle is meaningless off this board and is what the owner removes by,
    // so managing a board never needs an account id on the wire.
    .map(u => {
      const handle = room ? memberHandle(room, u.id) : undefined;
      const ledger = ledgers[u.id];
      if (ledger) {
        return {
          name: boardDisplayName(u.fullName),
          handle,
          portfolioValue: computePortfolioValue(ledger, quotes),
          trades: ledger.orders.length,
          updatedAt: ledger.updatedAt,
          verified: true,
        };
      }
      return {
        name: boardDisplayName(u.fullName),
        handle,
        portfolioValue: u.reportedPortfolioValue ?? null,
        trades: u.reportedTrades ?? null,
        updatedAt: u.reportedAt ?? null,
        verified: false,
      };
    })
    .sort((a, b) => (b.portfolioValue ?? -1) - (a.portfolioValue ?? -1));

  res.json({
    success: true,
    classCode: code,
    members,
    // True only when every row came from a ledger this server executed.
    verified: members.length > 0 && members.every(member => member.verified),
    note: "Rows marked unverified were reported by a learner's own browser rather than executed here.",
    // A board nobody created here has no owner and no end date, and the UI
    // says as much rather than implying a teacher is holding it.
    managed: Boolean(room),
    owner: isOwner,
    expiresAt: room?.expiresAt ?? null,
    expired: room ? roomExpired(room) : false,
  });
});

/** Everything only the teacher who created the board may do. */
function ownedRoom(req: express.Request, res: express.Response): ClassRoom | null {
  const code = normaliseClassCode(req.params.code);
  if (!code) {
    res.status(400).json({ success: false, message: "That is not a class code." });
    return null;
  }

  const user = sessionUser(req);
  if (!user) {
    res.status(401).json({ success: false, message: "Sign in first." });
    return null;
  }

  const room = loadRooms()[code];
  if (!room) {
    res.status(404).json({
      success: false,
      message: "That board was not created here, so it has no teacher controls.",
    });
    return null;
  }
  // Checked against the session, never against anything in the request: an
  // ownerId in a body is whatever the caller typed.
  if (room.ownerId !== user.id) {
    res.status(403).json({ success: false, message: "Only the teacher who created this board can do that." });
    return null;
  }
  return room;
}

/**
 * Removes a member, by the handle the board published for them.
 *
 * They stay removed: rejoining with the code is refused until the teacher
 * readmits them, or the board would only be as closed as the learner's
 * patience.
 */
app.post("/api/class/:code/remove", (req, res) => {
  const room = ownedRoom(req, res);
  if (!room) return;

  const handle = String(req.body?.handle || "").trim();
  if (!/^[a-f0-9]{12}$/.test(handle)) {
    return res.status(400).json({ success: false, message: "That is not a member of this board." });
  }
  if (handle === memberHandle(room, room.ownerId)) {
    return res.status(400).json({ success: false, message: "You cannot remove yourself from your own board." });
  }

  const users = loadUsers();
  const member = users.find(u => u.classCode === room.code && memberHandle(room, u.id) === handle);
  if (!member) {
    return res.status(404).json({ success: false, message: "That learner is not on this board." });
  }

  delete member.classCode;
  delete member.reportedPortfolioValue;
  delete member.reportedTrades;
  delete member.reportedAt;
  saveUsers(users);

  const rooms = loadRooms();
  const stored = rooms[room.code];
  if (stored && !stored.removed.includes(handle)) {
    stored.removed.push(handle);
    saveRooms(rooms);
  }

  res.json({ success: true, message: "Removed from the board." });
});

/** Lets a removed learner back in. */
app.post("/api/class/:code/readmit", (req, res) => {
  const room = ownedRoom(req, res);
  if (!room) return;

  const handle = String(req.body?.handle || "").trim();
  const rooms = loadRooms();
  const stored = rooms[room.code];
  if (!stored) return res.status(404).json({ success: false, message: "That board no longer exists." });

  stored.removed = stored.removed.filter(entry => entry !== handle);
  saveRooms(rooms);
  res.json({ success: true, message: "They can join the board again with the code." });
});

/** Pushes the end date out, for a board that is still being used. */
app.post("/api/class/:code/extend", (req, res) => {
  const room = ownedRoom(req, res);
  if (!room) return;

  const rooms = loadRooms();
  rooms[room.code] = extendRoom(room, Number(req.body?.days) || DEFAULT_CLASS_DAYS);
  saveRooms(rooms);
  res.json({ success: true, expiresAt: rooms[room.code].expiresAt, message: "The board stays open." });
});

/**
 * Closes the board for good.
 *
 * Everyone on it is taken off, because a board nobody can join and nobody can
 * manage would otherwise sit on thirty accounts forever.
 */
app.delete("/api/class/:code", (req, res) => {
  const room = ownedRoom(req, res);
  if (!room) return;

  const users = loadUsers();
  let touched = 0;
  for (const user of users) {
    if (user.classCode !== room.code) continue;
    delete user.classCode;
    delete user.reportedPortfolioValue;
    delete user.reportedTrades;
    delete user.reportedAt;
    touched += 1;
  }
  if (touched > 0) saveUsers(users);

  const rooms = loadRooms();
  delete rooms[room.code];
  saveRooms(rooms);

  res.json({ success: true, message: `Class board ${room.code} is closed.`, removed: touched });
});

/**
 * Who the server thinks is signed in.
 *
 * The client renders from a cached copy for speed, then asks this. If the
 * answer is no, the cached copy is dropped — the browser's opinion of who it
 * is stops being the last word.
 */
app.get("/api/auth/session", (req, res) => {
  const claims = readSession(readCookie(req, SESSION_COOKIE));
  if (!claims) {
    return res.status(401).json({ success: false, authenticated: false });
  }

  const user = loadUsers().find(u => u.id === claims.userId);
  if (!user) {
    // The account went away under a live session.
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    return res.status(401).json({ success: false, authenticated: false });
  }

  res.json({
    success: true,
    authenticated: true,
    user: toSafeUser(user),
    session: {
      expiresAt: claims.expiresAt,
      verified: true,
      // False when SESSION_SECRET is unset: the secret is then random per
      // boot, so a restart signs everyone out. Worth surfacing to an operator.
      durable: sessionSecretIsPersistent(),
      ttlMs: SESSION_TTL_MS,
    },
  });
});

/**
 * The shared practice account behind the landing page's demo button.
 *
 * The button used to sign in to xyz@gmail.com with the password "demo". That
 * alias belonged to the seeded account, which is the owner's — administrator
 * email and all — so the button could only ever have worked by publishing the
 * owner's password, and once that password stopped being a literal it never
 * worked at all.
 *
 * This account is separate. It has no password, because there is nothing to
 * protect with one: anybody may use it, and the button says so. It is not an
 * administrator, it cannot be deleted or have a password set, it cannot join a
 * class board, and its address is on the reserved .invalid domain, so no
 * Google account or mailbox can ever claim it.
 */
const PUBLIC_DEMO_ID = "usr_public_demo";
const isPublicDemo = (user: { id?: string } | null | undefined) => user?.id === PUBLIC_DEMO_ID;

app.post("/api/auth/demo", (req, res) => {
  try {
    const caller = clientKey(req.ip);
    if (rateLimited(res, `demo:ip:${caller}`, AUTH_LIMITS.loginIp,
      "Too many sign-ins from here. Try again later.")) return;

    const users = loadUsers();
    let demo = users.find(u => u.id === PUBLIC_DEMO_ID);
    if (!demo) {
      demo = {
        id: PUBLIC_DEMO_ID,
        fullName: "Demo Trader",
        email: "demo@rupeerookie.invalid",
        username: "demo_trader",
        phone: "",
        ageGroup: "13-17 (Teen)",
        experienceLevel: "BEGINNER",
        initialCapital: 1000000,
        registeredAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        portfolioValue: 1000000,
        totalTrades: 0,
      };
      users.push(demo);
    }
    demo.lastLoginAt = new Date().toISOString();
    saveUsers(users);

    grantSession(res, demo, {
      message: "You're in the shared demo account. Sign up to keep your own portfolio.",
      demo: true,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "The demo is unavailable." });
  }
});

/** Ends this session on the server, not only in the browser. */
app.post("/api/auth/logout", (req, res) => {
  revokeSession(readCookie(req, SESSION_COOKIE));
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ success: true });
});

/** Ends every session for the signed-in account, on every device. */
app.post("/api/auth/logout-everywhere", (req, res) => {
  const user = sessionUser(req);
  if (!user) return res.status(401).json({ success: false, message: "Not signed in." });
  // Everyone using the shared demo is signed in to the same account. Signing
  // it out everywhere would sign out every other visitor too.
  if (isPublicDemo(user)) {
    revokeSession(readCookie(req, SESSION_COOKIE));
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    return res.json({ success: true, message: "Signed out of the demo." });
  }

  revokeAllSessionsForUser(user.id);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ success: true, message: "Signed out on every device." });
});

/**
 * Step one of a password reset: emails a code to the account's address.
 *
 * Forgetting a password used to mean starting a second account, which left
 * the first one's portfolio and Academy progress stranded. Recovery rests on
 * the same thing every other reset does — that the person can read the inbox
 * the account was registered with.
 *
 * The answer says plainly whether the identifier is known. That discloses
 * nothing the sign-up form does not already: it refuses a duplicate email or
 * username by name. A uniform reply here would guard nothing while leaving a
 * student who mistyped their username waiting for a code that is not coming.
 * The rate limits are what actually make walking a list of addresses useless.
 */
app.post("/api/auth/password/forgot", async (req, res) => {
  try {
    const caller = clientKey(req.ip);
    if (rateLimited(res, `reset:ip:${caller}`, AUTH_LIMITS.passwordResetIp,
      "Too many reset codes requested from here. Try again later.")) return;

    const { identifier } = req.body;
    if (!identifier || typeof identifier !== "string") {
      return res.status(400).json({ success: false, message: "Enter your email address or username." });
    }

    const cleanId = identifier.toLowerCase().trim().slice(0, 120);
    if (rateLimited(res, `reset:id:${cleanId}`, AUTH_LIMITS.passwordResetAccount,
      "Too many reset codes requested for this account. Try again later.")) return;

    const user = loadUsers().find(
      u => u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId,
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account uses that email address or username.",
      });
    }

    const { challengeId, code, expiresAt } = issueChallenge(user.id, user.email, "reset");
    const outcome = await deliverCode(user.email, code, expiresAt);
    if (!outcome.delivered) {
      // Same rule as the sign-in code: a code that could not be sent must not
      // become an optional step.
      discardChallenge(challengeId);
      return res.status(503).json({
        success: false,
        message: outcome.message || "The reset code could not be sent. Try again shortly.",
      });
    }

    res.json({
      success: true,
      challengeId,
      maskedEmail: maskEmail(user.email),
      expiresInSeconds: Math.round(CODE_TTL_MS / 1000),
      ...(outcome.devCode ? { devCode: outcome.devCode } : {}),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Could not start the reset." });
  }
});

/**
 * Step two: the code plus the new password.
 *
 * Every session for the account goes, on every device, and no new one is
 * issued here. Whoever knew the old password may still be holding a session,
 * and a reset that left it alive would change nothing for the person who was
 * locked out. They sign in again with the new password, which also puts them
 * through the emailed code when codes are required.
 */
app.post("/api/auth/password/reset", (req, res) => {
  try {
    const caller = clientKey(req.ip);
    if (rateLimited(res, `reset:verify:${caller}`, AUTH_LIMITS.otpVerify,
      "Too many attempts. Try again later.")) return;

    const { challengeId, code, password } = req.body;
    if (!challengeId || typeof challengeId !== "string" || !code) {
      return res.status(400).json({ success: false, message: "That reset is no longer pending. Start again." });
    }
    if (!/^\d{4,8}$/.test(String(code).trim())) {
      return res.status(400).json({ success: false, message: "That code does not look right." });
    }

    // Everything that can be refused is settled before the code is checked,
    // because checking a correct code consumes the challenge. A new password
    // that failed the strength rule used to cost the person the code as well,
    // and the reset had to be started again from the email.
    const pending = peekChallenge(challengeId);
    if (!pending) {
      return res.status(410).json({ success: false, message: "That reset is no longer pending. Start again." });
    }
    if (pending.purpose !== "reset") {
      return res.status(400).json({ success: false, message: "That code is not a reset code." });
    }

    const users = loadUsers();
    const user = users.find(u => u.id === pending.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "That account no longer exists." });
    }

    const strength = checkPassword(String(password || ""), {
      fullName: user.fullName,
      username: user.username,
      email: user.email,
    });
    if (!strength.ok) {
      return res.status(400).json({ success: false, message: strength.message });
    }

    const result = verifyChallenge(challengeId, String(code));
    if (!result.ok) {
      const message =
        result.reason === "expired" ? "That code has expired. Ask for a new one." :
        result.reason === "exhausted" ? "Too many wrong codes. Start the reset again." :
        result.reason === "unknown" ? "That reset is no longer pending. Start again." :
        `That code is not right. ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? "" : "s"} left.`;
      return res.status(401).json({ success: false, message, attemptsLeft: result.attemptsLeft });
    }

    user.passwordHash = hashPassword(String(password));
    delete user.password;
    saveUsers(users);

    revokeAllSessionsForUser(user.id);
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    res.json({
      success: true,
      message: "Password changed. Every device has been signed out — sign in with the new one.",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "The password could not be changed." });
  }
});

/**
 * Changing the password from inside the app.
 *
 * The old password is required even though the session already proves who is
 * asking, for the same reason deleting the account requires it: a borrowed
 * unlocked browser has a session. An account that only ever signed in through
 * Google has no old password to give and is setting its first one.
 *
 * Every other device is signed out, because the point of changing a password
 * is usually that someone else knew it. This browser keeps its session — it is
 * the one that just proved it knows the password.
 */
app.post("/api/auth/password/change", (req, res) => {
  try {
    const caller = clientKey(req.ip);
    if (rateLimited(res, `password:change:${caller}`, AUTH_LIMITS.loginAccount,
      "Too many attempts. Try again later.")) return;

    const signedIn = sessionUser(req);
    if (!signedIn) return res.status(401).json({ success: false, message: "Sign in first." });
    // The shared demo has no password, so this route would let any visitor set
    // one without knowing a current password, and then sign every other
    // visitor out of it.
    if (isPublicDemo(signedIn)) {
      return res.status(403).json({
        success: false,
        message: "The demo account is shared, so its password can't be set. Sign up to get your own.",
      });
    }

    const { currentPassword, newPassword } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.id === signedIn.id);
    if (!user) return res.status(404).json({ success: false, message: "That account no longer exists." });

    const hasPassword = Boolean(user.passwordHash || user.password);
    if (hasPassword && !verifyPassword(String(currentPassword || ""), user)) {
      return res.status(401).json({ success: false, message: "That is not your current password." });
    }

    const strength = checkPassword(String(newPassword || ""), {
      fullName: user.fullName,
      username: user.username,
      email: user.email,
    });
    if (!strength.ok) {
      return res.status(400).json({ success: false, message: strength.message });
    }
    if (hasPassword && verifyPassword(String(newPassword), user)) {
      return res.status(400).json({ success: false, message: "That is already your password." });
    }

    user.passwordHash = hashPassword(String(newPassword));
    delete user.password;
    saveUsers(users);

    const issued = rotateSessionsForUser(user.id);
    grantSession(res, user, {
      message: hasPassword
        ? "Password changed. Every other device has been signed out."
        : "Password set. You can now sign in without Google.",
    }, issued);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "The password could not be changed." });
  }
});

/**
 * Deletes the signed-in account.
 *
 * The privacy centre explained what was held and offered no way to remove it.
 * The account itself lives on the server, so only the server can delete it.
 *
 * Re-authentication is required, not just a live session: a borrowed, unlocked
 * browser should not be able to destroy the account. An account with a
 * password must supply it; one that only ever signed in through Google types
 * the confirmation phrase instead, since there is no password to check.
 */
app.delete("/api/account", (req, res) => {
  const caller = clientKey(req.ip);
  if (rateLimited(res, `account:delete:${caller}`, AUTH_LIMITS.loginAccount,
    "Too many attempts. Try again later.")) return;

  const claims = readSession(readCookie(req, SESSION_COOKIE));
  if (!claims) return res.status(401).json({ success: false, message: "Sign in first." });

  const users = loadUsers();
  const index = users.findIndex(u => u.id === claims.userId);
  if (index < 0) {
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    return res.status(404).json({ success: false, message: "That account no longer exists." });
  }

  const user = users[index];
  if (isPublicDemo(user)) {
    return res.status(403).json({ success: false, message: "The shared demo account can't be deleted." });
  }
  const { password, confirmation } = req.body || {};

  if (user.passwordHash || user.password) {
    if (!password || !verifyPassword(String(password), user)) {
      return res.status(401).json({ success: false, message: "That password is not right." });
    }
  } else if (String(confirmation || "").trim().toUpperCase() !== "DELETE") {
    return res.status(400).json({
      success: false,
      message: 'Type DELETE to confirm.',
    });
  }

  users.splice(index, 1);
  saveUsers(users);

  // The account record was all that went. The message said "everything the
  // server held for it", and the portfolio this server executed and the rows
  // in the trade log stayed exactly where they were, keyed by an id nothing
  // pointed at any more. Either the message was wrong or the deletion was;
  // the deletion was.
  updateLedgers((ledgers) => {
    delete ledgers[user.id];
  });

  try {
    const trades = loadTrades();
    const remaining = trades.filter(trade => trade.userId !== user.id);
    if (remaining.length !== trades.length) saveTrades(remaining);
  } catch (err) {
    console.error("[account] could not clear the trade log:", err);
  }

  // Every device, not just this one: the account is gone.
  revokeAllSessionsForUser(user.id);
  res.clearCookie(SESSION_COOKIE, { path: "/" });

  res.json({
    success: true,
    message: "Your account and everything the server held for it has been deleted.",
  });
});

/* =========================================================================
   The trading ledger
   Trades used to execute in the browser and live in localStorage, so the
   server never knew what anyone held. It does now: it prices each order from
   its own quote, checks the cash and the holding, and keeps the record.
   ========================================================================= */
const LEDGERS_FILE = path.join(process.cwd(), "data", "ledgers.json");

function loadLedgers(): Record<string, Ledger> {
  try {
    // An empty object here is every portfolio on the server, so the read goes
    // to the last good copy before it settles for one.
    const parsed = readJson<Record<string, unknown>>(LEDGERS_FILE, {});
    const out: Record<string, Ledger> = {};
    for (const [userId, ledger] of Object.entries(parsed || {})) {
      out[userId] = sanitiseLedger(ledger);
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Reads the ledgers, changes them and writes them back as one step.
 *
 * Every route that writes a ledger does so by reading all of them, changing
 * one and writing them all back. Nothing may happen in between: a single
 * `await` between the read and the write makes one request's copy overwrite
 * another's, and what is lost is somebody's trade. `updateJson` enforces
 * that — the change is synchronous and a nested write throws — rather than
 * leaving it as a convention to be broken later.
 */
function updateLedgers<T>(mutate: (ledgers: Record<string, Ledger>) => T): T {
  let outcome: T;
  updateJson<Record<string, unknown>>(LEDGERS_FILE, {}, (raw) => {
    const ledgers: Record<string, Ledger> = {};
    for (const [userId, ledger] of Object.entries(raw || {})) {
      ledgers[userId] = sanitiseLedger(ledger);
    }
    outcome = mutate(ledgers);
    return ledgers;
  });
  return outcome!;
}

function ledgerFor(userId: string): Ledger {
  return loadLedgers()[userId] || emptyLedger();
}

/** The server's own quotes, which is what an order is priced from. */
function quoteMap(): Record<string, number> {
  const quotes: Record<string, number> = {};
  for (const stock of marketData.getStocks()) {
    if (Number.isFinite(stock.price) && stock.price > 0) quotes[stock.symbol] = stock.price;
  }
  return quotes;
}

/**
 * Closes any intraday position whose session has ended, and writes the result.
 *
 * Called wherever a ledger is read or traded on, because a square-off is a
 * fact about the clock: nobody is going to ask for it, and a position left
 * open is one still enjoying five times leverage days after the session it
 * was taken in.
 */
function settleIntraday(userId: string): { ledger: Ledger; closed: LedgerOrder[] } {
  const quotes = quoteMap();
  // Most reads find nothing due, and they stay reads. Only a square-off that
  // is actually owed takes the write lock, and it is worked out again inside
  // it, from the ledger as it stands at that moment.
  if (squareOffIntraday(ledgerFor(userId), quotes).closed.length === 0) {
    return { ledger: ledgerFor(userId), closed: [] };
  }
  return updateLedgers((ledgers) => {
    const settled = squareOffIntraday(ledgers[userId] || emptyLedger(), quotes);
    if (settled.closed.length > 0) ledgers[userId] = settled.ledger;
    return settled;
  });
}

app.get("/api/portfolio", (req, res) => {
  const user = sessionUser(req);
  if (!user) return res.status(401).json({ success: false, message: "Sign in first." });

  const { ledger, closed } = settleIntraday(user.id);
  res.json({
    success: true,
    ledger: syncView(ledger),
    portfolioValue: computePortfolioValue(ledger, quoteMap()),
    // Named so the browser can say what happened while nobody was looking,
    // rather than a position simply vanishing between two visits.
    squaredOff: closed,
    verified: true,
  });
});

/**
 * A page of the order history, for scrolling back past what a sync carries.
 */
app.get("/api/portfolio/orders", (req, res) => {
  const user = sessionUser(req);
  if (!user) return res.status(401).json({ success: false, message: "Sign in first." });

  const page = orderPage(ledgerFor(user.id), Number(req.query.offset), Number(req.query.limit));
  res.json({ success: true, ...page });
});

/**
 * Executes one market order.
 *
 * The price comes from the server's live list (`marketData.getStocks()`), never from the request: a client that
 * could name its own price could buy at ₹1 and sell at ₹10,000. The user comes
 * from the session cookie, never from the body, so one account cannot trade in
 * another's ledger.
 */
app.post("/api/portfolio/execute", (req, res) => {
  const user = sessionUser(req);
  // Per learner. Keyed on the address, a class trading from one school network
  // shared 240 orders an hour between all of them.
  if (user && rateLimited(res, `trade:${user.id}`, { limit: 240, windowMs: 60 * 60_000 },
    "Too many orders. Try again shortly.")) return;

  if (!user) return res.status(401).json({ success: false, message: "Sign in first." });

  const { symbol, quantity, side, product } = req.body || {};
  const cleanSymbol = String(symbol || "").trim().toUpperCase();
  const stock = marketData.getStocks().find(s => s.symbol === cleanSymbol);
  if (!stock) {
    return res.status(404).json({ success: false, message: "That share is not in the simulator." });
  }

  // Any stale intraday position is closed before this order is priced, so a
  // buy is checked against the cash the learner actually has. Both happen in
  // one write: settling first and trading in a second write would let another
  // request land in between.
  const result = updateLedgers((ledgers) => {
    const settled = squareOffIntraday(ledgers[user.id] || emptyLedger(), quoteMap());
    const outcome = executeOrder(settled.ledger, {
      symbol: cleanSymbol,
      stockName: stock.name || cleanSymbol,
      quantity: Number(quantity),
      side: side === "SELL" ? "SELL" : "BUY",
      product: product === "MIS" ? "MIS" : "CNC",
      price: stock.price,
    });
    // A square-off that was due stands whether or not the new order does.
    if (outcome.ok && outcome.ledger) ledgers[user.id] = outcome.ledger;
    else if (settled.closed.length > 0) ledgers[user.id] = settled.ledger;
    return { ...outcome, closed: settled.closed };
  });

  if (!result.ok || !result.ledger) {
    return res.status(400).json({ success: false, message: result.message });
  }

  // Keep the account row in step, so anything reading it sees a measured
  // figure rather than the signup constant it used to hold forever.
  const users = loadUsers();
  const account = users.find(u => u.id === user.id);
  if (account) {
    account.portfolioValue = computePortfolioValue(result.ledger, quoteMap());
    account.totalTrades = result.ledger.orders.length;
    saveUsers(users);
  }

  res.json({
    success: true,
    message: result.message,
    order: result.order,
    ledger: syncView(result.ledger),
    portfolioValue: computePortfolioValue(result.ledger, quoteMap()),
    squaredOff: result.closed,
  });
});

/**
 * What a reset displaced, kept briefly so the undo in the header can put it
 * back. Without this the client would restore its own copy while the server
 * kept the empty one, and the next sync would wipe it again — an undo that
 * only appeared to work.
 */
const RESET_UNDO_WINDOW_MS = 60_000;
const resetSnapshots = new Map<string, { ledger: Ledger; at: number }>();

/** Puts the ledger back to the starting capital. */
app.post("/api/portfolio/reset", (req, res) => {
  const user = sessionUser(req);
  if (!user) return res.status(401).json({ success: false, message: "Sign in first." });

  const fresh = updateLedgers((ledgers) => {
    const previous = ledgers[user.id];
    if (previous) resetSnapshots.set(user.id, { ledger: previous, at: Date.now() });
    ledgers[user.id] = emptyLedger();
    return ledgers[user.id];
  });

  const users = loadUsers();
  const account = users.find(u => u.id === user.id);
  if (account) {
    account.portfolioValue = INITIAL_LEDGER_CAPITAL;
    account.totalTrades = 0;
    saveUsers(users);
  }

  res.json({ success: true, ledger: syncView(fresh), portfolioValue: INITIAL_LEDGER_CAPITAL });
});

/** Restores what the last reset displaced, while the window is still open. */
app.post("/api/portfolio/reset/undo", (req, res) => {
  const user = sessionUser(req);
  if (!user) return res.status(401).json({ success: false, message: "Sign in first." });

  const snapshot = resetSnapshots.get(user.id);
  if (!snapshot || Date.now() - snapshot.at > RESET_UNDO_WINDOW_MS) {
    resetSnapshots.delete(user.id);
    return res.status(410).json({ success: false, message: "That reset can no longer be undone." });
  }

  updateLedgers((ledgers) => {
    ledgers[user.id] = snapshot.ledger;
  });
  resetSnapshots.delete(user.id);

  const value = computePortfolioValue(snapshot.ledger, quoteMap());
  const users = loadUsers();
  const account = users.find(u => u.id === user.id);
  if (account) {
    account.portfolioValue = value;
    account.totalTrades = snapshot.ledger.orders.length;
    saveUsers(users);
  }

  res.json({ success: true, ledger: syncView(snapshot.ledger), portfolioValue: value });
});

/** Lets the sign-in screen say up front that a code will be needed. */
app.get("/api/auth/otp/status", (_req, res) => {
  res.json({ required: otpRequired(), delivery: deliveryMode() });
});

// Helper to resolve current Google Client ID (re-reading from .env if updated)
/**
 * The Google client a credential must have been issued to.
 *
 * The browser obtains its credential from the client the page is configured
 * with — the build-time VITE_GOOGLE_CLIENT_ID, or the shared fallback when
 * neither is set. The server used to accept only GOOGLE_CLIENT_ID, so a
 * deployment that set the browser's id but not the server's showed a working
 * Google button whose every sign-in was then refused as "not configured". The
 * server now checks against the same id the browser used, in the same order.
 * The audience check in verifyGoogleCredential still binds the credential to
 * that one client.
 */
function getGoogleClientId(): string | null {
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const match = envContent.match(/^GOOGLE_CLIENT_ID\s*=\s*["']?([^"'\r\n]+)["']?/m);
      if (match && match[1]) {
        process.env.GOOGLE_CLIENT_ID = match[1].trim();
      }
    }
  } catch {}

  for (const candidate of [process.env.GOOGLE_CLIENT_ID, process.env.VITE_GOOGLE_CLIENT_ID]) {
    if (isGoogleClientId(candidate)) return candidate.trim();
  }
  return FALLBACK_GOOGLE_CLIENT_ID;
}

// Google Sign-In: the client ID is public, so the browser reads it from here
// instead of needing a rebuild whenever GOOGLE_CLIENT_ID changes.
app.get("/api/auth/google/config", (req, res) => {
  res.json({ clientId: getGoogleClientId() });
});

interface GoogleIdTokenInfo {
  sub: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  aud: string;
  iss: string;
  exp: string;
}

async function verifyGoogleCredential(credential: string, clientId: string): Promise<GoogleIdTokenInfo | null> {
  const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!verifyRes.ok) return null;
  const info = await verifyRes.json() as GoogleIdTokenInfo;
  const validIssuer = info.iss === "accounts.google.com" || info.iss === "https://accounts.google.com";
  const notExpired = Number(info.exp) * 1000 > Date.now();
  const emailVerified = info.email_verified === true || info.email_verified === "true";
  if (info.aud !== clientId || !validIssuer || !notExpired || !info.sub || !info.email || !emailVerified) return null;
  return info;
}

function uniqueUsernameFromEmail(email: string, users: StoredUser[]): string {
  const base = (email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 24) || "rookie").padEnd(3, "_");
  let candidate = base;
  let suffix = 1;
  while (users.some(u => u.username.toLowerCase() === candidate)) {
    candidate = `${base}_${suffix++}`;
  }
  return candidate;
}

// Google Sign-In / Sign-Up: logs in an existing account (linking it by verified
// email on first use) or creates a new one.
app.post("/api/auth/google", createAuthLimiter(300), async (req, res) => {
  try {
    const caller = clientKey(req.ip);
    if (rateLimited(res, `google:ip:${caller}`, AUTH_LIMITS.googleIp,
      "Too many sign-in attempts from here. Try again later.")) return;

    const clientId = getGoogleClientId();
    if (!clientId) {
      return res.status(503).json({ success: false, message: "Google Sign-In is not configured on this server." });
    }
    const { credential } = req.body;
    if (!credential || typeof credential !== "string") {
      return res.status(400).json({ success: false, message: "Missing Google credential." });
    }

    const info = await verifyGoogleCredential(credential, clientId);
    if (!info) {
      return res.status(401).json({ success: false, message: "Google sign-in could not be verified. Please try again." });
    }

    const users = loadUsers();
    const email = info.email!.toLowerCase();
    let user = users.find(u => u.googleId === info.sub) || users.find(u => u.email.toLowerCase() === email);
    const isNew = !user;

    if (user) {
      user.googleId = info.sub;
      user.lastLoginAt = new Date().toISOString();
    } else {
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        fullName: String(info.name || email.split("@")[0]).trim().slice(0, 80),
        email,
        username: uniqueUsernameFromEmail(email, users),
        googleId: info.sub,
        ageGroup: "13-17 (Teen)",
        experienceLevel: "BEGINNER",
        initialCapital: 1000000,
        registeredAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        portfolioValue: 1000000,
        totalTrades: 0
      };
      users.unshift(user);
    }
    saveUsers(users);

    if (otpRequired()) {
      // Google has proved the address belongs to a real mailbox, but not that
      // whoever is at this browser can read it right now. The code does that.
      await beginVerification(res, user, "google");
      return;
    }

    grantSession(res, user, {
      isNew,
      message: isNew ? "Account created with Google!" : `Welcome back, ${user.fullName}!`,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Google sign-in failed" });
  }
});

function requireAdminExport(req: express.Request, res: express.Response, next: express.NextFunction) {
  const configuredToken = process.env.ADMIN_EXPORT_TOKEN;
  if (!configuredToken) {
    return res.status(404).json({ success: false, message: "Not found" });
  }

  const suppliedToken = req.get("x-admin-token") || req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!suppliedToken || suppliedToken !== configuredToken) {
    return res.status(403).json({ success: false, message: "Admin authorization required." });
  }

  next();
}

// Export Users to Excel-compatible CSV file (with UTF-8 BOM for Microsoft Excel)
app.get("/api/auth/export/excel", requireAdminExport, (req, res) => {
  try {
    const users = loadUsers();
    
    // CSV Header with UTF-8 BOM for Excel
    const headers = [
      "User ID",
      "Full Name",
      "Email Address",
      "Username",
      "Phone / WhatsApp",
      "Age / Investor Category",
      "Trading Experience",
      "Virtual Capital (INR)",
      "Registered Date (IST/UTC)",
      "Last Login Date"
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = users.map(u => [
      escapeCsv(u.id),
      escapeCsv(u.fullName),
      escapeCsv(u.email),
      escapeCsv(u.username),
      escapeCsv(u.phone || "N/A"),
      escapeCsv(u.ageGroup || "Teen Investor"),
      escapeCsv(u.experienceLevel),
      escapeCsv(`Rs. ${u.initialCapital.toLocaleString('en-IN')}`),
      escapeCsv(new Date(u.registeredAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })),
      escapeCsv(new Date(u.lastLoginAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))
    ].join(","));

    // \uFEFF is UTF-8 Byte Order Mark for Excel
    const csvContent = "\uFEFF" + headers.map(escapeCsv).join(",") + "\r\n" + rows.join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="RupeeRookie_Registered_Users_${new Date().toISOString().split("T")[0]}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Export to Excel failed" });
  }
});

// Export Structured Knowledge Base for NotebookLLM
app.get("/api/auth/export/notebookllm", requireAdminExport, (req, res) => {
  try {
    const users = loadUsers();
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    let md = `# Rupee Rookie - User Registry & Cohort Knowledge Document\n\n`;
    md += `> **Source Type:** Structured Platform Ingestion Document for Google NotebookLLM\n`;
    md += `> **Generated On:** ${timestamp} (IST)\n`;
    md += `> **Total Registered Investors:** ${users.length} users\n`;
    md += `> **Platform:** Rupee Rookie Teen Paper Trading Simulator (NSE India)\n\n`;

    md += `## 1. Executive Summary & Cohort Overview\n\n`;
    md += `This dataset documents all registered student investors and platform participants on the Rupee Rookie trading simulator. Each profile contains identity attributes, skill self-assessments, virtual capital allocation (standard ₹10,00,000 INR), and session activity logs.\n\n`;

    md += `### Aggregate Statistics:\n`;
    md += `- **Total Registered Accounts:** ${users.length}\n`;
    md += `- **Beginner Level:** ${users.filter(u => u.experienceLevel === 'BEGINNER').length}\n`;
    md += `- **Intermediate Level:** ${users.filter(u => u.experienceLevel === 'INTERMEDIATE').length}\n`;
    md += `- **Advanced Level:** ${users.filter(u => u.experienceLevel === 'ADVANCED').length}\n`;
    md += `- **Total Virtual Capital Administered:** ₹${(users.length * 10).toLocaleString('en-IN')} Lakhs INR\n\n`;

    md += `## 2. Master User Roster Table\n\n`;
    md += `| User ID | Full Name | Email | Username | Phone | Age Group | Experience | Registered Date |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    users.forEach(u => {
      const regDate = new Date(u.registeredAt).toLocaleDateString('en-IN');
      md += `| \`${u.id}\` | **${u.fullName}** | \`${u.email}\` | @${u.username} | ${u.phone || 'N/A'} | ${u.ageGroup || 'Teen'} | ${u.experienceLevel} | ${regDate} |\n`;
    });

    md += `\n\n## 3. Detailed Individual User Dossiers\n\n`;
    users.forEach((u, i) => {
      md += `### ${i + 1}. ${u.fullName} (@${u.username})\n`;
      md += `- **Account ID:** \`${u.id}\`\n`;
      md += `- **Email Address:** \`${u.email}\`\n`;
      md += `- **Contact Phone:** ${u.phone || 'Not Provided'}\n`;
      md += `- **Demographic Cohort:** ${u.ageGroup || '13-17 Teen'}\n`;
      md += `- **Trading Experience Tier:** ${u.experienceLevel}\n`;
      md += `- **Virtual Balance Allocation:** ₹${u.initialCapital.toLocaleString('en-IN')} INR\n`;
      md += `- **Signup Timestamp:** ${u.registeredAt}\n`;
      md += `- **Last Active Session:** ${u.lastLoginAt}\n\n`;
    });

    md += `---\n*Document generated by Rupee Rookie Simulator for NotebookLLM Knowledge Grounding.*`;

    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="RupeeRookie_NotebookLLM_Users_${new Date().toISOString().split("T")[0]}.md"`);
    res.send(md);
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Export for NotebookLLM failed" });
  }
});

// ==========================================
// ADMIN DASHBOARD & TRADES SYNC API ENDPOINTS (PASSKEY SECURED)
// ==========================================


















// Trade recording / live sync from the simulator; see
// src/server/routes/trading-simulator.ts. The trade and user stores stay here
// because the admin console reads them too. Who is trading comes from the
// signed session, never from the body.
app.use(createTradesRouter({
  loadTrades,
  saveTrades,
  loadUsers,
  saveUsers,
  sessionUserId: (req) => sessionUser(req)?.id ?? null,
}));

// The admin console's routes live in src/server/routes/admin.ts. The passkey
// and the active broadcast are owned by that router; server.ts stays the owner
// of the user and trade stores and injects them.
app.use(createAdminRouter({ loadUsers, saveUsers, loadTrades, toSafeUser }));




// API 404 handler - ensure API endpoints never fall through to Vite HTML
app.all("/api/*", (req, res) => {
  res.status(404).json({ success: false, error: `API endpoint ${req.path} not found` });
});

// Express API error handler middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith("/api/")) {
    res.status(500).json({ success: false, error: err?.message || "Internal server error" });
  } else {
    next(err);
  }
});

// Start Server with Vite Middleware

async function startServer() {
  const distPath = path.join(process.cwd(), "dist");
  const hasDist = fs.existsSync(path.join(distPath, "index.html"));
  const isProduction = process.env.NODE_ENV === "production" || process.env.SERVE_DIST === "true";

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn("Could not start Vite dev middleware:", err);
      if (hasDist) {
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
          const indexPath = path.join(distPath, "index.html");
          if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
          } else {
            res.status(200).send("RupeeRookie application starting...");
          }
        });
      }
    }
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(200).send("RupeeRookie application starting...");
      }
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`RupeeRookie Server running on http://0.0.0.0:${PORT}`);
  });

  const secondaryPort = PORT === 3005 ? 3006 : PORT === 3006 ? 3005 : null;
  let secondaryServer: any = null;
  if (secondaryPort) {
    try {
      secondaryServer = app.listen(secondaryPort, "0.0.0.0", () => {
        console.log(`RupeeRookie Secondary Server running on http://0.0.0.0:${secondaryPort}`);
      });
      secondaryServer.on("error", (err: any) => {
        if (err.code !== "EADDRINUSE") {
          console.warn(`Could not bind secondary port ${secondaryPort}:`, err.message);
        }
      });
    } catch {}
  }

  const cleanup = () => {
    marketData.stopFeed();
    try { server.close(); } catch {}
    try { server.closeAllConnections(); } catch {}
    try { secondaryServer?.close(); } catch {}
    try { secondaryServer?.closeAllConnections(); } catch {}
    process.exit(0);
  };

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, closing HTTP server");
    cleanup();
  });

  process.on("SIGINT", () => {
    console.log("SIGINT received, closing HTTP server");
    cleanup();
  });
}

startServer();

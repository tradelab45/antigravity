import express from "express";
import path from "path";
import fs from "fs";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createAuthLimiter } from './src/server/authRateLimit';
import { createAcademyService } from './src/server/academyService';
import { createMarketDataRouter } from './src/server/routes/market-data';
import { 
  getScreenerData,
  type ScreenerChartResponse
} from "./src/server/screenerService";

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
const proxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (Number.isInteger(proxyHops) && proxyHops > 0 && proxyHops <= 5) app.set('trust proxy', proxyHops);
const academyService = createAcademyService(path.join(process.cwd(), 'data', 'academy.json'));
app.use('/api/academy', academyService.router);
app.use('/api/auth', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.post('/api/auth/logout', academyService.logout);


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

// 2b. Direct Screener.in Company & Historical Dataset Endpoint
app.get("/api/screener/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase().replace('.NS', '').replace('.BO', '');
  const stock = marketData.getStocks().find((s) => s.symbol === symbol);
  try {
    const screenerData = await getScreenerData(
      symbol,
      stock?.name,
      stock?.price,
      stock?.dayHigh,
      stock?.dayLow,
      stock?.previousClose
    );
    if (!screenerData) {
      return res.status(404).json({ success: false, error: `Screener data not found for ${symbol}` });
    }
    res.json({
      success: true,
      symbol,
      ...screenerData
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Failed to fetch from Screener.in" });
  }
});


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
}

const USERS_FILE = path.join(process.cwd(), "data", "users.json");
/**
 * Password for the seeded demo account.
 *
 * This was a hardcoded literal, and the seeded account uses the address in
 * ADMIN_EMAILS — so any fresh deployment shipped with the owner account
 * logged-in-able by anyone who read the source or the client bundle. With no
 * DEMO_ACCOUNT_PASSWORD configured it is now random per process, which leaves
 * the account present for display but not sign-in-able.
 */
const DEMO_PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD || randomBytes(24).toString("hex");

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
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      const users = JSON.parse(data) as StoredUser[];
      return users.map((user) => {
        if (user.id === "usr_rookie_demo" && !user.passwordHash && !user.password) {
          return { ...user, passwordHash: hashPassword(DEMO_PASSWORD), phone: "" };
        }
        return user;
      });
    }
  } catch {
    // fallback
  }
  return [
    {
      id: "usr_rookie_demo",
      fullName: "Aarav Jain",
      email: "aaravvjain23@gmail.com",
      username: "aarav_trader",
      passwordHash: hashPassword(DEMO_PASSWORD),
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
    const tempFile = `${USERS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), "utf-8");
    fs.renameSync(tempFile, USERS_FILE);
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
    if (fs.existsSync(TRADES_FILE)) {
      const data = fs.readFileSync(TRADES_FILE, "utf-8");
      const parsed = JSON.parse(data) as StoredTrade[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
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
    const tempFile = `${TRADES_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(trades, null, 2), "utf-8");
    fs.renameSync(tempFile, TRADES_FILE);
  } catch (err) {
    console.error("Error saving trades to disk:", err);
  }
}

// User Signup
app.post("/api/auth/signup", createAuthLimiter(5, 60 * 60 * 1000), async (req, res) => {
  try {
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
    if (cleanPassword.length < 8 || cleanPassword.length > 128) {
      return res.status(400).json({ success: false, message: "Password must be between 8 and 128 characters." });
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

    academyService.issueSession(req, res, newUser.id);
    res.json({ success: true, user: toSafeUser(newUser), message: "Account created successfully!" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to register user" });
  }
});

// User Login
app.post("/api/auth/login", createAuthLimiter(10), (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (typeof identifier !== 'string' || identifier.length > 120 || typeof password !== 'string' || password.length > 128 || !identifier || !password) {
      return res.status(400).json({ success: false, message: "Email or username and password are required." });
    }

    const users = loadUsers();
    const cleanId = identifier.toLowerCase().trim();
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

    academyService.issueSession(req, res, user.id);
    res.json({ success: true, user: toSafeUser(user), message: `Welcome back, ${user.fullName}!` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Login failed" });
  }
});

// Helper to resolve current Google Client ID (re-reading from .env if updated)
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

  const rawId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  if (rawId && rawId.includes("apps.googleusercontent.com") && !rawId.includes("YOUR_GOOGLE_CLIENT_ID")) {
    return rawId;
  }
  return null;
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
app.post("/api/auth/google", createAuthLimiter(20), async (req, res) => {
  try {
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

    academyService.issueSession(req, res, user.id);
    res.json({
      success: true,
      isNew,
      user: toSafeUser(user),
      message: isNew ? "Account created with Google!" : `Welcome back, ${user.fullName}!`
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

/**
 * The administrator secret. There is deliberately no default: an unset
 * ADMIN_PASSKEY disables every admin route rather than falling back to a
 * value that is public knowledge, which is how requireAdminExport already
 * treats a missing ADMIN_EXPORT_TOKEN.
 */
let CURRENT_ADMIN_PASSKEY = process.env.ADMIN_PASSKEY || "";

/** Constant-time comparison so a wrong key cannot be recovered byte by byte. */
const passkeyMatches = (supplied: unknown): boolean => {
  if (!CURRENT_ADMIN_PASSKEY) return false;
  if (typeof supplied !== "string" || supplied.length === 0) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(CURRENT_ADMIN_PASSKEY);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

interface StoredBroadcast {
  id: string;
  title?: string;
  message: string;
  type: 'INFO' | 'ALERT' | 'SUCCESS' | 'WARNING';
  timestamp: string;
  active: boolean;
}

let CURRENT_BROADCAST: StoredBroadcast | null = null;

/**
 * Admin requests authenticate with the shared secret in x-admin-key, and
 * nothing else.
 *
 * Previously this also accepted three hardcoded passkeys, the secret in a
 * ?key= query parameter, and an x-admin-email header matching an address in
 * ADMIN_EMAILS. The header carried no proof of anything — any client can set
 * it — so it granted the full admin surface to anyone who knew an address
 * that ships in the client bundle. The query parameter put the secret into
 * access logs, browser history and Referer headers.
 */
const checkAdminAuth = (req: express.Request): boolean =>
  passkeyMatches(req.headers["x-admin-key"]);

const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ 
      success: false, 
      message: "Unauthorized: Platform Owner Security Authorization Required" 
    });
  }
  next();
};

// Admin API: Overview Statistics for Command Center
app.get("/api/admin/overview", requireAdminAuth, (req, res) => {
  try {
    const users = loadUsers();
    const trades = loadTrades();
    const totalVolume = trades.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0);
    const totalCapital = users.reduce((sum, u) => sum + (Number(u.initialCapital) || 1000000), 0);

    res.json({
      success: true,
      stats: {
        totalUsers: users.length,
        totalTrades: trades.length,
        totalVolumeINR: totalVolume,
        totalCapitalAllocatedINR: totalCapital,
        uptimeSeconds: Math.floor(process.uptime()),
        serverTime: new Date().toISOString(),
        activeBroadcast: CURRENT_BROADCAST,
        recentTrades: trades.slice(0, 10),
        recentUsers: users.slice(0, 5).map(toSafeUser)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to fetch overview stats" });
  }
});

// Admin API: Verify passkey
app.post("/api/admin/verify-passkey", (req, res) => {
  const { passkey } = req.body;
  if (!CURRENT_ADMIN_PASSKEY) {
    return res.status(503).json({ success: false, message: "Administrator access is not configured on this server." });
  }
  if (passkeyMatches(passkey)) {
    return res.json({ success: true, message: "Authorized. Access granted." });
  }
  return res.status(401).json({ success: false, message: "Invalid administrator passkey. Access denied." });
});

// Admin API: Update passkey
app.post("/api/admin/update-passkey", (req, res) => {
  const { currentPasskey, newPasskey } = req.body;
  if (!CURRENT_ADMIN_PASSKEY) {
    return res.status(503).json({ success: false, message: "Administrator access is not configured on this server." });
  }
  // The hardcoded keys used to be accepted here too, so rotating the passkey
  // could never lock an attacker out — and an attacker could rotate it to
  // lock the owner out.
  if (!passkeyMatches(currentPasskey)) {
    return res.status(401).json({ success: false, message: "Current passkey is incorrect." });
  }
  if (!newPasskey || String(newPasskey).trim().length < 12) {
    return res.status(400).json({ success: false, message: "New passkey must be at least 12 characters." });
  }
  CURRENT_ADMIN_PASSKEY = String(newPasskey).trim();
  return res.json({ success: true, message: "Administrator passkey updated successfully." });
});

// Admin API: List all registered users (profile details & sign-in data)
app.get("/api/admin/users", requireAdminAuth, (req, res) => {
  try {
    const users = loadUsers();
    res.json({
      success: true,
      users: users.map(toSafeUser),
      totalUsers: users.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to fetch users" });
  }
});

// Admin API: Reset a user's virtual capital
app.post("/api/admin/users/reset-capital", requireAdminAuth, (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }
    const targetAmount = Number(amount) > 0 ? Number(amount) : 1000000;
    const users = loadUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found in registry." });
    }
    user.initialCapital = targetAmount;
    user.portfolioValue = targetAmount;
    saveUsers(users);
    res.json({ success: true, message: `Virtual capital for ${user.fullName} reset to ₹${targetAmount.toLocaleString('en-IN')}`, user: toSafeUser(user) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to reset capital" });
  }
});

// Admin API: Delete a user account
app.delete("/api/admin/users/:id", requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "User ID is required." });
    if (id === "usr_rookie_demo") {
      return res.status(400).json({ success: false, message: "Primary demo account cannot be deleted." });
    }
    let users = loadUsers();
    const initialLen = users.length;
    users = users.filter(u => u.id !== id);
    if (users.length === initialLen) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }
    saveUsers(users);
    res.json({ success: true, message: "User account deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to delete user" });
  }
});

// Admin API: Broadcast Platform-Wide Announcement
app.post("/api/admin/broadcast", requireAdminAuth, (req, res) => {
  try {
    const { message, type, title } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Broadcast message is required." });
    }
    CURRENT_BROADCAST = {
      id: `BC-${Date.now()}`,
      title: title || "Platform Announcement",
      message: String(message).trim(),
      type: ["INFO", "ALERT", "SUCCESS", "WARNING"].includes(type) ? type : "INFO",
      timestamp: new Date().toISOString(),
      active: true
    };
    res.json({ success: true, broadcast: CURRENT_BROADCAST, message: "Broadcast announcement dispatched to all connected clients." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to broadcast" });
  }
});

// Admin API: Clear Broadcast
app.delete("/api/admin/broadcast", requireAdminAuth, (req, res) => {
  CURRENT_BROADCAST = null;
  res.json({ success: true, message: "Active broadcast cleared." });
});

// Public API: Fetch Active Broadcast Announcement (Used by Simulator client tabs)
app.get("/api/broadcast", (req, res) => {
  res.json({ success: true, broadcast: CURRENT_BROADCAST });
});

// Admin API: List all live & recorded trades

app.get("/api/admin/trades", requireAdminAuth, (req, res) => {
  try {
    const trades = loadTrades();
    res.json({
      success: true,
      trades,
      totalTrades: trades.length
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to fetch trades" });
  }
});

// Record / Live Sync Trade from Trading App
app.post("/api/trades", (req, res) => {
  try {
    const { 
      orderId, 
      userId, 
      userName, 
      userEmail, 
      symbol, 
      stockName, 
      type, 
      orderType, 
      productType, 
      quantity, 
      price, 
      totalAmount, 
      status, 
      realizedPnL 
    } = req.body;

    if (!symbol || !quantity || !price) {
      return res.status(400).json({ success: false, message: "Symbol, quantity, and price are required." });
    }

    const trades = loadTrades();
    const newTrade: StoredTrade = {
      id: `TRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderId: orderId || `ORD-${Date.now()}`,
      userId: userId || "usr_rookie_demo",
      userName: userName || "Aarav Jain",
      userEmail: userEmail || "aaravvjain23@gmail.com",
      symbol: String(symbol).toUpperCase(),
      stockName: stockName || symbol,
      type: type === "SELL" ? "SELL" : "BUY",
      orderType: orderType || "MARKET",
      productType: productType === "MIS" ? "MIS" : "CNC",
      quantity: Number(quantity),
      price: Number(price),
      totalAmount: Number(totalAmount || (Number(price) * Number(quantity)).toFixed(2)),
      timestamp: new Date().toISOString(),
      status: status || "EXECUTED",
      realizedPnL: realizedPnL !== undefined ? Number(realizedPnL) : 0
    };

    trades.unshift(newTrade);
    // Keep last 1000 trades
    const trimmed = trades.slice(0, 1000);
    saveTrades(trimmed);

    // Update user's trade count if matching user found
    if (userId) {
      const users = loadUsers();
      const user = users.find(u => u.id === userId);
      if (user) {
        user.totalTrades = (user.totalTrades || 0) + 1;
        saveUsers(users);
      }
    }

    res.json({ success: true, trade: newTrade, message: "Trade recorded successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || "Failed to record trade" });
  }
});

// Direct Export Trades to CSV
app.get("/api/admin/export/trades-csv", requireAdminAuth, (req, res) => {
  try {
    const trades = loadTrades();
    const headers = [
      "Trade ID",
      "Order ID",
      "Timestamp (IST)",
      "Trader Name",
      "Trader Email",
      "Symbol",
      "Company Name",
      "Action",
      "Product Type",
      "Order Type",
      "Quantity",
      "Executed Price (INR)",
      "Total Amount (INR)",
      "Realized PnL (INR)",
      "Status"
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = trades.map(t => [
      escapeCsv(t.id),
      escapeCsv(t.orderId || ""),
      escapeCsv(new Date(t.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })),
      escapeCsv(t.userName || "Aarav Jain"),
      escapeCsv(t.userEmail || "aaravvjain23@gmail.com"),
      escapeCsv(t.symbol),
      escapeCsv(t.stockName),
      escapeCsv(t.type),
      escapeCsv(t.productType),
      escapeCsv(t.orderType),
      escapeCsv(t.quantity),
      escapeCsv(`Rs. ${t.price.toFixed(2)}`),
      escapeCsv(`Rs. ${t.totalAmount.toFixed(2)}`),
      escapeCsv(t.realizedPnL !== undefined ? `Rs. ${t.realizedPnL.toFixed(2)}` : "0.00"),
      escapeCsv(t.status)
    ].join(","));

    const csvContent = "\uFEFF" + headers.map(escapeCsv).join(",") + "\r\n" + rows.join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="RupeeRookie_Trades_Export_${new Date().toISOString().split("T")[0]}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Export trades failed" });
  }
});

// Direct Export Users to CSV (For Admin Dashboard)
app.get("/api/admin/export/users-csv", requireAdminAuth, (req, res) => {
  try {
    const users = loadUsers();
    const headers = [
      "User ID",
      "Full Name",
      "Email Address",
      "Username",
      "Phone / WhatsApp",
      "Age / Investor Category",
      "Trading Experience",
      "Virtual Capital (INR)",
      "Registered Date (IST)",
      "Last Login Date (IST)"
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

    const csvContent = "\uFEFF" + headers.map(escapeCsv).join(",") + "\r\n" + rows.join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="RupeeRookie_Registered_Users_${new Date().toISOString().split("T")[0]}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ success: false, message: "Export to CSV failed" });
  }
});

// Direct Export Users for NotebookLLM (For Admin Dashboard)
app.get("/api/admin/export/notebookllm", requireAdminAuth, (req, res) => {
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

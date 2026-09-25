/**
 * Chanakya AI copilot HTTP routes, extracted from the server.ts monolith.
 *
 * Covers the Gemini-backed endpoints (/api/gemini/*) and the market pulse and
 * news feeds that are generated from them. The lazily-created Gemini client,
 * the model fallback chain, the rule-based replies used when no API key is
 * configured and the in-memory response caches all live here, because nothing
 * outside this module reads them. The router needs no injected state.
 */
import express from "express";
import { GoogleGenAI } from "@google/genai";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";

/** Longest single chat message or history turn sent to the model. */
const MAX_TURN_CHARS = 4000;
/** How many recent history turns go to the model with each question. */
const MAX_HISTORY_TURNS = 20;
/** Largest portfolio context accepted, serialised. */
const MAX_CONTEXT_CHARS = 20000;
/** Largest stock payload accepted by analyze-stock, serialised. */
const MAX_STOCK_CHARS = 5000;

/**
 * The chat history that actually goes to the model: well-formed turns only,
 * each capped, and just the most recent ones. Clients send their whole visible
 * conversation, which had no bound at all.
 */
export function clampHistory(history: unknown): Array<{ sender: string; text: string }> {
  if (!Array.isArray(history)) return [];
  return history
    .filter((msg): msg is { id?: unknown; sender: string; text: string } =>
      !!msg && typeof msg === "object"
      && typeof (msg as any).sender === "string" && (msg as any).sender.length > 0
      && typeof (msg as any).text === "string"
      && (msg as any).id !== "welcome" && (msg as any).id !== "error")
    .map((msg) => ({ sender: msg.sender, text: msg.text.slice(0, MAX_TURN_CHARS) }))
    .slice(-MAX_HISTORY_TURNS);
}

export interface AiCopilotRouterDeps {
  /** The signed-in user behind a request's session cookie, or null. */
  sessionUserId?: (req: express.Request) => string | null;
}

export function createAiCopilotRouter(deps: AiCopilotRouterDeps = {}): express.Router {

  const router = express.Router();

  /**
   * Every POST to /api/gemini spends the server's GEMINI_API_KEY, with Google
   * Search grounding, and needed no sign-in and had no limit, so anyone who
   * found the endpoint had a free LLM on the owner's bill.
   *
   * A signed-in student is limited per account, so a class sharing one school
   * IP does not share one allowance. Callers without a server session, which
   * includes the local demo profile and offline accounts, are limited per IP
   * with a smaller allowance. Signing in is not required, because that would
   * switch Chanakya off for the demo pass entirely.
   */
  router.use("/api/gemini", (req, res, next) => {
    const userId = deps.sessionUserId?.(req) || null;
    res.locals.aiCaller = userId
      ? { key: `user:${userId}`, limit: 60 }
      : { key: `ip:${ipKeyGenerator(req.ip || "unknown")}`, limit: 30 };
    next();
  });
  router.use("/api/gemini", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: (_req, res) => res.locals.aiCaller.limit,
    keyGenerator: (_req, res) => res.locals.aiCaller.key,
    skip: (req) => req.method !== "POST",
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: "Chanakya needs a short break — too many questions in a few minutes. Please try again shortly." },
  }));

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
  router.get("/api/gemini/status", (_req, res) => {
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

  router.post("/api/gemini/chat", async (req, res) => {
    const { message, context, portfolioContext, history = [] } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message prompt is required" });
    }
    if (message.length > MAX_TURN_CHARS) {
      return res.status(400).json({ error: `Please keep your question under ${MAX_TURN_CHARS} characters.` });
    }

    const combinedContext = context || portfolioContext;
    if (combinedContext && JSON.stringify(combinedContext).length > MAX_CONTEXT_CHARS) {
      return res.status(400).json({ error: "Portfolio context is too large to send." });
    }
    const recentHistory = clampHistory(history);

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
      for (const msg of recentHistory) {
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
  router.post("/api/gemini/portfolio-audit", async (req, res) => {
    const { holdings = [], cashBalance = 1000000, portfolioValue = 1000000 } = req.body;
    if (JSON.stringify(req.body).length > MAX_CONTEXT_CHARS) {
      return res.status(400).json({ error: "Portfolio is too large to audit in one request." });
    }

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
  router.post("/api/gemini/analyze-stock", async (req, res) => {
    const { stock } = req.body;
    if (!stock || typeof stock !== "object") {
      return res.status(400).json({ error: "Stock data is required" });
    }
    if (JSON.stringify(stock).length > MAX_STOCK_CHARS) {
      return res.status(400).json({ error: "Stock data is too large." });
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
  router.get("/api/market-pulse", async (req, res) => {
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
  router.get("/api/market-news", async (req, res) => {
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

  return router;
}

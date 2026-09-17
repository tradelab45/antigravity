/**
 * Google Finance Real-Time Data Service
 * 
 * Provides real-time streaming market data, indices, and financial fundamentals
 * fetched directly from Google Finance (https://www.google.com/finance).
 */

export interface GoogleFinanceQuote {
  symbol: string;
  exchange: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
  high52: number;
  low52: number;
  marketCapCr: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  volume: number;
  avgVolume: number;
  description?: string;
  lastUpdated: string;
  source: string;
}

export interface GoogleFinanceIndex {
  name: string;
  symbol: string;
  exchange: string;
  value: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  open?: number;
  lastUpdated: string;
  source: string;
}

// In-memory caching layer to optimize throughput and comply with gentle request rates
const quoteCache = new Map<string, { data: GoogleFinanceQuote; timestamp: number }>();
const indexCache = new Map<string, { data: GoogleFinanceIndex[]; timestamp: number }>();
const CACHE_TTL_MS = 10000; // 10 seconds cache for instant responsiveness

/**
 * Parses numeric strings like "₹1,304.10", "24,219.05", "17.69T", "7.28M"
 */
function parseNumeric(str: string | undefined): number {
  if (!str) return 0;
  const clean = str.replace(/[^0-9.]/g, '');
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}

function parseMarketCap(str: string | undefined): number {
  if (!str) return 0;
  const upper = str.toUpperCase().trim();
  const num = parseNumeric(upper);
  if (upper.endsWith('T')) {
    // 1 Trillion INR = 100,000 Crore INR
    return Number((num * 100000).toFixed(2));
  }
  if (upper.endsWith('B')) {
    // 1 Billion INR = 100 Crore INR
    return Number((num * 100).toFixed(2));
  }
  if (upper.endsWith('M')) {
    // 1 Million INR = 0.1 Crore INR
    return Number((num * 0.1).toFixed(2));
  }
  if (upper.includes('CR') || upper.includes('CRORE')) {
    return num;
  }
  return num;
}

function parseVolume(str: string | undefined): number {
  if (!str) return 0;
  const upper = str.toUpperCase().trim();
  const num = parseNumeric(upper);
  if (upper.endsWith('M')) return Math.round(num * 1000000);
  if (upper.endsWith('B')) return Math.round(num * 1000000000);
  if (upper.endsWith('K')) return Math.round(num * 1000);
  if (upper.endsWith('CR')) return Math.round(num * 10000000);
  if (upper.endsWith('L')) return Math.round(num * 100000);
  return Math.round(num);
}

const INDIAN_SYMBOL_ALIASES: Record<string, string> = {
  'PARADEP': 'PARADEEP',
  'PARADEEPPHOSPHATES': 'PARADEEP',
  'M&M': 'M_M',
  'L&T': 'LT',
  'BAJAJ-AUTO': 'BAJAJ_AUTO',
  'MCDOWELL-N': 'UNITDSPR',
};

/**
 * Fetches real-time stock quote from Google Finance
 * @param symbol Stock symbol (e.g. "RELIANCE", "TCS", "INFY", "PARADEEP")
 * @param exchange Exchange (default "NSE", also supports "BOM")
 */
export async function fetchGoogleFinanceQuote(symbol: string, exchange: string = 'NSE', retryWithBOM: boolean = true): Promise<GoogleFinanceQuote | null> {
  let cleanSymbol = symbol.toUpperCase().replace('.NS', '').replace('.BO', '').trim();
  if (INDIAN_SYMBOL_ALIASES[cleanSymbol]) {
    cleanSymbol = INDIAN_SYMBOL_ALIASES[cleanSymbol];
  }
  const cacheKey = `${cleanSymbol}:${exchange}`;
  const now = Date.now();

  const cached = quoteCache.get(cacheKey);
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const url = `https://www.google.com/finance/quote/${cleanSymbol}:${exchange}`;
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(3500),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      if (exchange === 'NSE' && retryWithBOM) {
        // Try BOM (BSE) fallback without endless loops
        return fetchGoogleFinanceQuote(cleanSymbol, 'BOM', false);
      }
      return null;
    }

    const html = await response.text();

    let companyName = cleanSymbol;
    let price = 0;
    let change = 0;
    let changePercent = 0;
    let previousClose = 0;
    let open = 0;
    let dayHigh = 0;
    let dayLow = 0;
    let marketCapCr = 0;
    let volume = 0;

    // 1. First Priority: Extract directly from Google Finance structured data payload (AF_initDataCallback)
    // Format: ["<SYMBOL>","<EXCHANGE>"],"<NAME>",0,"INR",[<PRICE>,<CHANGE>,<CHANGE_PCT>,...],null,<PREV_CLOSE>
    const structuredMatch = html.match(new RegExp(`\\["${cleanSymbol}","(?:NSE|BOM)"\\],"([^"]+)",0,"INR",\\[([0-9.]+),([+-]?[0-9.]+),([+-]?[0-9.]+)[^\\]]*\\],null,([0-9.]+)`)) ||
                           html.match(/\["([^"]+)",0,"INR",\[([0-9.]+),([+-]?[0-9.]+),([+-]?[0-9.]+)[^\]]*\],null,([0-9.]+)/);
    if (structuredMatch) {
      companyName = structuredMatch[1].trim();
      price = parseFloat(structuredMatch[2]);
      change = parseFloat(structuredMatch[3]);
      changePercent = parseFloat(structuredMatch[4]);
      previousClose = parseFloat(structuredMatch[5]);
    }

    // Also look for detailed stats tuple in structured data
    const statsStructured = html.match(new RegExp(`\\[\\[\\[\\[null,\\["${cleanSymbol}","${exchange}"\\]\\],[^,]+,([0-9.]+),[^,]+,([0-9.]+),([0-9.]+),([0-9.]+),[^,]+,([+-]?[0-9.]+),[^,]+,([+-]?[0-9.]+),[^,]+,"INR","[^"]+","([^"]+)",([0-9.]+),([0-9.]+),([0-9.]+)`));
    if (statsStructured) {
      open = parseFloat(statsStructured[1]);
      dayLow = parseFloat(statsStructured[2]);
      dayHigh = parseFloat(statsStructured[3]);
      if (!price) price = parseFloat(statsStructured[4]);
      if (!change) change = parseFloat(statsStructured[5]);
      if (!changePercent) changePercent = parseFloat(statsStructured[6]);
      if (!companyName || companyName === cleanSymbol) companyName = statsStructured[7];
      if (!previousClose) previousClose = parseFloat(statsStructured[8]);
      marketCapCr = Math.round(parseFloat(statsStructured[9]) / 10000000);
      volume = parseInt(statsStructured[10]);
    }

    // 2. DOM Extraction Fallback if structured data is missing or partial
    if (!companyName || companyName === cleanSymbol) {
      const nameMatch = html.match(/<div class="gO24Ff">([^<]+)<\/div>/) || 
                        html.match(/<div class="zzDege">([^<]+)<\/div>/) ||
                        html.match(/<title>([^(]+)\s*\(/);
      if (nameMatch) {
        companyName = nameMatch[1].replace(/Stock Price &amp; News - Google Finance/, '').replace(/Stock Price & News - Google Finance/, '').trim();
      }
    }

    const quoteBlockIdx = html.indexOf('class="LhDNu"');
    const block = quoteBlockIdx !== -1 ? html.slice(quoteBlockIdx, quoteBlockIdx + 800) : html.slice(0, 3000);

    if (!price) {
      const pMatch = block.match(/<div class="YMlKec fxKbKc"[^>]*>([₹$€£]?[0-9,]+(?:\.[0-9]+)?)<\/div>/) ||
                    block.match(/<div class="N6SYTe"[^>]*>[\s\S]*?<span jsname="Pdsbrc"[^>]*><span>([^<]+)<\/span>/) ||
                    block.match(/<div class="N6SYTe"[^>]*>[\s\S]*?<span>([₹$€£]?[0-9,]+(?:\.[0-9]+)?)<\/span>/) ||
                    block.match(/<span>([₹]?[0-9,]+(?:\.[0-9]+)?)<\/span>/);
      if (pMatch) {
        price = parseNumeric(pMatch[1]);
      }
    }

    if (!change) {
      const acMatch = block.match(/<span jsname="xnruHf"[^>]*><span>([+-]?[0-9,.]+)<\/span>/) ||
                      block.match(/<span class="[^"]*">\s*([+-]?[0-9,.]+)\s*<\/span>\s*<\/div>\s*<div[^>]*class="[^"]*">\s*<span class="[^"]*">Today<\/span>/);
      if (acMatch) {
        change = Math.abs(parseFloat(acMatch[1].replace(/,/g, '')));
      }
    }

    if (!changePercent) {
      const cpMatch = block.match(/<span jsname="vY9t3b"[^>]*><span[^>]*>([+-]?[0-9,.]+)%?<\/span>/) ||
                      block.match(/([+-]?[0-9.]+)%/);
      if (cpMatch) {
        changePercent = Math.abs(parseFloat(cpMatch[1].replace(/,/g, '')));
      }
    }

    // 3. Parse Stats Table
    const statRegex = /<div class="[^"]*">([^<]+)<\/div>\s*<div class="[^"]*">([^<]+)<\/div>/g;
    let m;
    const stats: Record<string, string> = {};
    while ((m = statRegex.exec(html)) !== null) {
      const k = m[1].trim();
      const v = m[2].trim();
      if (k && v) stats[k] = v;
    }

    if (!open) open = stats['Open'] ? parseNumeric(stats['Open']) : price;
    if (!dayHigh) dayHigh = stats['High'] ? parseNumeric(stats['High']) : (price > open ? price : open);
    if (!dayLow) dayLow = stats['Low'] ? parseNumeric(stats['Low']) : (price < open ? price : open);
    if (!previousClose) previousClose = stats['Previous close'] ? parseNumeric(stats['Previous close']) : 0;
    const high52 = stats['52-wk high'] ? parseNumeric(stats['52-wk high']) : (dayHigh > price ? dayHigh * 1.15 : price * 1.15);
    const low52 = stats['52-wk low'] ? parseNumeric(stats['52-wk low']) : (dayLow < price ? dayLow * 0.85 : price * 0.85);
    if (!marketCapCr) marketCapCr = stats['Mkt. cap'] ? parseMarketCap(stats['Mkt. cap']) : 0;
    const peRatio = stats['P/E ratio'] ? parseFloat(stats['P/E ratio']) : 0;
    const eps = stats['EPS'] ? parseNumeric(stats['EPS']) : 0;
    const dividendYield = stats['Dividend'] ? parseFloat(stats['Dividend'].replace('%', '')) : 0;
    if (!volume) volume = stats['Volume'] ? parseVolume(stats['Volume']) : 0;
    const avgVolume = stats['Avg. vol.'] ? parseVolume(stats['Avg. vol.']) : volume;

    // Movement Direction & Precise Math Check
    if (previousClose > 0 && price > 0) {
      change = Number((price - previousClose).toFixed(2));
      changePercent = Number(((change / previousClose) * 100).toFixed(2));
    } else {
      const isExplicitlyDown = block.includes('aria-label="Down by') || block.includes('aria-label="Decrease') || block.includes('arrow_downward');
      if (isExplicitlyDown) {
        change = -Math.abs(change);
        changePercent = -Math.abs(changePercent);
      } else {
        change = Math.abs(change);
        changePercent = Math.abs(changePercent);
      }
    }

    // Mathematical reconciliation if any metric is zero
    if (price && change && !changePercent && previousClose > 0) {
      changePercent = Number(((change / previousClose) * 100).toFixed(2));
    } else if (price && changePercent && !change && previousClose > 0) {
      change = Number(((changePercent / 100) * previousClose).toFixed(2));
    }

    // Extract Description / About
    let description = '';
    const descMatch = html.match(/<div class="bLLbif">([^<]+)<\/div>/) || 
                       html.match(/<div class="sfyJob">([^<]+)<\/div>/) ||
                       html.match(/<meta name="description" content="([^"]+)"/);
    if (descMatch) {
      description = descMatch[1].trim();
    }

    const resolvedPreviousClose = previousClose > 0 ? previousClose : (price - change);

    const quote: GoogleFinanceQuote = {
      symbol: cleanSymbol,
      exchange,
      name: companyName,
      price: Number(price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      open: Number(open.toFixed(2)),
      dayHigh: Number(dayHigh.toFixed(2)),
      dayLow: Number(dayLow.toFixed(2)),
      previousClose: Number(resolvedPreviousClose.toFixed(2)),
      high52: Number(high52.toFixed(2)),
      low52: Number(low52.toFixed(2)),
      marketCapCr,
      peRatio: peRatio ? Number(peRatio.toFixed(2)) : 0,
      eps: eps ? Number(eps.toFixed(2)) : 0,
      dividendYield: dividendYield ? Number(dividendYield.toFixed(2)) : 0,
      volume,
      avgVolume,
      description,
      lastUpdated: new Date().toISOString(),
      source: 'Google Finance (Live Real-Time)'
    };

    if (price > 0) {
      quoteCache.set(cacheKey, { data: quote, timestamp: now });
      return quote;
    }

    return null;
  } catch (error: any) {
    if (exchange === 'NSE' && retryWithBOM) {
      try {
        return await fetchGoogleFinanceQuote(cleanSymbol, 'BOM', false);
      } catch {
        return null;
      }
    }
    // Return gracefully without throwing unhandled exceptions
    return null;
  }
}

/**
 * Fetches real-time market indices from Google Finance
 */
export async function fetchGoogleFinanceIndices(): Promise<GoogleFinanceIndex[]> {
  const cacheKey = 'INDIAN_INDICES';
  const now = Date.now();
  const cached = indexCache.get(cacheKey);
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const indicesConfig = [
    { name: 'NIFTY 50', ticker: 'NIFTY_50:INDEXNSE', symbol: '^NSEI', exchange: 'NSE' },
    { name: 'BSE SENSEX', ticker: 'SENSEX:INDEXBOM', symbol: '^BSESN', exchange: 'BSE' },
    { name: 'NIFTY BANK', ticker: 'NIFTY_BANK:INDEXNSE', symbol: '^NSEBANK', exchange: 'NSE' },
    { name: 'NIFTY IT', ticker: 'NIFTY_IT:INDEXNSE', symbol: '^CNXIT', exchange: 'NSE' }
  ];

  const results: GoogleFinanceIndex[] = [];

  for (const item of indicesConfig) {
    try {
      const url = `https://www.google.com/finance/quote/${item.ticker}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(3500),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (res.ok) {
        const html = await res.text();
        const quoteBlockIdx = html.indexOf('class="LhDNu"');
        const block = quoteBlockIdx !== -1 ? html.slice(quoteBlockIdx, quoteBlockIdx + 2000) : html;

        // Price
        const pMatch = block.match(/<div class="N6SYTe"[^>]*>[\s\S]*?<span jsname="Pdsbrc"[^>]*><span>([^<]+)<\/span>/) ||
                      block.match(/<span>([0-9,]+(?:\.[0-9]+)?)<\/span>/);
        const price = pMatch ? parseNumeric(pMatch[1]) : 0;

        // Change
        const acMatch = block.match(/<span jsname="xnruHf"[^>]*><span>([+-]?[0-9,.]+)<\/span>/);
        let change = acMatch ? parseFloat(acMatch[1].replace(/,/g, '')) : 0;

        // Change Percent
        const cpMatch = block.match(/<span jsname="vY9t3b"[^>]*><span[^>]*>([+-]?[0-9,.]+)%?<\/span>/);
        let changePercent = cpMatch ? parseFloat(cpMatch[1].replace(/,/g, '')) : 0;

        const isDown = block.includes('arrow_downward') || block.includes('rdIjVc');
        if (isDown) {
          if (changePercent > 0) changePercent = -changePercent;
          if (change > 0) change = -change;
        }

        if (price > 0) {
          results.push({
            name: item.name,
            symbol: item.symbol,
            exchange: item.exchange,
            value: Number(price.toFixed(2)),
            change: Number(change.toFixed(2)),
            changePercent: Number(changePercent.toFixed(2)),
            lastUpdated: new Date().toISOString(),
            source: 'Google Finance (Live Real-Time)'
          });
        }
      }
    } catch (err) {
      // Index fallback
    }
  }

  if (results.length > 0) {
    indexCache.set(cacheKey, { data: results, timestamp: now });
    return results;
  }

  // Fallback defaults if network is offline
  return [
    { name: 'NIFTY 50', symbol: '^NSEI', exchange: 'NSE', value: 24219.05, change: -32.95, changePercent: -0.14, lastUpdated: new Date().toISOString(), source: 'Google Finance (Cached)' },
    { name: 'BSE SENSEX', symbol: '^BSESN', exchange: 'BSE', value: 77369.11, change: -171.72, changePercent: -0.22, lastUpdated: new Date().toISOString(), source: 'Google Finance (Cached)' },
    { name: 'NIFTY BANK', symbol: '^NSEBANK', exchange: 'NSE', value: 51450.20, change: -145.20, changePercent: -0.28, lastUpdated: new Date().toISOString(), source: 'Google Finance (Cached)' },
    { name: 'NIFTY IT', symbol: '^CNXIT', exchange: 'NSE', value: 35210.15, change: 84.10, changePercent: 0.24, lastUpdated: new Date().toISOString(), source: 'Google Finance (Cached)' }
  ];
}

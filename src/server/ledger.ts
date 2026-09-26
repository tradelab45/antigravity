/**
 * The server-held trading ledger.
 *
 * Every trade used to execute in the browser and live in localStorage, which
 * meant the server had no idea what anyone's portfolio was. `portfolioValue`
 * on a stored account sat at the signup figure forever, and the class board
 * had to ask each browser to report its own number — a figure anyone could
 * edit with developer tools.
 *
 * With the ledger here, the server decides: it prices the trade from its own
 * quote rather than from anything the client sends, it checks the cash and the
 * holding, and it keeps the record. A portfolio it executed is a portfolio it
 * can vouch for.
 */

export type LedgerProduct = 'CNC' | 'MIS';
export type LedgerSide = 'BUY' | 'SELL';

export interface LedgerHolding {
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
  totalInvested: number;
  productType: LedgerProduct;
  buyDate: string;
}

export interface LedgerOrder {
  id: string;
  symbol: string;
  stockName: string;
  type: LedgerSide;
  orderType: 'MARKET';
  productType: LedgerProduct;
  quantity: number;
  price: number;
  totalAmount: number;
  timestamp: string;
  status: 'EXECUTED';
  realizedPnL?: number;
}

export interface Ledger {
  cashBalance: number;
  holdings: Record<string, LedgerHolding>;
  orders: LedgerOrder[];
  /** Set whenever the ledger changes, so a client can tell which copy is newer. */
  updatedAt: string;
}

export const INITIAL_CAPITAL = 1_000_000;

/** Orders kept per account. A learner's whole history is not needed to trade. */
export const MAX_ORDERS = 500;

export function emptyLedger(now: string = new Date().toISOString()): Ledger {
  return { cashBalance: INITIAL_CAPITAL, holdings: {}, orders: [], updatedAt: now };
}

const round = (value: number) => Number(value.toFixed(2));

export interface ExecuteRequest {
  symbol: string;
  stockName: string;
  quantity: number;
  side: LedgerSide;
  product: LedgerProduct;
  /** The server's own quote. Never a price supplied by the caller. */
  price: number;
}

export interface ExecuteResult {
  ok: boolean;
  message: string;
  ledger?: Ledger;
  order?: LedgerOrder;
}

/**
 * Applies one market order and returns a new ledger.
 *
 * Pure, so the rules can be tested without a server, a file or a request.
 */
export function executeOrder(
  ledger: Ledger,
  request: ExecuteRequest,
  now: Date = new Date(),
): ExecuteResult {
  const { symbol, quantity, side, product, price } = request;

  if (!symbol || typeof symbol !== 'string') {
    return { ok: false, message: 'That symbol is not tradable here.' };
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { ok: false, message: 'Enter a whole number of shares.' };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { ok: false, message: 'A market quote is not available for that share yet.' };
  }

  const turnover = round(price * quantity);
  const existing = ledger.holdings[symbol];
  const timestamp = now.toISOString();

  const order: LedgerOrder = {
    id: `ord_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    symbol,
    stockName: request.stockName || symbol,
    type: side,
    orderType: 'MARKET',
    productType: product,
    quantity,
    price: round(price),
    totalAmount: turnover,
    timestamp,
    status: 'EXECUTED',
  };

  if (side === 'BUY') {
    // MIS gives five times leverage, so a fifth of the value is blocked.
    const margin = product === 'MIS' ? round(turnover / 5) : turnover;
    if (margin > ledger.cashBalance) {
      return {
        ok: false,
        message: `Not enough practice cash. This needs ₹${margin.toLocaleString('en-IN')} and you have ₹${ledger.cashBalance.toLocaleString('en-IN')}.`,
      };
    }

    const quantityAfter = (existing?.quantity ?? 0) + quantity;
    const investedAfter = round((existing?.totalInvested ?? 0) + turnover);

    return {
      ok: true,
      message: `Bought ${quantity} ${symbol} at ₹${order.price}.`,
      order,
      ledger: {
        cashBalance: round(ledger.cashBalance - margin),
        holdings: {
          ...ledger.holdings,
          [symbol]: {
            symbol,
            quantity: quantityAfter,
            avgBuyPrice: round(investedAfter / quantityAfter),
            totalInvested: investedAfter,
            productType: product,
            buyDate: existing?.buyDate || timestamp,
          },
        },
        orders: [order, ...ledger.orders].slice(0, MAX_ORDERS),
        updatedAt: timestamp,
      },
    };
  }

  if (!existing || existing.quantity < quantity) {
    return {
      ok: false,
      message: `You hold ${existing?.quantity ?? 0} ${symbol}, so ${quantity} cannot be sold.`,
    };
  }

  const costOfSold = round(existing.avgBuyPrice * quantity);
  order.realizedPnL = round(turnover - costOfSold);

  const remaining = existing.quantity - quantity;
  const holdings = { ...ledger.holdings };
  if (remaining === 0) {
    delete holdings[symbol];
  } else {
    holdings[symbol] = {
      ...existing,
      quantity: remaining,
      totalInvested: round(existing.totalInvested - costOfSold),
    };
  }

  return {
    ok: true,
    message: `Sold ${quantity} ${symbol} at ₹${order.price}.`,
    order,
    ledger: {
      cashBalance: round(ledger.cashBalance + turnover),
      holdings,
      orders: [order, ...ledger.orders].slice(0, MAX_ORDERS),
      updatedAt: timestamp,
    },
  };
}

/**
 * What the portfolio is worth at the supplied quotes.
 *
 * Unlike the figure the class board used to receive, this is computed here
 * from a ledger this server wrote, so it is measured rather than reported.
 */
export function portfolioValue(ledger: Ledger, quotes: Record<string, number>): number {
  const invested = Object.values(ledger.holdings).reduce((total, holding) => {
    const quote = quotes[holding.symbol];
    const price = Number.isFinite(quote) && quote > 0 ? quote : holding.avgBuyPrice;
    return total + price * holding.quantity;
  }, 0);
  return round(ledger.cashBalance + invested);
}

/**
 * Accepts a ledger shape read off disk, discarding anything malformed.
 *
 * A file can be edited or half-written, and a NaN cash balance would poison
 * every later trade.
 */
export function sanitiseLedger(raw: unknown): Ledger {
  const candidate = (raw ?? {}) as Partial<Ledger>;
  const cash = Number(candidate.cashBalance);

  const holdings: Record<string, LedgerHolding> = {};
  for (const [symbol, value] of Object.entries(candidate.holdings ?? {})) {
    const holding = value as Partial<LedgerHolding>;
    const quantity = Number(holding?.quantity);
    const avg = Number(holding?.avgBuyPrice);
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    if (!Number.isFinite(avg) || avg <= 0) continue;
    holdings[symbol] = {
      symbol,
      quantity: Math.floor(quantity),
      avgBuyPrice: round(avg),
      totalInvested: round(Number(holding?.totalInvested) || avg * quantity),
      productType: holding?.productType === 'MIS' ? 'MIS' : 'CNC',
      buyDate: typeof holding?.buyDate === 'string' ? holding.buyDate : new Date().toISOString(),
    };
  }

  return {
    cashBalance: Number.isFinite(cash) && cash >= 0 ? round(cash) : INITIAL_CAPITAL,
    holdings,
    orders: Array.isArray(candidate.orders) ? candidate.orders.slice(0, MAX_ORDERS) : [],
    updatedAt:
      typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString(),
  };
}

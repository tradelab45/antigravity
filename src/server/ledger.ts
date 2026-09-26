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
  /**
   * Why the position closed, when it was not the learner who closed it. The
   * trade review already reads this field on locally executed orders.
   */
  exitReason?: 'SQUARE_OFF';
}

export interface Ledger {
  cashBalance: number;
  holdings: Record<string, LedgerHolding>;
  orders: LedgerOrder[];
  /** Set whenever the ledger changes, so a client can tell which copy is newer. */
  updatedAt: string;
}

export const INITIAL_CAPITAL = 1_000_000;

/** Intraday leverage. A fifth of the value is blocked as margin. */
export const MIS_LEVERAGE = 5;

/**
 * When the exchange closes intraday positions, in IST. NSE squares off around
 * 3:20pm; the app has told learners that in the order ticket since long before
 * anything did it.
 */
export const SQUARE_OFF_IST_HOUR = 15;
export const SQUARE_OFF_IST_MINUTE = 20;

/** IST is UTC+5:30 all year — no daylight saving to account for. */
const IST_OFFSET_MS = 5.5 * 60 * 60_000;

/**
 * Orders kept per account.
 *
 * The cap used to be 500 and that was also everything there was: order 501
 * deleted order 1 for good. In an app whose point is reviewing your own
 * trades, a term's early trades quietly disappearing is the wrong thing to
 * lose. The file now keeps four times as many, and a ledger sent to a browser
 * still carries only the most recent page of them — the rest are asked for
 * through /api/portfolio/orders when someone actually scrolls back.
 */
export const MAX_STORED_ORDERS = 2_000;

/** How many orders travel with a ledger. The browser pages back for older. */
export const MAX_SYNCED_ORDERS = 500;

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
    // One position per share, so a symbol cannot be held as delivery and as
    // intraday at once. Without this the later buy rewrote the holding's
    // product: buying a share intraday that was already held in delivery
    // turned the whole holding intraday, and the 3:20pm square-off then sold
    // shares that had been bought to keep. A real broker keeps the two
    // positions apart; this simulator keeps one, and says so rather than
    // quietly converting the older one.
    if (existing && existing.productType !== product) {
      const held = existing.productType === 'MIS' ? 'an intraday' : 'a delivery';
      const wanted = product === 'MIS' ? 'intraday' : 'delivery';
      return {
        ok: false,
        message: `You already hold ${existing.quantity} ${symbol} as ${held} position. This simulator keeps one position per share, so close it before buying ${symbol} as ${wanted}.`,
      };
    }

    // MIS gives five times leverage, so a fifth of the value is blocked.
    const margin = product === 'MIS' ? round(turnover / MIS_LEVERAGE) : turnover;
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
        orders: [order, ...ledger.orders].slice(0, MAX_STORED_ORDERS),
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

  // Only the margin was taken from the cash balance on an intraday buy, so
  // only the margin comes back. Returning the whole sale value credited four
  // fifths of a position that was never paid for: a break-even round trip in
  // 10 shares at ₹1,000 handed the learner ₹8,000 out of nowhere, and the
  // server's copy then replaced the browser's correct figure.
  const marginRefund =
    existing.productType === 'MIS' ? round(costOfSold / MIS_LEVERAGE) : costOfSold;

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
      cashBalance: round(ledger.cashBalance + marginRefund + order.realizedPnL),
      holdings,
      orders: [order, ...ledger.orders].slice(0, MAX_STORED_ORDERS),
      updatedAt: timestamp,
    },
  };
}

/**
 * The instant an intraday position taken at `takenAt` must be closed.
 *
 * Worked in IST rather than the server's zone, because the rule belongs to
 * the exchange, not to wherever this happens to be running.
 */
export function squareOffDeadline(takenAt: string | number | Date): number {
  const taken = new Date(takenAt);
  if (Number.isNaN(taken.getTime())) return Number.POSITIVE_INFINITY;

  // Shift into IST, read the calendar day there, then shift back.
  const ist = new Date(taken.getTime() + IST_OFFSET_MS);
  const midnightIst = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate());
  const closeIst = midnightIst + SQUARE_OFF_IST_HOUR * 60 * 60_000 + SQUARE_OFF_IST_MINUTE * 60_000;
  return closeIst - IST_OFFSET_MS;
}

export interface SquareOffResult {
  ledger: Ledger;
  /** The orders the square-off placed, newest first. Empty when nothing was due. */
  closed: LedgerOrder[];
}

/**
 * Closes intraday positions whose session has ended.
 *
 * The order ticket has always said "auto square-off occurs at 3:20 PM IST",
 * and nothing did it: a MIS position bought on Monday was still open on
 * Friday, still on five times leverage, which is the opposite of what the
 * product is. A learner could hold ₹50 lakh of stock against ₹10 lakh of
 * practice cash indefinitely and never meet the thing that makes intraday
 * trading intraday.
 *
 * Each position is closed at the quote the server holds, or at its own
 * average cost when there is no quote — never at a made-up price, so a
 * square-off cannot invent a profit or a loss that the market did not give.
 */
export function squareOffIntraday(
  ledger: Ledger,
  quotes: Record<string, number> = {},
  now: Date = new Date(),
): SquareOffResult {
  const due = Object.values(ledger.holdings).filter(
    (holding) =>
      holding.productType === 'MIS' && squareOffDeadline(holding.buyDate) <= now.getTime(),
  );
  if (due.length === 0) return { ledger, closed: [] };

  let working = ledger;
  const closed: LedgerOrder[] = [];

  for (const holding of due) {
    const quote = quotes[holding.symbol];
    const price = Number.isFinite(quote) && quote > 0 ? quote : holding.avgBuyPrice;
    const result = executeOrder(
      working,
      {
        symbol: holding.symbol,
        stockName: holding.symbol,
        quantity: holding.quantity,
        side: 'SELL',
        product: 'MIS',
        price,
      },
      now,
    );
    // A refusal here would mean the ledger disagrees with itself, so the
    // position is left alone rather than half closed.
    if (!result.ok) continue;
    working = result.ledger;
    result.order.exitReason = 'SQUARE_OFF';
    closed.push(result.order);
  }

  return { ledger: working, closed };
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

export interface LedgerSyncView extends Ledger {
  /** How many orders the server holds, of which `orders` is the newest page. */
  orderCount: number;
}

/**
 * The ledger as a browser receives it: the newest page of orders, and a count
 * of how many there are in total.
 *
 * Sending two thousand orders on every sync would cost a slow connection more
 * than the whole rest of the payload, and nothing on screen shows more than a
 * screenful at a time.
 */
export function syncView(ledger: Ledger): LedgerSyncView {
  return {
    ...ledger,
    orders: ledger.orders.slice(0, MAX_SYNCED_ORDERS),
    orderCount: ledger.orders.length,
  };
}

/**
 * One page of the order history, newest first.
 *
 * `offset` counts from the newest order, so page two of a hundred is
 * offset 100 — the same numbers the caller already has on screen.
 */
export function orderPage(
  ledger: Ledger,
  offset: number = 0,
  limit: number = 100,
): { orders: LedgerOrder[]; offset: number; limit: number; total: number } {
  const start = Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0;
  const size = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 200) : 100;
  return {
    orders: ledger.orders.slice(start, start + size),
    offset: start,
    limit: size,
    total: ledger.orders.length,
  };
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
    orders: Array.isArray(candidate.orders) ? candidate.orders.slice(0, MAX_STORED_ORDERS) : [],
    updatedAt:
      typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString(),
  };
}

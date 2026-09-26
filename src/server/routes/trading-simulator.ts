/**
 * Trade recording route (/api/trades), extracted from the server.ts monolith.
 *
 * The trade and user stores stay in server.ts, because the admin console reads
 * them too; they are injected here. This module declares only the record shape
 * it writes, so it does not depend on server.ts internals.
 */
import express from "express";
import { rateLimit } from "express-rate-limit";

/** A recorded trade, as persisted by the store server.ts owns. */
export interface TradeRecord {
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

/** The user fields this route reads: who they are, and their running trade count. */
export interface TradeUserRef {
  id: string;
  fullName?: string;
  email?: string;
  totalTrades?: number;
}

export interface TradesRouterDeps {
  loadTrades: () => TradeRecord[];
  saveTrades: (trades: TradeRecord[]) => void;
  loadUsers: () => TradeUserRef[];
  saveUsers: (users: any[]) => void;
  /** The signed-in user behind a request's session cookie, or null. */
  sessionUserId: (req: express.Request) => string | null;
}

const ORDER_TYPES = new Set(["MARKET", "LIMIT", "GTT"]);
const STATUSES = new Set(["EXECUTED", "PENDING", "CANCELLED"]);
const SYMBOL = /^[A-Z0-9&._-]{1,20}$/;
const ORDER_ID = /^[A-Za-z0-9_-]{1,64}$/;

const positiveNumber = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function createTradesRouter(deps: TradesRouterDeps): express.Router {
  const { loadTrades, saveTrades, loadUsers, saveUsers, sessionUserId } = deps;
  const router = express.Router();

  /**
   * Who is trading comes from the session, never from the body. This route
   * used to take userId, userName and userEmail from the request with no
   * sign-in at all, so anyone could write trades in anyone's name, and because
   * the ledger keeps only the latest 1,000 trades, a thousand junk requests
   * would push every genuine trade out of the admin dashboard and exports.
   */
  const requireTrader = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = sessionUserId(req);
    const user = userId ? loadUsers().find(u => u.id === userId) : undefined;
    if (!user) {
      return res.status(401).json({ success: false, message: "Sign in to record trades." });
    }
    res.locals.trader = user;
    next();
  };

  /** Per account, so one account cannot flood the ledger on its own. */
  const tradeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    keyGenerator: (_req, res) => (res.locals.trader as TradeUserRef).id,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message: "Too many trades recorded in a short time. Please wait and try again." },
  });

  // Record / Live Sync Trade from Trading App
  router.post("/api/trades", requireTrader, tradeLimiter, (req, res) => {
    try {
      const {
        orderId,
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

      const cleanSymbol = typeof symbol === "string" ? symbol.trim().toUpperCase() : "";
      const cleanQuantity = positiveNumber(quantity);
      const cleanPrice = positiveNumber(price);
      if (!SYMBOL.test(cleanSymbol) || cleanQuantity === null || cleanPrice === null) {
        return res.status(400).json({ success: false, message: "A valid symbol, quantity, and price are required." });
      }

      const trader = res.locals.trader as TradeUserRef;
      const suppliedTotal = Number(totalAmount);
      const suppliedPnL = Number(realizedPnL);

      const trades = loadTrades();
      const newTrade: TradeRecord = {
        id: `TRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        orderId: typeof orderId === "string" && ORDER_ID.test(orderId) ? orderId : `ORD-${Date.now()}`,
        userId: trader.id,
        userName: trader.fullName || trader.id,
        userEmail: trader.email || "",
        symbol: cleanSymbol,
        stockName: typeof stockName === "string" && stockName.trim() ? stockName.trim().slice(0, 120) : cleanSymbol,
        type: type === "SELL" ? "SELL" : "BUY",
        orderType: ORDER_TYPES.has(orderType) ? orderType : "MARKET",
        productType: productType === "MIS" ? "MIS" : "CNC",
        quantity: cleanQuantity,
        price: cleanPrice,
        totalAmount: Number.isFinite(suppliedTotal) && suppliedTotal > 0
          ? suppliedTotal
          : Number((cleanPrice * cleanQuantity).toFixed(2)),
        timestamp: new Date().toISOString(),
        status: STATUSES.has(status) ? status : "EXECUTED",
        realizedPnL: Number.isFinite(suppliedPnL) ? suppliedPnL : 0
      };

      trades.unshift(newTrade);
      // Keep last 1000 trades
      const trimmed = trades.slice(0, 1000);
      saveTrades(trimmed);

      const users = loadUsers();
      const user = users.find(u => u.id === trader.id);
      if (user) {
        user.totalTrades = (user.totalTrades || 0) + 1;
        saveUsers(users);
      }

      res.json({ success: true, trade: newTrade, message: "Trade recorded successfully" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to record trade" });
    }
  });

  return router;
}

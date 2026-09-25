/**
 * Trade recording route (/api/trades), extracted from the server.ts monolith.
 *
 * The trade and user stores stay in server.ts, because the admin console reads
 * them too; they are injected here. This module declares only the record shape
 * it writes, so it does not depend on server.ts internals.
 */
import express from "express";

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

/** The only user fields this route touches: its running trade count. */
export interface TradeUserRef {
  id: string;
  totalTrades?: number;
}

export interface TradesRouterDeps {
  loadTrades: () => TradeRecord[];
  saveTrades: (trades: TradeRecord[]) => void;
  loadUsers: () => TradeUserRef[];
  saveUsers: (users: any[]) => void;
}

export function createTradesRouter(deps: TradesRouterDeps): express.Router {
  const { loadTrades, saveTrades, loadUsers, saveUsers } = deps;
  const router = express.Router();

  // Record / Live Sync Trade from Trading App
  router.post("/api/trades", (req, res) => {
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
      const newTrade: TradeRecord = {
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

  return router;
}

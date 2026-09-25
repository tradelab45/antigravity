/**
 * Screener.in HTTP route, extracted from the server.ts monolith.
 *
 * The screener scraper itself lives in the screener module
 * (src/modules/screener/server/screenerService.ts). server.ts stays the owner
 * of the live stock list and passes a getter for it, so this router always
 * reads the current prices rather than a snapshot taken at mount time.
 */
import express from "express";
import { getScreenerData } from "../../modules/screener/server/screenerService";

/** The fields of a live stock record this route passes to the screener. */
export interface ScreenerStockRef {
  symbol: string;
  name: string;
  price: number;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
}

export interface ScreenerRouterDeps {
  /** Returns the live stock list; a getter, not a snapshot. */
  getStocks: () => ScreenerStockRef[];
}

export function createScreenerRouter(deps: ScreenerRouterDeps): express.Router {
  const { getStocks } = deps;
  const router = express.Router();

  // 2b. Direct Screener.in Company & Historical Dataset Endpoint
  router.get("/api/screener/:symbol", async (req, res) => {
    const symbol = req.params.symbol.toUpperCase().replace('.NS', '').replace('.BO', '');
    const stock = getStocks().find((s) => s.symbol === symbol);
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

  return router;
}

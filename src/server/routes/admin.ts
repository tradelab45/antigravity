/**
 * Admin console HTTP routes, extracted from the server.ts monolith.
 *
 * The admin passkey and the active broadcast are owned here, because nothing
 * outside the admin surface reads them. The user and trade stores stay in
 * server.ts, which injects them through AdminRouterDeps — this module only
 * declares the record fields it actually reads, so it does not need to know
 * the full shape of a stored user or trade.
 */
import express from "express";
import { timingSafeEqual } from "crypto";
import { rateLimit } from "express-rate-limit";
import { csvCell } from "../csvCell";

const MIN_PASSKEY_LENGTH = 24;

/** The fields of a stored user record that the admin routes read or write. */
export interface AdminUserFields {
  id: string;
  fullName: string;
  email: string;
  username: string;
  phone?: string;
  ageGroup?: string;
  experienceLevel: string;
  initialCapital: number;
  registeredAt: string;
  lastLoginAt: string;
  portfolioValue?: number;
}

/** The fields of a stored trade record that the admin routes read. */
export interface AdminTradeFields {
  id: string;
  orderId?: string;
  userName?: string;
  userEmail?: string;
  symbol: string;
  stockName: string;
  type: string;
  orderType: string;
  productType: string;
  quantity: number;
  price: number;
  totalAmount: number;
  timestamp: string;
  status: string;
  realizedPnL?: number;
}

export interface AdminRouterDeps {
  loadUsers: () => AdminUserFields[];
  saveUsers: (users: any[]) => void;
  loadTrades: () => AdminTradeFields[];
  toSafeUser: (user: any) => unknown;
}

export function createAdminRouter(deps: AdminRouterDeps): express.Router {
  const { loadUsers, saveUsers, loadTrades, toSafeUser } = deps;
  const router = express.Router();

  /**
   * Caps failed admin authentication per client. /verify-passkey answers
   * yes or no to any guess, and every x-admin-key check did the same, with no
   * limit, which made the passkey an online guessing target. Only failures
   * count (skipSuccessfulRequests), so the owner's own dashboard traffic with
   * the right key never uses up the allowance.
   */
  const adminGuessLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, message: 'Too many failed administrator sign-in attempts. Please wait and try again.' },
  });
  router.use('/api/admin', adminGuessLimiter);


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
  router.get("/api/admin/overview", requireAdminAuth, (req, res) => {
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
  router.post("/api/admin/verify-passkey", (req, res) => {
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
  router.post("/api/admin/update-passkey", (req, res) => {
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
    // .env.example generates the passkey with `openssl rand -hex 24`, 48
    // characters. A 12-character floor let a rotation drop well below that.
    if (!newPasskey || String(newPasskey).trim().length < MIN_PASSKEY_LENGTH) {
      return res.status(400).json({ success: false, message: `New passkey must be at least ${MIN_PASSKEY_LENGTH} characters.` });
    }
    CURRENT_ADMIN_PASSKEY = String(newPasskey).trim();
    return res.json({ success: true, message: "Administrator passkey updated successfully." });
  });

  // Admin API: List all registered users (profile details & sign-in data)
  router.get("/api/admin/users", requireAdminAuth, (req, res) => {
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
  router.post("/api/admin/users/reset-capital", requireAdminAuth, (req, res) => {
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
  router.delete("/api/admin/users/:id", requireAdminAuth, (req, res) => {
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
  router.post("/api/admin/broadcast", requireAdminAuth, (req, res) => {
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
  router.delete("/api/admin/broadcast", requireAdminAuth, (req, res) => {
    CURRENT_BROADCAST = null;
    res.json({ success: true, message: "Active broadcast cleared." });
  });

  // Public API: Fetch Active Broadcast Announcement (Used by Simulator client tabs)
  router.get("/api/broadcast", (req, res) => {
    res.json({ success: true, broadcast: CURRENT_BROADCAST });
  });

  // Admin API: List all live & recorded trades

  router.get("/api/admin/trades", requireAdminAuth, (req, res) => {
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

  // Direct Export Trades to CSV
  router.get("/api/admin/export/trades-csv", requireAdminAuth, (req, res) => {
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

      const escapeCsv = csvCell;

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
  router.get("/api/admin/export/users-csv", requireAdminAuth, (req, res) => {
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

      const escapeCsv = csvCell;

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
  router.get("/api/admin/export/notebookllm", requireAdminAuth, (req, res) => {
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

  return router;
}

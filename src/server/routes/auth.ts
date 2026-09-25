/**
 * Authentication HTTP routes, extracted from the server.ts monolith.
 *
 * Covers sign-up, sign-in, the Google identity flow and the admin-token-gated
 * user exports. The user store stays in server.ts, because the admin console and
 * the trade routes read it too, so it is injected here along with the password
 * hashing helpers and the academy session issuer.
 *
 * The no-store Cache-Control middleware for /api/auth stays registered in
 * server.ts ahead of this router, so it still covers every route below.
 */
import express from "express";
import fs from "fs";
import path from "path";
import { createAuthLimiter } from "../../modules/auth/server/authRateLimit";
import { csvCell } from "../csvCell";

/** A stored user record, as persisted by the store server.ts owns. */
export interface AuthUserRecord {
  id: string;
  fullName: string;
  email: string;
  username: string;
  passwordHash?: string;
  googleId?: string;
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

export interface AuthRouterDeps {
  loadUsers: () => AuthUserRecord[];
  saveUsers: (users: AuthUserRecord[]) => void;
  toSafeUser: (user: any) => unknown;
  hashPassword: (password: string) => string;
  verifyPassword: (password: string, user: any) => boolean;
  /** Issues the academy session cookie once credentials check out. */
  issueSession: (req: express.Request, res: express.Response, userId: string) => void;
  /** Ends every session a user holds, used when an account changes hands. */
  revokeUserSessions?: (userId: string) => void;
}

/**
 * Every age group a sign-up form actually offers, plus the server's default.
 * Anything else is replaced by the default, the same way experienceLevel is
 * handled, so a crafted request cannot store arbitrary text that later lands
 * in the admin's spreadsheet exports.
 */
const DEFAULT_AGE_GROUP = "13-17 (Teen)";
const KNOWN_AGE_GROUPS = new Set([
  DEFAULT_AGE_GROUP,
  // AuthPage
  "13-15 (Middle School)",
  "16-18 (High School Teen)",
  "19-24 (College/Undergrad)",
  "25+ (Adult Learner)",
  // AuthModal
  "16-18 (Teen Investor)",
  "18-22 (College Student)",
  "22+ (Young Professional)",
]);

export function createAuthRouter(deps: AuthRouterDeps): express.Router {
  const { loadUsers, saveUsers, toSafeUser, hashPassword, verifyPassword, issueSession, revokeUserSessions } = deps;
  const router = express.Router();

  // User Signup
  router.post("/api/auth/signup", createAuthLimiter(5, 60 * 60 * 1000), async (req, res) => {
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

      const newUser: AuthUserRecord = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        fullName: cleanFullName,
        email: cleanEmail,
        username: cleanUsername,
        passwordHash: hashPassword(cleanPassword),
        phone: String(phone || "").trim().slice(0, 24),
        ageGroup: typeof ageGroup === "string" && KNOWN_AGE_GROUPS.has(ageGroup) ? ageGroup : DEFAULT_AGE_GROUP,
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

      issueSession(req, res, newUser.id);
      res.json({ success: true, user: toSafeUser(newUser), message: "Account created successfully!" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || "Failed to register user" });
    }
  });

  // User Login
  router.post("/api/auth/login", createAuthLimiter(10), (req, res) => {
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

      issueSession(req, res, user.id);
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
  router.get("/api/auth/google/config", (req, res) => {
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

  function uniqueUsernameFromEmail(email: string, users: AuthUserRecord[]): string {
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
  router.post("/api/auth/google", createAuthLimiter(20), async (req, res) => {
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
        // First time this account is reached through Google, and it was matched
        // by email rather than by an existing Google link. Sign-up never checks
        // that the person owns the address they type, so a password already on
        // this account may belong to someone who registered the victim's email
        // in advance. Google has now verified the real owner: the unverified
        // password stops working and any session it opened is ended, or that
        // person could keep signing in and watch the owner's activity.
        if (!user.googleId && (user.passwordHash || user.password)) {
          delete user.passwordHash;
          delete user.password;
          revokeUserSessions?.(user.id);
        }
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

      issueSession(req, res, user.id);
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
  router.get("/api/auth/export/excel", requireAdminExport, (req, res) => {
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
  router.get("/api/auth/export/notebookllm", requireAdminExport, (req, res) => {
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

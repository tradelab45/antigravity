/**
 * Academy HTTP routes, extracted from the server.ts monolith.
 *
 * The academy service itself lives in the academy module
 * (src/modules/academy/server/academyService.ts) and already exposes an Express
 * router; this file owns constructing it and mounting its surface, and hands
 * back the two handlers server.ts still has to place itself.
 *
 * `logout` is returned rather than mounted here on purpose: server.ts registers
 * it *after* the no-store Cache-Control middleware for /api/auth, so that
 * response keeps that header. Mounting it inside this router would register it
 * ahead of that middleware and silently drop the header.
 *
 * `issueSession` is returned because the auth routes use it to start a session
 * once credentials check out.
 */
import express from "express";
import { createAcademyService } from "../../modules/academy/server/academyService";

export function createAcademyRoutes(dataFilePath: string) {
  const service = createAcademyService(dataFilePath);
  const router = express.Router();
  router.use('/api/academy', service.router);
  return { router, logout: service.logout, issueSession: service.issueSession };
}

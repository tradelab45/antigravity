/**
 * Academy HTTP routes.
 *
 * The academy service lives in the academy module
 * (src/modules/academy/server/academyService.ts) and exposes an Express router;
 * this file constructs it and mounts it under /api/academy.
 *
 * The Academy has no sessions of its own. It asks the app's signed session who
 * the caller is, through the lookup server.ts hands in, so a sign-out, a
 * revoke-everywhere, a password change or a deleted account reaches it too.
 * The branch this came from also returned a logout handler and issueSession
 * for a separate Academy session store; that store was removed when the
 * Academy moved onto the app's session, so there is nothing to hand back.
 */
import express from "express";
import { createAcademyService } from "../../modules/academy/server/academyService";

export function createAcademyRoutes(
  dataFilePath: string,
  resolveUserId: (req: express.Request) => string | null,
) {
  const service = createAcademyService(dataFilePath, resolveUserId);
  const router = express.Router();
  router.use('/api/academy', service.router);
  return { router };
}

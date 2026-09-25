import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Guards the invariant rather than any single route: every async handler in the
 * extracted routers goes through asyncRoute, so a future edit cannot quietly
 * reintroduce an Express 4 handler whose throw ends the process.
 *
 * It scans src/server/routes only. Routes still inside server.ts on a given
 * branch belong to other modules, and their own branches wrap them.
 */
const ROUTES_DIR = join(process.cwd(), 'src', 'server', 'routes');
const RAW_ASYNC_HANDLER = /\b(router|app)\.(get|post|put|patch|delete|all)\([^\n]*\basync\s*\(/;

test('no router registers an async handler without asyncRoute', () => {
  const offenders: string[] = [];
  for (const file of readdirSync(ROUTES_DIR).filter((f) => f.endsWith('.ts'))) {
    readFileSync(join(ROUTES_DIR, file), 'utf8').split('\n').forEach((line, i) => {
      if (RAW_ASYNC_HANDLER.test(line) && !line.includes('asyncRoute(')) offenders.push(`${file}:${i + 1}  ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [], `wrap these handlers in asyncRoute():\n${offenders.join('\n')}`);
});

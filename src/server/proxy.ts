import type { Express } from 'express';

/**
 * Which proxies may tell the app who the caller is.
 *
 * Without this, a request that reaches the app through a reverse proxy — the
 * way a hosting provider like Hostinger serves a Node app — arrives from the
 * proxy's own address. Every visitor then shares one address, and every limit
 * keyed on it becomes a limit on the whole site: ten failed sign-ins anywhere
 * locked everybody out for fifteen minutes, and five sign-ups an hour was the
 * ceiling for all new learners combined.
 *
 * `X-Forwarded-For` is believed only when the connection itself comes from a
 * loopback or private-network address, which is where a hosting provider's
 * proxy sits. A caller on the internet connecting directly has neither, so
 * cannot mint a fresh identity by writing the header themselves. Express reads
 * the header from the right, stopping at the first address it does not trust,
 * so anything a client prepends is ignored.
 *
 * `TRUST_PROXY_HOPS` overrides this with an exact count, for a deployment
 * whose proxy sits on a public address.
 */
export function configureTrustProxy(app: Express, env: NodeJS.ProcessEnv = process.env): string | number {
  const hops = Number(env.TRUST_PROXY_HOPS || 0);
  const setting: string | number =
    Number.isInteger(hops) && hops > 0 && hops <= 5 ? hops : 'loopback, linklocal, uniquelocal';
  app.set('trust proxy', setting);
  return setting;
}

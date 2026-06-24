import postgres from 'postgres';

// ─── Postgres client (singleton) ────────────────────────────────────────
// Uses postgres.js — the modern, fast, tagged-template-literal SQL client.
// Connection string comes from Railway's auto-injected DATABASE_URL when
// the Postgres service is linked to this app's service in the same project.
//
// Important: we cache the client on globalThis so Next.js's dev HMR doesn't
// open a new connection pool on every file save. In production this is just
// a normal module-level singleton.

declare global {
  // eslint-disable-next-line no-var
  var __pg: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add a Postgres service in Railway and link it to this service, or set DATABASE_URL manually in .env.local for local dev.'
    );
  }
  return postgres(url, {
    // Railway's internal Postgres connections are over TLS but with a
    // self-signed cert; rejectUnauthorized:false is the standard workaround.
    // External connections (during local dev pointing at Railway) need this too.
    ssl: url.includes('railway') ? 'require' : 'prefer',
    // Connection pool — small because each Vercel/Railway request is short
    // and we don't want to exhaust Postgres's max_connections.
    max: 10,
    // Idle timeout so connections close cleanly under low load
    idle_timeout: 20,
    // Type parsing — return JSONB columns as parsed JSON objects, not strings
    types: {
      // postgres.js defaults are already good; no overrides needed
    },
  });
}

function getClient(): ReturnType<typeof postgres> {
  if (!globalThis.__pg) {
    globalThis.__pg = createClient();
  }
  return globalThis.__pg;
}

// Lazy proxy: the real postgres client is created on first use, not at module
// load. This matters because `next build` imports every route module during
// page-data collection — if we instantiated here, the build would crash with
// "DATABASE_URL is not set" (a Dockerfile `RUN npm run build` has no runtime
// env vars). Deferring means importing `sql` is always safe; the connection
// string is only required when a query actually runs (at request time).
export const sql = new Proxy(function () {} as unknown as ReturnType<typeof postgres>, {
  apply(_target, _thisArg, args: Parameters<ReturnType<typeof postgres>>) {
    // Tagged-template call: sql`SELECT ...`
    return (getClient() as (...a: unknown[]) => unknown)(...(args as unknown[]));
  },
  get(_target, prop) {
    const client = getClient() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
}) as ReturnType<typeof postgres>;

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

export const sql = globalThis.__pg ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__pg = sql;
}

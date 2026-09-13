// config/db.js — PostgreSQL connection pool (Dual-Mode: Cloud Neon & Local PostgreSQL)
// Supports both DATABASE_URL (Cloud Neon / Supabase) and local DB parameters (localhost:5432).
// Configurable via DB_MODE: 'online' | 'local' | 'auto'

import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import dns from 'dns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from backend directory and process cwd
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Setup resilient DNS fallback resolver:
// Local router/campus Wi-Fi DNS servers frequently return RCODE_REFUSED or ENOTFOUND for *.neon.tech domains.
// We intercept dns.lookup and fall back to public DNS (8.8.8.8 / 1.1.1.1) if the local resolver fails.
const publicResolver = new dns.promises.Resolver();
publicResolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const origLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  let opts = options;
  let cb = callback;
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }
  origLookup(hostname, opts, (err, address, family) => {
    if (err && (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN' || err.code === 'EREFUSED')) {
      publicResolver.resolve4(hostname)
        .then((addresses) => {
          if (!addresses || addresses.length === 0) {
            return cb(err);
          }
          if (opts && opts.all) {
            return cb(null, addresses.map((a) => ({ address: a, family: 4 })));
          }
          return cb(null, addresses[0], 4);
        })
        .catch(() => cb(err));
      return;
    }
    return cb(err, address, family);
  });
};

const { Pool } = pg;

const rawDbMode = (process.env.DB_MODE || '').toLowerCase().trim();
const hasOnlineUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());

// Determine active mode
const mode = rawDbMode === 'local'
  ? 'local'
  : (rawDbMode === 'online' || hasOnlineUrl ? 'online' : 'local');

// Online Neon / Cloud PostgreSQL configuration
const onlineConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Neon / AWS RDS / Supabase
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Local PostgreSQL configuration
const localConfig = process.env.LOCAL_DATABASE_URL
  ? {
      connectionString: process.env.LOCAL_DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME     || 'crddms',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

// Choose primary configuration
let activeConfig = mode === 'online' && hasOnlineUrl ? onlineConfig : localConfig;
let activeMode = mode === 'online' && hasOnlineUrl ? 'online' : 'local';

let pool = new Pool(activeConfig);
let connectionStatus = {
  connected: false,
  mode: activeMode,
  database: null,
  version: null,
  latencyMs: null,
  error: null,
  lastChecked: null,
};

// Diagnostic test connection on startup with automatic fallback if in 'auto' mode or if online fails
async function testAndReportConnection() {
  const startTime = Date.now();
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT current_database() AS db, version() AS ver, NOW() AS now');
    const latency = Date.now() - startTime;
    client.release();

    connectionStatus = {
      connected: true,
      mode: activeMode,
      database: res.rows[0].db,
      version: res.rows[0].ver,
      latencyMs: latency,
      error: null,
      lastChecked: new Date(),
    };

    if (activeMode === 'online') {
      const host = (process.env.DATABASE_URL || '').split('@')[1]?.split('/')[0] || 'Neon Cloud';
      console.log(`🌐  Connected to ONLINE Cloud Database (${host})`);
      console.log(`    Database: ${res.rows[0].db} · Latency: ${latency}ms`);
    } else {
      console.log(`💻  Connected to LOCAL PostgreSQL Database (localhost:${localConfig.port || 5432}/${res.rows[0].db})`);
      console.log(`    Database: ${res.rows[0].db} · Latency: ${latency}ms`);
    }
  } catch (err) {
    connectionStatus.connected = false;
    connectionStatus.error = err.message;
    connectionStatus.lastChecked = new Date();

    console.error(`❌  Database connection FAILED (${activeMode} mode):`, err.message);

    // If online mode failed and local config is available, attempt fallback
    if (activeMode === 'online' && rawDbMode !== 'strict_online') {
      console.log('🔄  Attempting automatic fallback to Local PostgreSQL (localhost:5432)…');
      try {
        const localPool = new Pool(localConfig);
        const fallbackClient = await localPool.connect();
        const res = await fallbackClient.query('SELECT current_database() AS db, version() AS ver');
        fallbackClient.release();

        pool = localPool;
        activeMode = 'local';
        connectionStatus = {
          connected: true,
          mode: 'local (fallback)',
          database: res.rows[0].db,
          version: res.rows[0].ver,
          latencyMs: Date.now() - startTime,
          error: null,
          lastChecked: new Date(),
        };
        console.log(`✅  Fallback SUCCESSFUL: Connected to LOCAL PostgreSQL (${res.rows[0].db})`);
        return;
      } catch (fallbackErr) {
        console.error('❌  Local PostgreSQL fallback also failed:', fallbackErr.message);
      }
    }

    if (process.env.VERCEL && !process.env.DATABASE_URL) {
      console.error('⚠️  VERCEL DEPLOYMENT: DATABASE_URL is missing in Vercel Environment Variables.');
      console.error('👉  Add DATABASE_URL (e.g. Neon PostgreSQL URL) in your Vercel Project Settings.');
    } else {
      console.error('');
      console.error('👉  Configuration guide:');
      console.error('    - Online Cloud DB: set DATABASE_URL=postgresql://user:pass@host/db?sslmode=require');
      console.error('    - Local DB: set DB_MODE=local (or DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)');
    }
  }
}

testAndReportConnection();

// Export pool query wrapper so pool re-assignment (in fallback) works transparently
const db = {
  query: (...args) => pool.query(...args),
  connect: (...args) => pool.connect(...args),
  end: (...args) => pool.end(...args),
  on: (...args) => pool.on(...args),
  getStatus: () => ({ ...connectionStatus }),
  getPool: () => pool,
};

export { db, connectionStatus };
export default db;

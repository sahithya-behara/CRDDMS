// config/db.js — PostgreSQL connection pool
// Supports both DATABASE_URL (cloud/Neon) and individual DB_* env vars (local).
// Change values in .env — never hardcode credentials here.

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

// Decide connection config: use DATABASE_URL if provided, otherwise use individual vars
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },  // required for Neon / most cloud providers
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME     || 'crddms_db',
      user:     process.env.DB_USER     || 'crddms_user',
      password: process.env.DB_PASSWORD || 'crddms_pass',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

const pool = new Pool(poolConfig);

// Test connection on startup and print a clear message
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌  Database connection FAILED:', err.message);
    if (process.env.VERCEL && !process.env.DATABASE_URL) {
      console.error('⚠️  VERCEL DEPLOYMENT WARNING: DATABASE_URL is missing in Vercel Environment Variables.');
      console.error('👉  Add DATABASE_URL (e.g. Neon PostgreSQL URL) in your Vercel Project Settings.');
    } else {
      console.error('');
      console.error('👉  Check your .env file or Vercel Environment Variables. Required:');
      console.error('    DATABASE_URL=postgresql://user:pass@host/db?sslmode=require');
    }
  } else {
    console.log('✅  PostgreSQL connected successfully');
    release();
  }
});

export default pool;

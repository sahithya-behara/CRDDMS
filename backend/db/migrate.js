// db/migrate.js — Runs schema + seed against your configured database
// Usage: node db/migrate.js

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Build connection config ──────────────────────────────
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME     || 'crddms_db',
      user:     process.env.DB_USER     || 'crddms_user',
      password: process.env.DB_PASSWORD || 'crddms_pass',
    };

const pool = new Pool(poolConfig);

// ── Helper: split SQL file into individual statements ────
// Splits on semicolons that are NOT inside $$ ... $$ blocks
function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;

  const lines = sql.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--')) { continue; } // skip comment-only lines

    if (trimmed.includes('$$')) {
      inDollarQuote = !inDollarQuote;
    }

    current += line + '\n';

    if (!inDollarQuote && trimmed.endsWith(';')) {
      const stmt = current.trim();
      if (stmt && stmt !== ';') statements.push(stmt);
      current = '';
    }
  }
  // Push any remaining content
  if (current.trim()) statements.push(current.trim());

  return statements.filter(s => s.length > 1);
}

async function migrate() {
  console.log('');
  console.log('🔄  CRDDMS Database Migration');
  console.log('─'.repeat(50));

  // Step 1: Test connection with retry loop
  let client;
  const maxRetries = 10;
  const retryDelay = 5000;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      console.log(`📡  Connecting to database (attempt ${i}/${maxRetries})…`);
      client = await pool.connect();
      const res = await client.query('SELECT current_database(), version()');
      console.log(`✅  Connected to: ${res.rows[0].current_database}`);
      console.log(`    PostgreSQL ${res.rows[0].version.split(' ')[1]}`);
      break;
    } catch (err) {
      console.error(`⚠️  Connection attempt ${i} failed: ${err.message}`);
      if (i === maxRetries) {
        console.error('');
        console.error('❌  Cannot connect to database after maximum retries!');
        console.error('👉  Check your .env file — DATABASE_URL should look like:');
        console.error('    DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require');
        process.exit(1);
      }
      console.log(`Waiting ${retryDelay / 1000}s before retrying…`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  // Step 2: Run schema
  try {
    console.log('');
    console.log('📋  Creating tables…');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('✅  All tables created (or already exist)');
  } catch (err) {
    console.error(`❌  Schema error: ${err.message}`);
    if (err.detail) console.error(`    Detail: ${err.detail}`);
    if (client) client.release();
    await pool.end();
    process.exit(1);
  }

  // Step 3: Run seed (statement by statement for clear error reporting)
  try {
    console.log('');
    console.log('🌱  Inserting seed data…');
    const seedSQL = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

    // Run the whole seed in one go (DO $$ blocks need to stay together)
    await client.query(seedSQL);
    console.log('✅  Seed data inserted');
  } catch (err) {
    console.error(`❌  Seed error: ${err.message}`);
    if (err.detail)   console.error(`    Detail:   ${err.detail}`);
    if (err.hint)     console.error(`    Hint:     ${err.hint}`);
    if (err.position) console.error(`    Position: ${err.position}`);
    // Non-fatal — schema is done, seed data is optional
    console.error('    (Seed failed but schema is OK. You can still start the server.)');
  }

  // Step 4: Ensure seed files exist on disk to prevent 404 download errors
  try {
    console.log('');
    console.log('📂  Ensuring seed files exist on disk…');
    const backendRoot = path.join(__dirname, '..');
    const seedFiles = [
      'uploads/cse/2024-25/21CSE001_marks.pdf',
      'uploads/cse/2024-25/ravi_ai_paper.pdf',
      'uploads/admin/naac/naac_c1.pdf',
      'uploads/exam/2024-25/exam_schedule.xlsx',
      'uploads/mba/2022-23/mba_admit_2022.pdf',
      'uploads/ece/2024-25/ece_lab_manual.pdf',
      'uploads/admin/aicte/aicte_2024.pdf',
      'uploads/admin/finance/fee_q1_2024.pdf'
    ];

    for (const fileRelPath of seedFiles) {
      const fullPath = path.join(backendRoot, fileRelPath);
      const fileDir = path.dirname(fullPath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      if (!fs.existsSync(fullPath)) {
        const ext = path.extname(fullPath).toLowerCase();
        let dummyContent = '';
        if (ext === '.pdf') {
          // Minimal valid blank PDF
          dummyContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << >> /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 0 >>\nstream\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000212 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n261\n%%EOF`;
        } else if (ext === '.xlsx') {
          dummyContent = 'Dummy Excel spreadsheet data';
        } else {
          dummyContent = 'Dummy file content';
        }
        fs.writeFileSync(fullPath, dummyContent);
        console.log(`    Created seed file: ${fileRelPath}`);
      }
    }
    console.log('✅  Seed files check complete');
  } catch (err) {
    console.error(`❌  Failed to create seed files: ${err.message}`);
  }

  if (client) client.release();
  await pool.end();

  console.log('');
  console.log('─'.repeat(50));
  console.log('🎉  Migration complete! Now run:');
  console.log('    npm run dev');
  console.log('');
}

migrate();

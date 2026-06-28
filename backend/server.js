// server.js — Express application entry point
// All routes are registered here in a single, easy-to-read place.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pool from './config/db.js';

dotenv.config();

// Route imports (each module handles one resource)
import authRoutes       from './routes/auth.routes.js';
import departmentRoutes from './routes/departments.routes.js';
import documentRoutes   from './routes/documents.routes.js';
import ocrRoutes        from './routes/ocr.routes.js';
import searchRoutes     from './routes/search.routes.js';
import complianceRoutes from './routes/compliance.routes.js';
import archiveRoutes    from './routes/archive.routes.js';
import auditRoutes      from './routes/audit.routes.js';
import userRoutes       from './routes/users.routes.js';
import reportRoutes     from './routes/reports.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    if (allowedOrigins.includes(origin) || isLocalhost) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiter — 200 requests per 15 minutes per IP
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically (e.g. for preview)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ─────────────────────────────────────────────
// Every route group has a clear prefix — easy to find and modify.
app.use('/api/auth',        authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/documents',   documentRoutes);
app.use('/api/ocr',         ocrRoutes);
app.use('/api/search',      searchRoutes);
app.use('/api/compliance',  complianceRoutes);
app.use('/api/archive',     archiveRoutes);
app.use('/api/audit',       auditRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/reports',     reportRoutes);

// Root path friendly response
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to the CRDDMS API Backend Service',
    status: 'online',
    version: '1.0.0',
    documentation: 'All API routes are prefixed with /api',
    healthCheck: '/api/health',
    frontend: 'https://sahithya-behara.github.io/CRDDMS/'
  });
});

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// Public Stats endpoint (real-time data for homepage screen)
app.get('/api/public/stats', async (req, res, next) => {
  try {
    const [deptCount, studentCount, facultyCount, docCount, ocrCount, storageSum] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM departments'),
      pool.query('SELECT COUNT(*)::int AS count FROM students'),
      pool.query('SELECT COUNT(*)::int AS count FROM faculty'),
      pool.query('SELECT COUNT(*)::int AS count FROM uploaded_documents'),
      pool.query('SELECT COUNT(*)::int AS count FROM ocr_extracted_text'),
      pool.query('SELECT COALESCE(SUM(file_size), 0)::bigint AS sum FROM uploaded_documents'),
    ]);
    res.json({
      success: true,
      departments: deptCount.rows[0].count,
      students: studentCount.rows[0].count,
      faculty: facultyCount.rows[0].count,
      documents: docCount.rows[0].count,
      ocrProcessed: ocrCount.rows[0].count,
      storageBytes: storageSum.rows[0].sum,
    });
  } catch (err) {
    next(err);
  }
});

// ── Global Error Handler ───────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀  CRDDMS API running at http://localhost:${PORT}`);
});

export default app;

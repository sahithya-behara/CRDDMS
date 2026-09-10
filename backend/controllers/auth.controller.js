// controllers/auth.controller.js
// Handles login and registration. Each function does one clear thing.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { logAction } from '../services/audit.service.js';
import { AppError } from '../middleware/errorHandler.js';

// ── POST /api/auth/login ─────────────────────────────────
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required.', 400);
    }

    const { rows } = await pool.query(
      `SELECT u.*, d.department_code FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.email = $1 AND u.is_active = true`,
      [email.toLowerCase()]
    );

    const user = rows[0];
    if (!user) throw new AppError('Invalid email or password.', 401);

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new AppError('Invalid email or password.', 401);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, department_id: user.department_id },
      process.env.JWT_SECRET || 'crddms_jwt_secret_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    await logAction({ userId: user.id, action: 'login', ip: req.ip, details: { email } });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        department_code: user.department_code,
      },
    });
  } catch (err) { next(err); }
}

// ── POST /api/auth/logout ────────────────────────────────
export async function logout(req, res, next) {
  try {
    await logAction({ userId: req.user?.id, action: 'logout', ip: req.ip });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) { next(err); }
}

// ── POST /api/auth/register ──────────────────────────────
export async function register(req, res, next) {
  try {
    const { name, email, password, role = 'staff', department_id } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required.', 400);
    }

    const parsedDeptId = department_id ? parseInt(department_id, 10) : null;
    const hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, department_id`,
      [name, email.toLowerCase(), hash, role, parsedDeptId]
    );

    const user = rows[0];

    // Fetch department details if department_id was assigned
    if (user.department_id) {
      const deptRes = await pool.query('SELECT department_code, department_name FROM departments WHERE id = $1', [user.department_id]);
      if (deptRes.rows.length > 0) {
        user.department_code = deptRes.rows[0].department_code;
        user.department_name = deptRes.rows[0].department_name;
      }
    }

    await logAction({ userId: user.id, action: 'user_registered', ip: req.ip, details: { email, role, department_id: user.department_id } });

    res.status(201).json({ success: true, user });
  } catch (err) { next(err); }
}

// ── GET /api/auth/me ─────────────────────────────────────
export async function getMe(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.created_at,
              d.department_name, d.department_code
       FROM users u LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    res.json({ success: true, user: rows[0] });
  } catch (err) { next(err); }
}

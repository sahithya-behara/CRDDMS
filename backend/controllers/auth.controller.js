// controllers/auth.controller.js
// Handles login, two-step registration (email verification + admin approval), and secure password recovery.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/db.js';
import { logAction } from '../services/audit.service.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../services/email.service.js';
import realtimeService from '../services/realtime.service.js';

// Ensure reset token table exists on demand
async function ensureResetTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_reset_token_hash ON password_reset_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_reset_user ON password_reset_tokens(user_id);
    `);
  } catch (err) {
    console.error('Warning: could not verify password_reset_tokens table:', err.message);
  }
}

// ── POST /api/auth/login ─────────────────────────────────
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required.', 400);
    }

    const { rows } = await pool.query(
      `SELECT u.*, d.department_code, d.department_name FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    const user = rows[0];
    if (!user) throw new AppError('Invalid email or password.', 401);

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new AppError('Invalid email or password.', 401);

    // ── Enforce Account Status Restrictions ───────────────
    const status = user.account_status || (user.is_active ? 'ACTIVE' : 'SUSPENDED');

    if (status === 'REJECTED') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_REJECTED',
        message: 'Your registration was not approved. Please contact IT administration if you require assistance.',
        reason: user.rejection_reason || null,
      });
    }

    if (status === 'PENDING_EMAIL_VERIFICATION' || user.email_verified === false) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Account email has not been verified. Please verify your email address before logging in.',
        email: user.email,
      });
    }

    if (status === 'PENDING_SUPER_ADMIN_APPROVAL') {
      return res.status(403).json({
        success: false,
        code: 'AWAITING_SUPER_ADMIN_APPROVAL',
        message: 'Your email has been verified. Your account is currently awaiting Super Admin approval.',
        email: user.email,
      });
    }

    if (status === 'SUSPENDED' || !user.is_active) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account is currently suspended. Please contact IT administration.',
      });
    }

    // Only ACTIVE accounts proceed to session generation
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, department_id: user.department_id },
      process.env.JWT_SECRET || 'crddms_jwt_secret_key_2026',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    await logAction({ userId: user.id, action: 'login', ip: req.ip, details: { email: user.email } });

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
        department_name: user.department_name,
        account_status: user.account_status,
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
    const { name, email, password, confirmPassword, role = 'staff', department_id } = req.body;

    if (!name || !email || !password) {
      throw new AppError('Name, institutional email, and password are required.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@') || normalizedEmail.indexOf('.') === -1) {
      throw new AppError('Please provide a valid email address.', 400);
    }

    if (confirmPassword && password !== confirmPassword) {
      throw new AppError('Passwords do not match.', 400);
    }

    // Password strength enforcement
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters long.', 400);
    }
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      throw new AppError('Password must contain uppercase, lowercase, and numeric characters.', 400);
    }

    // Duplicate email verification
    const existingUser = await pool.query('SELECT id, account_status FROM users WHERE email = $1', [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      throw new AppError('An institutional account with this email address already exists.', 400);
    }

    const parsedDeptId = department_id ? parseInt(department_id, 10) : null;
    const hash = await bcrypt.hash(password, 10);

    // Generate cryptographically random verification token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresInHours = 24;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    // Initial account state: PENDING_EMAIL_VERIFICATION and is_active = FALSE
    const { rows } = await pool.query(
      `INSERT INTO users (
         name, email, password_hash, role, department_id,
         account_status, email_verified, is_active,
         email_verification_token_hash, email_verification_expires_at
       )
       VALUES ($1, $2, $3, $4, $5, 'PENDING_EMAIL_VERIFICATION', false, false, $6, $7)
       RETURNING id, name, email, role, department_id, account_status, email_verified`,
      [name.trim(), normalizedEmail, hash, role, parsedDeptId, tokenHash, expiresAt]
    );

    const user = rows[0];

    // Build verification URL
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const verifyUrl = `${frontendBase}/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    // Dispatch verification email
    const emailResult = await sendVerificationEmail({
      toEmail: user.email,
      userName: user.name,
      verifyUrl,
      expiresInHours,
    });

    await logAction({
      userId: user.id,
      action: 'user_registered',
      ip: req.ip,
      details: { email: user.email, role: user.role, status: 'PENDING_EMAIL_VERIFICATION' },
    });

    res.status(201).json({
      success: true,
      message: 'Registration initiated successfully. A verification link has been sent to your email address.',
      emailPreviewUrl: emailResult?.previewUrl || null,
      verifyUrl: process.env.NODE_ENV === 'development' ? verifyUrl : undefined,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        account_status: user.account_status,
      },
    });
  } catch (err) { next(err); }
}

// ── GET /api/auth/verify-email ───────────────────────────
// Also supports POST /api/auth/verify-email
export async function verifyEmail(req, res, next) {
  try {
    const rawToken = req.query.token || req.body.token;

    if (!rawToken || typeof rawToken !== 'string') {
      throw new AppError('Verification token is required.', 400);
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

    // Retrieve user with matching token
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.account_status,
              u.email_verified, u.email_verification_expires_at,
              d.department_name, d.department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.email_verification_token_hash = $1`,
      [tokenHash]
    );

    const user = rows[0];

    if (!user) {
      throw new AppError(
        'This verification link is invalid, has expired, or has already been used. Please request a new verification email.',
        400
      );
    }

    // Check expiration
    if (new Date(user.email_verification_expires_at) < new Date()) {
      throw new AppError(
        'This email verification link has expired. Please request a new verification link.',
        400
      );
    }

    // Transition account status to PENDING_SUPER_ADMIN_APPROVAL and invalidate token
    await pool.query(
      `UPDATE users
       SET email_verified = TRUE,
           email_verified_at = NOW(),
           account_status = 'PENDING_SUPER_ADMIN_APPROVAL',
           email_verification_token_hash = NULL,
           email_verification_expires_at = NULL
       WHERE id = $1`,
      [user.id]
    );

    // Audit logs
    await logAction({
      userId: user.id,
      action: 'email_verified',
      ip: req.ip,
      details: { email: user.email },
    });

    await logAction({
      userId: user.id,
      action: 'registration_approval_pending',
      ip: req.ip,
      details: { email: user.email, role: user.role, department: user.department_code },
    });

    // Notify Super Admins in real-time
    realtimeService.broadcastEvent(
      'REGISTRATION_PENDING_APPROVAL',
      {
        message: `New user registration (${user.name}) is awaiting Super Admin approval.`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department_name: user.department_name,
          department_code: user.department_code,
          verified_at: new Date().toISOString(),
        },
      },
      (u) => u.role === 'super_admin'
    );

    res.json({
      success: true,
      message: 'Email verified successfully. Your registration is now awaiting Super Admin approval.',
      account_status: 'PENDING_SUPER_ADMIN_APPROVAL',
    });
  } catch (err) { next(err); }
}

// ── POST /api/auth/resend-verification ───────────────────
export async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      throw new AppError('Please provide a valid institutional email address.', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Standard generic response for email enumeration protection
    const genericResponse = {
      success: true,
      message: 'If an account exists with this email address and is pending verification, a new verification link has been sent.',
    };

    const { rows } = await pool.query(
      'SELECT id, name, email, account_status, email_verified FROM users WHERE email = $1',
      [normalizedEmail]
    );

    const user = rows[0];
    if (!user || user.account_status !== 'PENDING_EMAIL_VERIFICATION' || user.email_verified) {
      return res.json(genericResponse);
    }

    // Generate new token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresInHours = 24;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    await pool.query(
      `UPDATE users
       SET email_verification_token_hash = $1,
           email_verification_expires_at = $2
       WHERE id = $3`,
      [tokenHash, expiresAt, user.id]
    );

    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const verifyUrl = `${frontendBase}/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    const emailResult = await sendVerificationEmail({
      toEmail: user.email,
      userName: user.name,
      verifyUrl,
      expiresInHours,
    });

    await logAction({
      userId: user.id,
      action: 'verification_email_resent',
      ip: req.ip,
      details: { email: user.email },
    });

    res.json({
      ...genericResponse,
      emailPreviewUrl: emailResult?.previewUrl || null,
      verifyUrl: process.env.NODE_ENV === 'development' ? verifyUrl : undefined,
    });
  } catch (err) { next(err); }
}

// ── GET /api/auth/me ─────────────────────────────────────
export async function getMe(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.created_at,
              u.account_status, u.email_verified,
              d.department_name, d.department_code
       FROM users u LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    res.json({ success: true, user: rows[0] });
  } catch (err) { next(err); }
}

// ── POST /api/auth/forgot-password ───────────────────────
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      throw new AppError('Please provide a valid institutional email address.', 400);
    }

    await ensureResetTable();

    const normalizedEmail = email.trim().toLowerCase();
    const { rows } = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1 AND is_active = true',
      [normalizedEmail]
    );

    const user = rows[0];

    // Generic safe message to prevent email enumeration
    const genericResponse = {
      success: true,
      message: 'If an account exists with this email address, a password reset link has been sent.',
    };

    if (!user) {
      return res.json(genericResponse);
    }

    // Generate cryptographically secure random reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresInMinutes = 15;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Invalidate any previously unused reset tokens for this user
    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false',
      [user.id]
    );

    // Store token hash in database
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used)
       VALUES ($1, $2, $3, false)`,
      [user.id, tokenHash, expiresAt]
    );

    // Construct reset URL
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${frontendBase}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    const emailResult = await sendPasswordResetEmail({
      toEmail: user.email,
      userName: user.name,
      resetUrl,
      expiresInMinutes,
    });

    await logAction({
      userId: user.id,
      action: 'password_reset_requested',
      ip: req.ip,
      details: { email: user.email },
    });

    res.json({
      ...genericResponse,
      emailPreviewUrl: emailResult?.previewUrl || null,
      resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
    });
  } catch (err) { next(err); }
}

// ── POST /api/auth/reset-password ────────────────────────
export async function resetPassword(req, res, next) {
  try {
    const { token, email, newPassword } = req.body;

    if (!token || !email || !newPassword) {
      throw new AppError('Token, email, and new password are required.', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters long.', 400);
    }
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      throw new AppError('Password must include uppercase, lowercase, and numeric characters.', 400);
    }

    await ensureResetTable();

    const normalizedEmail = email.trim().toLowerCase();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { rows } = await pool.query(
      `SELECT prt.id AS token_id, prt.expires_at, prt.used, u.id AS user_id, u.email
       FROM password_reset_tokens prt
       JOIN users u ON prt.user_id = u.id
       WHERE prt.token_hash = $1
         AND u.email = $2
         AND prt.used = false
         AND prt.expires_at > NOW()`,
      [tokenHash, normalizedEmail]
    );

    const record = rows[0];
    if (!record) {
      throw new AppError(
        'The password reset link is invalid, has expired, or has already been used. Please request a new link.',
        400
      );
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, record.user_id]);
      await client.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [record.token_id]);
      await client.query('COMMIT');
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }

    await logAction({
      userId: record.user_id,
      action: 'password_reset_completed',
      ip: req.ip,
      details: { email: record.email },
    });

    res.json({
      success: true,
      message: 'Your institutional password has been securely updated. You may now sign in.',
    });
  } catch (err) { next(err); }
}

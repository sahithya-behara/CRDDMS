// controllers/users.controller.js
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/errorHandler.js';
import { logAction } from '../services/audit.service.js';
import {
  sendAccountApprovedEmail,
  sendAccountRejectedEmail,
} from '../services/email.service.js';
import realtimeService from '../services/realtime.service.js';

// GET /api/users
export async function listUsers(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
              u.account_status, u.email_verified, u.email_verified_at,
              u.approved_by, u.approved_at, u.rejection_reason,
              d.department_name, d.department_code
       FROM users u LEFT JOIN departments d ON u.department_id = d.id
       ORDER BY u.created_at DESC`
    );
    res.json({ success: true, users: rows });
  } catch (err) { next(err); }
}

// GET /api/users/:id
export async function getUser(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
              u.account_status, u.email_verified, u.email_verified_at,
              u.approved_by, u.approved_at, u.rejection_reason,
              d.department_name, d.department_code
       FROM users u LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`, [req.params.id]
    );
    if (!rows[0]) throw new AppError('User not found.', 404);
    res.json({ success: true, user: rows[0] });
  } catch (err) { next(err); }
}

// GET /api/users/pending-registrations (Super Admin only)
export async function getPendingRegistrations(req, res, next) {
  try {
    if (req.user.role !== 'super_admin') {
      throw new AppError('Access denied. Super Admin authorization required.', 403);
    }

    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.account_status,
              u.email_verified, u.email_verified_at, u.created_at,
              d.department_name, d.department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.account_status = 'PENDING_SUPER_ADMIN_APPROVAL'
       ORDER BY u.email_verified_at ASC`
    );

    res.json({
      success: true,
      count: rows.length,
      registrations: rows,
    });
  } catch (err) { next(err); }
}

// POST /api/users/:id/approve-registration (Super Admin only)
export async function approveRegistration(req, res, next) {
  try {
    if (req.user.role !== 'super_admin') {
      throw new AppError('Access denied. Super Admin authorization required.', 403);
    }

    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) throw new AppError('Invalid user ID.', 400);

    const { rows: existingRows } = await pool.query(
      `SELECT u.*, d.department_code, d.department_name FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [userId]
    );
    const user = existingRows[0];
    if (!user) throw new AppError('User registration not found.', 404);

    if (!user.email_verified) {
      throw new AppError('Cannot approve account: email ownership has not yet been verified by the user.', 400);
    }

    // Activate account
    const { rows } = await pool.query(
      `UPDATE users
       SET account_status = 'ACTIVE',
           is_active = TRUE,
           approved_by = $1,
           approved_at = NOW(),
           rejection_reason = NULL
       WHERE id = $2
       RETURNING id, name, email, role, department_id, account_status, is_active, approved_at`,
      [req.user.id, userId]
    );

    const updatedUser = rows[0];

    // Dispatch approval confirmation email
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    await sendAccountApprovedEmail({
      toEmail: user.email,
      userName: user.name,
      loginUrl: `${frontendBase}/login`,
    });

    await logAction({
      userId: user.id,
      action: 'user_approved',
      ip: req.ip,
      details: { email: user.email, approvedBy: req.user.email },
    });

    // Notify connected clients of user activation
    realtimeService.broadcastEvent('REGISTRATION_STATUS_CHANGED', {
      action: 'approved',
      userId: user.id,
      user: updatedUser,
      approvedBy: req.user.email,
    });
    realtimeService.broadcastEvent('USER_UPDATED', { user: updatedUser });

    res.json({
      success: true,
      message: `Account for ${user.name} (${user.email}) has been approved and activated.`,
      user: updatedUser,
    });
  } catch (err) { next(err); }
}

// POST /api/users/:id/reject-registration (Super Admin only)
export async function rejectRegistration(req, res, next) {
  try {
    if (req.user.role !== 'super_admin') {
      throw new AppError('Access denied. Super Admin authorization required.', 403);
    }

    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) throw new AppError('Invalid user ID.', 400);

    const { reason } = req.body;

    const { rows: existingRows } = await pool.query(
      'SELECT id, name, email, role, account_status FROM users WHERE id = $1',
      [userId]
    );
    const user = existingRows[0];
    if (!user) throw new AppError('User registration not found.', 404);

    const cleanReason = (reason || 'Registration criteria not met.').trim();

    // Mark as REJECTED
    const { rows } = await pool.query(
      `UPDATE users
       SET account_status = 'REJECTED',
           is_active = FALSE,
           rejection_reason = $1
       WHERE id = $2
       RETURNING id, name, email, role, account_status, is_active, rejection_reason`,
      [cleanReason, userId]
    );

    const rejectedUser = rows[0];

    // Dispatch polite rejection email
    await sendAccountRejectedEmail({
      toEmail: user.email,
      userName: user.name,
      reason: cleanReason,
    });

    await logAction({
      userId: user.id,
      action: 'user_rejected',
      ip: req.ip,
      details: { email: user.email, rejectedBy: req.user.email, reason: cleanReason },
    });

    realtimeService.broadcastEvent('REGISTRATION_STATUS_CHANGED', {
      action: 'rejected',
      userId: user.id,
      rejectedBy: req.user.email,
      reason: cleanReason,
    });

    res.json({
      success: true,
      message: `Registration for ${user.email} has been rejected.`,
      user: rejectedUser,
    });
  } catch (err) { next(err); }
}

// PUT /api/users/:id
export async function updateUser(req, res, next) {
  try {
    const { name, role, department_id, is_active, account_status, password } = req.body;
    let hash = undefined;
    if (password) hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `UPDATE users SET
         name           = COALESCE($1, name),
         role           = COALESCE($2, role),
         department_id  = COALESCE($3, department_id),
         is_active      = COALESCE($4, is_active),
         account_status = COALESCE($5, account_status),
         password_hash  = COALESCE($6, password_hash)
       WHERE id = $7 RETURNING id, name, email, role, is_active, account_status`,
      [name, role, department_id, is_active, account_status, hash, req.params.id]
    );
    if (!rows[0]) throw new AppError('User not found.', 404);
    res.json({ success: true, user: rows[0] });
  } catch (err) { next(err); }
}

// DELETE /api/users/:id
export async function deleteUser(req, res, next) {
  try {
    if (+req.params.id === req.user.id) throw new AppError('Cannot delete your own account.', 400);
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) { next(err); }
}

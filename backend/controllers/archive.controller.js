// controllers/archive.controller.js
import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

// GET /api/archive
export async function listArchives(req, res, next) {
  try {
    const user = req.user;
    const isScoped = user && (user.role === 'dept_head' || user.role === 'faculty' || user.role === 'staff');
    const params = isScoped ? [user.department_id] : [];

    const { rows } = await pool.query(
      `SELECT ar.*, ud.title, ud.file_name, ud.file_type, ud.department_id, d.department_name, u.name AS archived_by_name
       FROM archive_records ar
       JOIN uploaded_documents ud ON ar.document_id = ud.id
       LEFT JOIN departments d    ON ud.department_id = d.id
       LEFT JOIN users u          ON ar.archived_by   = u.id
       ${isScoped ? 'WHERE ud.department_id = $1' : ''}
       ORDER BY ar.archive_date DESC`,
      params
    );
    res.json({ success: true, archives: rows });
  } catch (err) { next(err); }
}

// POST /api/archive
export async function archiveDocument(req, res, next) {
  try {
    const { document_id, archive_reason } = req.body;
    if (!document_id) throw new AppError('document_id is required.', 400);

    // Set document status to archived
    await pool.query('UPDATE uploaded_documents SET status=$1, updated_at=NOW() WHERE id=$2',
      ['archived', document_id]);

    const { rows } = await pool.query(
      `INSERT INTO archive_records (document_id, archive_reason, archived_by)
       VALUES ($1,$2,$3) RETURNING *`,
      [document_id, archive_reason, req.user.id]
    );
    res.status(201).json({ success: true, archive: rows[0] });
  } catch (err) { next(err); }
}

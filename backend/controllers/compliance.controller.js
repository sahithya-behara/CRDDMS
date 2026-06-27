// controllers/compliance.controller.js
import pool from '../config/db.js';
import { AppError } from '../middleware/errorHandler.js';

// GET /api/compliance
export async function listCompliance(req, res, next) {
  try {
    const { authority } = req.query;
    const user = req.user;
    const isScoped = user && (user.role === 'dept_head' || user.role === 'faculty' || user.role === 'staff');

    const params = [];
    const filters = [];

    if (authority) {
      params.push(authority);
      filters.push(`ar.authority = $${params.length}`);
    }
    if (isScoped) {
      params.push(user.department_id);
      filters.push(`ud.department_id = $${params.length}`);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT ar.*, ud.title, ud.file_name, ud.file_path, ud.file_type, ud.file_size, ud.status, ud.academic_year, ud.department_id, d.department_name
       FROM accreditation_records ar
       JOIN uploaded_documents ud ON ar.document_id = ud.id
       LEFT JOIN departments d    ON ud.department_id = d.id
       ${where}
       ORDER BY ar.created_at DESC`,
      params
    );
    res.json({ success: true, records: rows });
  } catch (err) { next(err); }
}

// POST /api/compliance
export async function createCompliance(req, res, next) {
  try {
    const { document_id, authority, criteria_code, remarks } = req.body;
    if (!document_id || !authority) throw new AppError('document_id and authority are required.', 400);

    const { rows } = await pool.query(
      `INSERT INTO accreditation_records (document_id, authority, criteria_code, remarks)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [document_id, authority, criteria_code, remarks]
    );
    res.status(201).json({ success: true, record: rows[0] });
  } catch (err) { next(err); }
}

// DELETE /api/compliance/:id
export async function deleteCompliance(req, res, next) {
  try {
    await pool.query('DELETE FROM accreditation_records WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Compliance record removed.' });
  } catch (err) { next(err); }
}

// controllers/departments.controller.js
import pool from '../config/db.js';

export async function listDepartments(req, res, next) {
  try {
    const user = req.user;
    let query = `
      SELECT d.*, COUNT(ud.id) AS document_count,
             COALESCE(SUM(ud.file_size), 0) AS total_size_bytes
      FROM departments d
      LEFT JOIN uploaded_documents ud ON ud.department_id = d.id
    `;
    const params = [];
    if (user && (user.role === 'dept_head' || user.role === 'faculty' || user.role === 'staff')) {
      query += ` WHERE d.id = $1`;
      params.push(user.department_id);
    }
    query += ` GROUP BY d.id ORDER BY d.department_name`;

    const { rows } = await pool.query(query, params);
    res.json({ success: true, departments: rows });
  } catch (err) { next(err); }
}

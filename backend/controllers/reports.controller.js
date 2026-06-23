// controllers/reports.controller.js
// All analytics queries for the dashboard charts.

import pool from '../config/db.js';

export async function getReports(req, res, next) {
  try {
    const user = req.user;
    const isScoped = user && (user.role === 'dept_head' || user.role === 'faculty' || user.role === 'staff');
    const params = isScoped ? [user.department_id] : [];

    const [
      byDept, byCategory, ocrStats, storage, monthlyTrend, statusDist
    ] = await Promise.all([
      // Documents by department
      pool.query(
        `SELECT d.department_code, d.department_name, COUNT(ud.id)::int AS count
         FROM departments d
         LEFT JOIN uploaded_documents ud ON ud.department_id = d.id
         ${isScoped ? 'WHERE d.id = $1' : ''}
         GROUP BY d.id ORDER BY count DESC`,
        params
      ),
      // Documents by category
      pool.query(
        `SELECT category, COUNT(*)::int AS count
         FROM uploaded_documents
         ${isScoped ? 'WHERE department_id = $1' : ''}
         GROUP BY category`,
        params
      ),
      // OCR stats
      pool.query(
        isScoped
          ? `SELECT COUNT(*)::int AS total,
                    COUNT(CASE WHEN o.confidence_score > 70 THEN 1 END)::int AS success
             FROM ocr_extracted_text o
             INNER JOIN uploaded_documents ud ON o.document_id = ud.id
             WHERE ud.department_id = $1`
          : `SELECT COUNT(*)::int AS total,
                    COUNT(CASE WHEN confidence_score > 70 THEN 1 END)::int AS success
             FROM ocr_extracted_text`,
        params
      ),
      // Storage by department
      pool.query(
        `SELECT d.department_name, COALESCE(SUM(ud.file_size),0)::bigint AS bytes
         FROM departments d
         LEFT JOIN uploaded_documents ud ON ud.department_id = d.id
         ${isScoped ? 'WHERE d.id = $1' : ''}
         GROUP BY d.id ORDER BY bytes DESC LIMIT 8`,
        params
      ),
      // Monthly upload trend (last 6 months)
      pool.query(
        `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
                COUNT(*)::int AS count
         FROM uploaded_documents
         WHERE created_at > NOW() - INTERVAL '6 months'
               ${isScoped ? 'AND department_id = $1' : ''}
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY DATE_TRUNC('month', created_at)`,
        params
      ),
      // Status distribution
      pool.query(
        `SELECT status, COUNT(*)::int AS count
         FROM uploaded_documents
         ${isScoped ? 'WHERE department_id = $1' : ''}
         GROUP BY status`,
        params
      ),
    ]);

    res.json({
      success: true,
      byDepartment:  byDept.rows,
      byCategory:    byCategory.rows,
      ocr:           ocrStats.rows[0],
      storage:       storage.rows,
      monthlyTrend:  monthlyTrend.rows,
      statusDist:    statusDist.rows,
    });
  } catch (err) { next(err); }
}

export async function getDashboardStats(req, res, next) {
  try {
    const user = req.user;
    const isScoped = user && (user.role === 'dept_head' || user.role === 'faculty' || user.role === 'staff');
    const params = isScoped ? [user.department_id] : [];

    const [totalDocs, totalUsers, pendingDocs, totalSize] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM uploaded_documents
         ${isScoped ? 'WHERE department_id = $1' : ''}`,
        params
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM users
         WHERE is_active=true
               ${isScoped ? 'AND department_id = $1' : ''}`,
        params
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM uploaded_documents
         WHERE status='pending'
               ${isScoped ? 'AND department_id = $1' : ''}`,
        params
      ),
      pool.query(
        `SELECT COALESCE(SUM(file_size),0)::bigint AS bytes
         FROM uploaded_documents
         ${isScoped ? 'WHERE department_id = $1' : ''}`,
        params
      ),
    ]);

    res.json({
      success: true,
      totalDocuments: totalDocs.rows[0].count,
      activeUsers:    totalUsers.rows[0].count,
      pendingApproval: pendingDocs.rows[0].count,
      storageUsedBytes: totalSize.rows[0].bytes,
    });
  } catch (err) { next(err); }
}

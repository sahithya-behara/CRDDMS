// controllers/documents.controller.js
// CRUD for uploaded_documents table.

import pool from '../config/db.js';
import path from 'path';
import { logAction } from '../services/audit.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { extractText } from '../services/ocr.service.js';
import { realtimeService } from '../services/realtime.service.js';
import fs from 'fs';

// ── GET /api/documents ──────────────────────────────────
export async function listDocuments(req, res, next) {
  try {
    const { page = 1, limit = 15, department_id, category, status, academic_year } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const filters = [];

    // Department heads/faculty see only their department's docs
    const user = req.user;
    if (user.role === 'dept_head' || user.role === 'faculty' || user.role === 'staff') {
      params.push(user.department_id);
      filters.push(`ud.department_id = $${params.length}`);
    } else if (department_id) {
      params.push(department_id);
      filters.push(`ud.department_id = $${params.length}`);
    }

    if (category) { params.push(category); filters.push(`ud.category = $${params.length}`); }
    if (status)   { params.push(status);   filters.push(`ud.status = $${params.length}`);   }
    if (academic_year) { params.push(academic_year); filters.push(`ud.academic_year = $${params.length}`); }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const countRes = await pool.query(`SELECT COUNT(*) FROM uploaded_documents ud ${where}`, params);
    const total    = parseInt(countRes.rows[0].count);

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT ud.*, u.name AS uploader_name, d.department_code, d.department_name
       FROM uploaded_documents ud
       LEFT JOIN users u       ON ud.uploaded_by   = u.id
       LEFT JOIN departments d ON ud.department_id = d.id
       ${where}
       ORDER BY ud.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ success: true, documents: rows, total, page: +page, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

// ── GET /api/documents/:id ──────────────────────────────
export async function getDocument(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT ud.*, u.name AS uploader_name, d.department_code, d.department_name,
              o.extracted_text, o.confidence_score
       FROM uploaded_documents ud
       LEFT JOIN users u               ON ud.uploaded_by   = u.id
       LEFT JOIN departments d         ON ud.department_id = d.id
       LEFT JOIN ocr_extracted_text o  ON o.document_id    = ud.id
       WHERE ud.id = $1`,
      [req.params.id]
    );

    if (!rows[0]) throw new AppError('Document not found.', 404);

    await logAction({ userId: req.user.id, action: 'view', documentId: +req.params.id, ip: req.ip });
    res.json({ success: true, document: rows[0] });
  } catch (err) { next(err); }
}

// ── POST /api/documents/upload ─────────────────────────
export async function uploadDocument(req, res, next) {
  try {
    if (!req.file) throw new AppError('No file provided.', 400);

    const { title, department_id, academic_year, category, tags } = req.body;
    if (!title || !department_id || !category) {
      throw new AppError('Title, department, and category are required.', 400);
    }

    let filePath = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');

    const tagsArr  = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [];

    const { rows } = await pool.query(
      `INSERT INTO uploaded_documents
         (title, file_name, file_path, file_type, file_size, department_id, academic_year, category, uploaded_by, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        title,
        req.file.originalname,
        filePath,
        path.extname(req.file.originalname).replace('.', ''),
        req.file.size,
        department_id,
        academic_year,
        category,
        req.user.id,
        tagsArr,
      ]
    );

    await logAction({ userId: req.user.id, action: 'upload', documentId: rows[0].id, ip: req.ip,
                      details: { file: req.file.originalname } });

    // Automatically trigger OCR for images asynchronously
    const ext = path.extname(req.file.originalname).replace('.', '').toLowerCase();
    const imageTypes = ['jpg', 'jpeg', 'png'];
    if (imageTypes.includes(ext)) {
      const ocrSourcePath = filePath.startsWith('http') ? filePath : path.resolve(process.cwd(), filePath);
      const docId = rows[0].id;
      extractText(ocrSourcePath, ext)
        .then(async (ocrResult) => {
          try {
            await pool.query(
              `INSERT INTO ocr_extracted_text (document_id, extracted_text, confidence_score)
               VALUES ($1, $2, $3)
               ON CONFLICT (document_id) DO UPDATE
               SET extracted_text = EXCLUDED.extracted_text,
                   confidence_score = EXCLUDED.confidence_score,
                   processed_at = NOW()`,
              [docId, ocrResult.text, ocrResult.confidence]
            );
            console.log(`🤖 Auto-OCR completed for document ID: ${docId}`);
          } catch (dbErr) {
            console.error(`❌ Failed to save auto-OCR text for document ID: ${docId}:`, dbErr.message);
          }
        })
        .catch((ocrErr) => {
          console.error(`❌ Failed to process auto-OCR for document ID: ${docId}:`, ocrErr.message);
        });
    }

    // Broadcast Real-Time Document Creation to authorized users
    realtimeService.broadcastEvent('DOCUMENT_CREATED', {
      id: rows[0].id,
      title: rows[0].title,
      file_name: rows[0].file_name,
      category: rows[0].category,
      status: rows[0].status,
      department_id: rows[0].department_id,
      uploader_name: req.user.name,
      message: `New document uploaded: "${rows[0].title}"`,
    });

    res.status(201).json({ success: true, document: rows[0] });
  } catch (err) { next(err); }
}

// ── PUT /api/documents/:id ──────────────────────────────
export async function updateDocument(req, res, next) {
  try {
    const { title, status, category, academic_year, tags, is_authorized } = req.body;
    const { rows } = await pool.query(
      `UPDATE uploaded_documents
       SET title = COALESCE($1, title),
           status = COALESCE($2, status),
           category = COALESCE($3, category),
           academic_year = COALESCE($4, academic_year),
           tags = COALESCE($5, tags),
           is_authorized = COALESCE($6, is_authorized),
           updated_at = NOW()
       WHERE id = $7 RETURNING *`,
      [title, status, category, academic_year, tags, is_authorized !== undefined ? is_authorized : null, req.params.id]
    );
    if (!rows[0]) throw new AppError('Document not found.', 404);

    await logAction({ userId: req.user.id, action: 'update', documentId: +req.params.id, ip: req.ip,
                      details: { new_status: status, is_authorized: rows[0].is_authorized } });

    // Broadcast Real-Time Document Status Update
    realtimeService.broadcastEvent('DOCUMENT_STATUS_CHANGED', {
      id: rows[0].id,
      title: rows[0].title,
      status: rows[0].status,
      category: rows[0].category,
      department_id: rows[0].department_id,
      is_authorized: rows[0].is_authorized,
      updated_by: req.user.name,
      message: `Document "${rows[0].title}" status updated to ${rows[0].status?.toUpperCase()}`,
    });

    res.json({ success: true, document: rows[0] });
  } catch (err) { next(err); }
}

// ── DELETE /api/documents/:id ───────────────────────────
export async function deleteDocument(req, res, next) {
  try {
    const { rows } = await pool.query('DELETE FROM uploaded_documents WHERE id=$1 RETURNING id, department_id, title', [req.params.id]);
    if (!rows[0]) throw new AppError('Document not found.', 404);

    await logAction({ userId: req.user.id, action: 'delete', documentId: +req.params.id, ip: req.ip });

    // Broadcast Real-Time Document Deletion
    realtimeService.broadcastEvent('DOCUMENT_DELETED', {
      id: rows[0].id,
      department_id: rows[0].department_id,
      deleted_by: req.user.name,
      message: `Document REC-${rows[0].id} was deleted.`,
    });

    res.json({ success: true, message: 'Document deleted.' });
  } catch (err) { next(err); }
}

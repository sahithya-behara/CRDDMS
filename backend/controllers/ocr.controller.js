// controllers/ocr.controller.js
import pool from '../config/db.js';
import path from 'path';
import { extractText } from '../services/ocr.service.js';
import { AppError } from '../middleware/errorHandler.js';

// POST /api/ocr/process/:documentId
export async function processOCR(req, res, next) {
  try {
    const { documentId } = req.params;

    const docRes = await pool.query('SELECT * FROM uploaded_documents WHERE id = $1', [documentId]);
    const doc    = docRes.rows[0];
    if (!doc) throw new AppError('Document not found.', 404);

    const absPath = doc.file_path.startsWith('http') ? doc.file_path : path.resolve(process.cwd(), doc.file_path);
    const { text, confidence } = await extractText(absPath, doc.file_type);

    // Upsert OCR result
    const { rows } = await pool.query(
      `INSERT INTO ocr_extracted_text (document_id, extracted_text, confidence_score)
       VALUES ($1, $2, $3)
       ON CONFLICT (document_id) DO UPDATE
         SET extracted_text = EXCLUDED.extracted_text,
             confidence_score = EXCLUDED.confidence_score,
             processed_at = NOW()
       RETURNING *`,
      [documentId, text, confidence]
    );

    res.json({ success: true, ocr: rows[0] });
  } catch (err) { next(err); }
}

// GET /api/ocr/:documentId
export async function getOCR(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, ud.title, ud.file_name FROM ocr_extracted_text o
       JOIN uploaded_documents ud ON o.document_id = ud.id
       WHERE o.document_id = $1`,
      [req.params.documentId]
    );
    if (!rows[0]) throw new AppError('OCR result not found. Please process the document first.', 404);
    res.json({ success: true, ocr: rows[0] });
  } catch (err) { next(err); }
}

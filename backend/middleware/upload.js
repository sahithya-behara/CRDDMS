// middleware/upload.js — Multer file upload config
// Validates file type and size before it reaches any controller.

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_TYPES = {
  'application/pdf':                                                        'pdf',
  'image/jpeg':                                                             'jpg',
  'image/png':                                                              'png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':      'xlsx',
  'application/msword':                                                     'doc',
};

// Store files in organized subfolders: uploads/<dept_code>/<academic_year>/
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dept = req.body.department_code || 'general';
    const year = req.body.academic_year   || 'misc';
    const baseUploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
    const dir  = path.join(baseUploadDir, dept.toLowerCase(), year);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext      = path.extname(file.originalname);
    const safeName = `${uuidv4()}${ext}`;
    cb(null, safeName);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type "${file.mimetype}" is not allowed.`), false);
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '26214400') }, // 25 MB
});

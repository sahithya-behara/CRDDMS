// services/ocr.service.js — Runs Tesseract OCR on uploaded files
// Supports PDF (first page via image) and image files directly.

import Tesseract from 'tesseract.js';
import path from 'path';
import fs from 'fs';

/**
 * Run OCR on a file and return { text, confidence }
 * @param {string} filePath  — absolute path to the file
 * @param {string} fileType  — 'pdf'|'jpg'|'png'
 */
export async function extractText(filePath, fileType) {
  // Tesseract works directly on images; for PDF we'd need pdf2pic
  // For now: process image files directly, return a message for non-images
  const imageTypes = ['jpg', 'jpeg', 'png'];
  const isUrl = filePath.startsWith('http');
  
  let ext;
  try {
    if (isUrl) {
      const pathname = new URL(filePath).pathname;
      ext = path.extname(pathname).replace('.', '').toLowerCase();
    } else {
      ext = path.extname(filePath).replace('.', '').toLowerCase();
    }
  } catch (err) {
    ext = fileType || '';
  }

  if (!imageTypes.includes(ext)) {
    return {
      text: `[OCR not available for ${ext.toUpperCase()} files. Convert to image to enable OCR.]`,
      confidence: 0,
    };
  }

  if (!isUrl && !fs.existsSync(filePath)) {
    return { text: '[File not found on disk]', confidence: 0 };
  }

  const result = await Tesseract.recognize(filePath, 'eng', {
    logger: () => {},   // suppress progress logs
  });

  return {
    text:       result.data.text.trim(),
    confidence: parseFloat(result.data.confidence.toFixed(2)),
  };
}

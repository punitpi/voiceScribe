import express from 'express';
import {
  generatePDFFromDocument,
  getPDFsByDocument,
  downloadPDF,
  deletePDFById,
} from '../controllers/pdfController';

const router = express.Router();

/**
 * POST /api/pdfs/document/:documentId/generate
 * Generate PDF from document
 */
router.post('/document/:documentId/generate', generatePDFFromDocument);

/**
 * GET /api/pdfs/document/:documentId
 * Get all PDFs for a document
 */
router.get('/document/:documentId', getPDFsByDocument);

/**
 * GET /api/pdfs/:id/download
 * Download a PDF file
 */
router.get('/:id/download', downloadPDF);

/**
 * DELETE /api/pdfs/:id
 * Delete a PDF
 */
router.delete('/:id', deletePDFById);

export default router;

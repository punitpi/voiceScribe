import express from 'express';
import {
  generatePDFFromDocument,
  getPDFsByDocument,
  downloadPDF,
  deletePDFById,
} from '../controllers/pdfController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.post('/document/:documentId/generate', requireAuth, generatePDFFromDocument);
router.get('/document/:documentId', requireAuth, getPDFsByDocument);
router.get('/:id/download', requireAuth, downloadPDF);
router.delete('/:id', requireAuth, deletePDFById);

export default router;

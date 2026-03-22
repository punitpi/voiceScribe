import express from 'express';
import {
  generatePDFFromDocument,
  getPDFsByDocument,
  downloadPDF,
  deletePDFById,
} from '../controllers/pdfController';
import { requireAuth } from '../middleware/auth';
import { requireFeatureFlag } from '../middleware/featureFlag';

const router = express.Router();
const pdfFlag = requireFeatureFlag('pdf_export');

router.post('/document/:documentId/generate', requireAuth, pdfFlag, generatePDFFromDocument);
router.get('/document/:documentId', requireAuth, getPDFsByDocument);
router.get('/:id/download', requireAuth, downloadPDF);
router.delete('/:id', requireAuth, deletePDFById);

export default router;

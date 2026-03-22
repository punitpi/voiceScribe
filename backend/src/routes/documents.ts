import express from 'express';
import {
  getDocument,
  updateDocument,
  combineTranscriptions,
  appendNewTranscriptions,
  getDocumentHistory
} from '../controllers/documentController';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.get('/project/:projectId', requireAuth, getDocument);
router.put('/project/:projectId', requireAuth, updateDocument);
router.post('/project/:projectId/combine', requireAuth, combineTranscriptions);
router.post('/project/:projectId/append', requireAuth, appendNewTranscriptions);
router.get('/project/:projectId/history', requireAuth, getDocumentHistory);

export default router;

import express from 'express';
import {
  getDocument,
  updateDocument,
  combineTranscriptions,
  appendNewTranscriptions,
  getDocumentHistory
} from '../controllers/documentController';

const router = express.Router();

/**
 * GET /api/documents/project/:projectId
 * Get the latest document for a project
 */
router.get('/project/:projectId', getDocument);

/**
 * PUT /api/documents/project/:projectId
 * Update document content (creates a new version)
 */
router.put('/project/:projectId', updateDocument);

/**
 * POST /api/documents/project/:projectId/combine
 * Combine all transcriptions into the document (replaces existing content)
 */
router.post('/project/:projectId/combine', combineTranscriptions);

/**
 * POST /api/documents/project/:projectId/append
 * Append only new transcriptions to the document (preserves existing content)
 */
router.post('/project/:projectId/append', appendNewTranscriptions);

/**
 * GET /api/documents/project/:projectId/history
 * Get document version history
 */
router.get('/project/:projectId/history', getDocumentHistory);

export default router;

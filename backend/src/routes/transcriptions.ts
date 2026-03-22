import { Router } from 'express';
import {
  startTranscription,
  getTranscription,
  updateTranscriptionText,
  reformatTranscription
} from '../controllers/transcriptionController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/recording/:recordingId/start', requireAuth, startTranscription);
router.get('/recording/:recordingId', requireAuth, getTranscription);
router.put('/:id', requireAuth, updateTranscriptionText);
router.post('/:id/reformat', requireAuth, reformatTranscription);

export default router;

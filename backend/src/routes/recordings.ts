import { Router } from 'express';
import { uploadAudio, handleUploadError } from '../middleware/upload';
import {
  uploadRecording,
  getRecordingsByProject,
  getRecording,
  deleteRecording,
  downloadRecording
} from '../controllers/recordingController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/upload', requireAuth, uploadAudio.single('audio'), handleUploadError, uploadRecording);
router.get('/project/:projectId', requireAuth, getRecordingsByProject);
router.get('/:id', requireAuth, getRecording);
router.get('/:id/download', requireAuth, downloadRecording);
router.delete('/:id', requireAuth, deleteRecording);

export default router;

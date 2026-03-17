import { Router } from 'express';
import {
  startTranscription,
  getTranscription,
  updateTranscriptionText,
  reformatTranscription
} from '../controllers/transcriptionController';

const router = Router();

/**
 * @route   POST /api/transcriptions/recording/:recordingId/start
 * @desc    Start transcription for a recording
 * @access  Public
 */
router.post('/recording/:recordingId/start', startTranscription);

/**
 * @route   GET /api/transcriptions/recording/:recordingId
 * @desc    Get transcription for a recording
 * @access  Public
 */
router.get('/recording/:recordingId', getTranscription);

/**
 * @route   PUT /api/transcriptions/:id
 * @desc    Update transcription text
 * @access  Public
 */
router.put('/:id', updateTranscriptionText);

/**
 * @route   POST /api/transcriptions/:id/reformat
 * @desc    Reformat transcription text (apply auto-formatting)
 * @access  Public
 */
router.post('/:id/reformat', reformatTranscription);

export default router;

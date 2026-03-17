import { Router } from 'express';
import { uploadAudio, handleUploadError } from '../middleware/upload';
import {
  uploadRecording,
  getRecordingsByProject,
  getRecording,
  deleteRecording,
  downloadRecording
} from '../controllers/recordingController';

const router = Router();

/**
 * @route   POST /api/recordings/upload
 * @desc    Upload a new audio recording
 * @access  Public (will add auth later)
 */
router.post('/upload', uploadAudio.single('audio'), handleUploadError, uploadRecording);

/**
 * @route   GET /api/recordings/project/:projectId
 * @desc    Get all recordings for a project
 * @access  Public
 */
router.get('/project/:projectId', getRecordingsByProject);

/**
 * @route   GET /api/recordings/:id
 * @desc    Get a single recording by ID
 * @access  Public
 */
router.get('/:id', getRecording);

/**
 * @route   GET /api/recordings/:id/download
 * @desc    Download audio file
 * @access  Public
 */
router.get('/:id/download', downloadRecording);

/**
 * @route   DELETE /api/recordings/:id
 * @desc    Delete a recording
 * @access  Public
 */
router.delete('/:id', deleteRecording);

export default router;

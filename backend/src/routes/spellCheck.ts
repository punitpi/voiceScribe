import { Router } from 'express';
import {
  checkSpelling,
  autoCorrect,
  getStats,
  addWord,
  removeWord,
  getDictionary
} from '../controllers/spellCheckController';

const router = Router();

/**
 * @route   POST /api/spellcheck
 * @desc    Check text for spelling errors
 * @access  Public
 */
router.post('/', checkSpelling);

/**
 * @route   POST /api/spellcheck/correct
 * @desc    Auto-correct text
 * @access  Public
 */
router.post('/correct', autoCorrect);

/**
 * @route   POST /api/spellcheck/stats
 * @desc    Get word statistics
 * @access  Public
 */
router.post('/stats', getStats);

/**
 * @route   POST /api/spellcheck/dictionary/add
 * @desc    Add word to custom dictionary
 * @access  Public
 */
router.post('/dictionary/add', addWord);

/**
 * @route   DELETE /api/spellcheck/dictionary/remove
 * @desc    Remove word from custom dictionary
 * @access  Public
 */
router.delete('/dictionary/remove', removeWord);

/**
 * @route   GET /api/spellcheck/dictionary
 * @desc    Get custom dictionary words
 * @access  Public
 */
router.get('/dictionary', getDictionary);

export default router;

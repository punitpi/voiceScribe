import { Router } from 'express';
import {
  checkSpelling,
  autoCorrect,
  getStats,
  addWord,
  removeWord,
  getDictionary
} from '../controllers/spellCheckController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, checkSpelling);
router.post('/correct', requireAuth, autoCorrect);
router.post('/stats', requireAuth, getStats);
router.post('/dictionary/add', requireAuth, addWord);
router.delete('/dictionary/remove', requireAuth, removeWord);
router.get('/dictionary', requireAuth, getDictionary);

export default router;

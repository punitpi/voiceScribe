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
import { requireFeatureFlag } from '../middleware/featureFlag';

const router = Router();

const spellCheckFlag = requireFeatureFlag('spell_check');

router.post('/', requireAuth, spellCheckFlag, checkSpelling);
router.post('/correct', requireAuth, spellCheckFlag, autoCorrect);
router.post('/stats', requireAuth, spellCheckFlag, getStats);
router.post('/dictionary/add', requireAuth, spellCheckFlag, addWord);
router.delete('/dictionary/remove', requireAuth, spellCheckFlag, removeWord);
router.get('/dictionary', requireAuth, spellCheckFlag, getDictionary);

export default router;

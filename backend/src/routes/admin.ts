import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import {
  getUsers,
  approveUser,
  rejectUser,
  updateUserRole,
  getFeatureFlags,
  setGlobalFlag,
  setUserFlag,
} from '../controllers/adminController';

const router = Router();

router.get('/users', requireAdmin, getUsers);
router.patch('/users/:id/approve', requireAdmin, approveUser);
router.patch('/users/:id/reject', requireAdmin, rejectUser);
router.patch('/users/:id/role', requireAdmin, updateUserRole);
router.get('/feature-flags', requireAdmin, getFeatureFlags);
router.patch('/feature-flags/:name', requireAdmin, setGlobalFlag);
router.patch('/users/:userId/feature-flags/:flagName', requireAdmin, setUserFlag);

export default router;

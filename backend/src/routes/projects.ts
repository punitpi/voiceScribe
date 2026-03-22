import { Router } from 'express';
import {
  createProject,
  getAllProjects,
  getProject,
  updateProject,
  archiveProject,
  deleteProject,
  getProjectStats
} from '../controllers/projectController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, createProject);
router.get('/', requireAuth, getAllProjects);
router.get('/:id', requireAuth, getProject);
router.get('/:id/stats', requireAuth, getProjectStats);
router.put('/:id', requireAuth, updateProject);
router.patch('/:id/archive', requireAuth, archiveProject);
router.delete('/:id', requireAuth, deleteProject);

export default router;

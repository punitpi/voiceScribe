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

const router = Router();

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Public
 */
router.post('/', createProject);

/**
 * @route   GET /api/projects
 * @desc    Get all projects
 * @access  Public
 */
router.get('/', getAllProjects);

/**
 * @route   GET /api/projects/:id
 * @desc    Get a single project by ID
 * @access  Public
 */
router.get('/:id', getProject);

/**
 * @route   GET /api/projects/:id/stats
 * @desc    Get project statistics
 * @access  Public
 */
router.get('/:id/stats', getProjectStats);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update a project
 * @access  Public
 */
router.put('/:id', updateProject);

/**
 * @route   PATCH /api/projects/:id/archive
 * @desc    Archive or unarchive a project
 * @access  Public
 */
router.patch('/:id/archive', archiveProject);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project permanently
 * @access  Public
 */
router.delete('/:id', deleteProject);

export default router;

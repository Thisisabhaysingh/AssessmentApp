import { Router } from 'express';
import { authenticate, permit } from '../middleware/authMiddleware.js';
import { 
  createUser,
  updateUser,
  deleteUser,
  createCourse,
  updateCourse,
  deleteCourse,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  assignCourse, 
  overview,
  getAllUsers,
  getAllCourses,
  getAllTrainers,
  getAllManagers,
  getAllSchoolOpsManagers,
  getAllAssessments,
  getSettings,
  updateSettings
} from '../controllers/adminController.js';

const router = Router();

// User routes (admin-only for write, admin/manager for read)
router.get('/users', authenticate, permit('admin', 'manager'), getAllUsers);
router.post('/users', authenticate, permit('admin'), createUser);
router.put('/users/:id', authenticate, permit('admin'), updateUser);
router.delete('/users/:id', authenticate, permit('admin'), deleteUser);

// Course routes
router.post('/courses', authenticate, permit('admin'), createCourse);
router.get('/courses', authenticate, permit('admin', 'manager', 'trainer'), getAllCourses);
router.put('/courses/:id', authenticate, permit('admin'), updateCourse);
router.delete('/courses/:id', authenticate, permit('admin'), deleteCourse);

// Assessment routes
router.post('/assessments', authenticate, permit('admin'), createAssessment);
router.get('/assessments', authenticate, permit('admin', 'manager', 'trainer'), getAllAssessments);
router.put('/assessments/:id', authenticate, permit('admin', 'manager'), updateAssessment);
router.delete('/assessments/:id', authenticate, permit('admin'), deleteAssessment);

// Other routes
router.get('/trainers', authenticate, permit('admin', 'manager'), getAllTrainers);
router.get('/managers', authenticate, permit('admin', 'manager'), getAllManagers);
router.get('/school-ops-managers', authenticate, permit('admin', 'manager'), getAllSchoolOpsManagers);
router.post('/assign-course', authenticate, permit('admin'), assignCourse);
router.get('/overview', authenticate, permit('admin'), overview);
router.get('/settings', authenticate, permit('admin'), getSettings);
router.put('/settings', authenticate, permit('admin'), updateSettings);

export default router;

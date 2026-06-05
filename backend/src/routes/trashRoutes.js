import { Router } from 'express';
import { authenticate, permit } from '../middleware/authMiddleware.js';
import {
  getTrashItems,
  restoreItem,
  permanentDelete,
  emptyTrash
} from '../controllers/trashController.js';

const router = Router();

// Get all trash items
router.get('/', authenticate, permit('admin'), getTrashItems);

// Restore item from trash
router.post('/restore/:type/:id', authenticate, permit('admin'), restoreItem);

// Permanently delete item
router.delete('/:type/:id', authenticate, permit('admin'), permanentDelete);

// Empty trash
router.delete('/empty', authenticate, permit('admin'), emptyTrash);

export default router;

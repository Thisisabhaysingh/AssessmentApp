import { Router } from 'express';
import { authenticate, permit } from '../middleware/authMiddleware.js';
import { User } from '../config/db.js';

const router = Router();

// Public routes for users (read-only for managers)
router.get('/', authenticate, permit('admin', 'manager'), async (req, res) => {
  try {
    console.log(`🔍 Fetching users for manager/admin...`);
    const { search } = req.query;

    let whereClause = {};
    if (search) {
      whereClause = {
        [User.sequelize.Op.or]: [
          { name: { [User.sequelize.Op.iLike]: `%${search}%` } },
          { email: { [User.sequelize.Op.iLike]: `%${search}%` } }
        ]
      };
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC']]
    });
    console.log(`✅ Found ${users.length} users`);
    res.json({ users });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

router.get('/:id', authenticate, permit('admin', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Fetching user ${id}...`);
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log(`✅ Found user: ${user.name}`);
    res.json({ user });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// Admin-only routes (create, update, delete)
router.use('/', authenticate, permit('admin'));

export default router;

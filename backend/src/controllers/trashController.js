import { ok, bad, notFound } from '../utils/responseHelper.js';
import { User, Course, Assessment, sequelize } from '../config/db.js';
import { Sequelize } from 'sequelize';

const { Op } = Sequelize;

// Get all deleted items from trash
export const getTrashItems = async (req, res) => {
  try {
    const [deletedUsers, deletedCourses, deletedAssessments] = await Promise.all([
      User.findAll({
        where: { deletedAt: { [Op.ne]: null } },
        attributes: ['id', 'name', 'email', 'role', 'deletedAt', 'createdAt', 'updatedAt'],
        order: [['deletedAt', 'DESC']]
      }),
      Course.findAll({
        where: { deletedAt: { [Op.ne]: null } },
        attributes: ['id', 'name', 'code', 'level', 'deletedAt', 'createdAt', 'updatedAt'],
        order: [['deletedAt', 'DESC']]
      }),
      Assessment.findAll({
        where: { deletedAt: { [Op.ne]: null } },
        include: [
          { model: User, as: 'trainer', attributes: ['id', 'name'] },
          { model: Course, as: 'course', attributes: ['id', 'name'] }
        ],
        order: [['deletedAt', 'DESC']]
      })
    ]);

    const trashItems = [
      ...deletedUsers.map(user => ({
        id: user.id,
        type: 'user',
        name: user.name,
        email: user.email,
        role: user.role,
        deletedAt: user.deletedAt,
        createdAt: user.createdAt,
        details: `${user.role} - ${user.email}`
      })),
      ...deletedCourses.map(course => ({
        id: course.id,
        type: 'course',
        name: course.name,
        code: course.code,
        level: course.level,
        deletedAt: course.deletedAt,
        createdAt: course.createdAt,
        details: `Level ${course.level}${course.code ? ` - ${course.code}` : ''}`
      })),
      ...deletedAssessments.map(assessment => ({
        id: assessment.id,
        type: 'assessment',
        name: assessment.course?.name || 'Unknown Course',
        trainer: assessment.trainer?.name || 'Unknown Trainer',
        status: assessment.status,
        deletedAt: assessment.deletedAt,
        createdAt: assessment.createdAt,
        details: `Trainer: ${assessment.trainer?.name || 'Unknown'} - Status: ${assessment.status}`
      }))
    ];

    // Sort by deletedAt descending
    trashItems.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    return ok(res, {
      items: trashItems,
      total: trashItems.length,
      byType: {
        users: deletedUsers.length,
        courses: deletedCourses.length,
        assessments: deletedAssessments.length
      }
    }, 'Trash items retrieved successfully');
  } catch (error) {
    console.error('Error getting trash items:', error);
    return bad(res, error.message, 500);
  }
};

// Restore item from trash
export const restoreItem = async (req, res) => {
  try {
    const { type, id } = req.params;

    let item;
    let Model;

    switch (type) {
      case 'user':
        Model = User;
        break;
      case 'course':
        Model = Course;
        break;
      case 'assessment':
        Model = Assessment;
        break;
      default:
        return bad(res, 'Invalid item type. Must be user, course, or assessment', 400);
    }

    // Find the item
    item = await Model.findOne({
      where: {
        id: parseInt(id),
        deletedAt: { [Op.ne]: null }
      }
    });

    if (!item) {
      return notFound(res, `${type} not found in trash`);
    }

    // Restore by setting deletedAt to null
    await item.update({ deletedAt: null });

    console.log(` Restored ${type} with ID ${id} from trash`);

    return ok(res, { item }, `${type} restored successfully`);
  } catch (error) {
    console.error('Error restoring item:', error);
    return bad(res, error.message, 500);
  }
};

// Permanently delete item from trash
export const permanentDelete = async (req, res) => {
  try {
    const { type, id } = req.params;

    let Model;

    switch (type) {
      case 'user':
        Model = User;
        break;
      case 'course':
        Model = Course;
        break;
      case 'assessment':
        Model = Assessment;
        break;
      default:
        return bad(res, 'Invalid item type. Must be user, course, or assessment', 400);
    }

    // Find the item
    const item = await Model.findOne({
      where: {
        id: parseInt(id),
        deletedAt: { [sequelize.Op.ne]: null }
      }
    });

    if (!item) {
      return notFound(res, `${type} not found in trash`);
    }

    // Permanently delete
    await item.destroy();

    console.log(` Permanently deleted ${type} with ID ${id} from trash`);

    return ok(res, null, `${type} permanently deleted`);
  } catch (error) {
    console.error('Error permanently deleting item:', error);
    return bad(res, error.message, 500);
  }
};

// Empty trash (delete all items permanently)
export const emptyTrash = async (req, res) => {
  try {
    const [deletedUsers, deletedCourses, deletedAssessments] = await Promise.all([
      User.findAll({ where: { deletedAt: { [sequelize.Op.ne]: null } } }),
      Course.findAll({ where: { deletedAt: { [sequelize.Op.ne]: null } } }),
      Assessment.findAll({ where: { deletedAt: { [sequelize.Op.ne]: null } } })
    ]);

    // Delete all items permanently
    await Promise.all([
      ...deletedUsers.map(user => user.destroy()),
      ...deletedCourses.map(course => course.destroy()),
      ...deletedAssessments.map(assessment => assessment.destroy())
    ]);

    const totalDeleted = deletedUsers.length + deletedCourses.length + deletedAssessments.length;

    console.log(` Emptied trash - ${totalDeleted} items permanently deleted`);

    return ok(res, {
      deleted: {
        users: deletedUsers.length,
        courses: deletedCourses.length,
        assessments: deletedAssessments.length,
        total: totalDeleted
      }
    }, 'Trash emptied successfully');
  } catch (error) {
    console.error('Error emptying trash:', error);
    return bad(res, error.message, 500);
  }
};

import { ok, created, bad, notFound } from '../utils/responseHelper.js';
import { Activity, Course } from '../config/db.js';

// Get all activities for a course
export const getActivitiesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const activities = await Activity.findAll({
      where: { courseId },
      include: [{ model: Course, as: 'course', attributes: ['id', 'name'] }],
      order: [['order', 'ASC']]
    });
    
    return ok(res, { activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return bad(res, 'Failed to fetch activities', 500);
  }
};

// Get single activity
export const getActivity = async (req, res) => {
  try {
    const { id } = req.params;
    
    const activity = await Activity.findByPk(id, {
      include: [{ model: Course, as: 'course', attributes: ['id', 'name'] }]
    });
    
    if (!activity) {
      return notFound(res, 'Activity not found');
    }
    
    return ok(res, { activity });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return bad(res, 'Failed to fetch activity', 500);
  }
};

// Create new activity
export const createActivity = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, type, duration, order, isRequired, content, resources, passingScore, maxAttempts } = req.body;
    
    // Validate course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return notFound(res, 'Course not found');
    }
    
    const activity = await Activity.create({
      courseId,
      title,
      description,
      type,
      duration,
      order: order || 1,
      isRequired: isRequired !== undefined ? isRequired : true,
      content: content ? JSON.stringify(content) : null,
      resources: resources ? JSON.stringify(resources) : null,
      passingScore: passingScore || 70,
      maxAttempts: maxAttempts || 3
    });
    
    return created(res, { activity }, 'Activity created successfully');
  } catch (error) {
    console.error('Error creating activity:', error);
    return bad(res, 'Failed to create activity', 500);
  }
};

// Update activity
export const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, duration, order, isRequired, content, resources, passingScore, maxAttempts } = req.body;
    
    const activity = await Activity.findByPk(id);
    if (!activity) {
      return notFound(res, 'Activity not found');
    }
    
    await activity.update({
      title,
      description,
      type,
      duration,
      order,
      isRequired,
      content: content ? JSON.stringify(content) : activity.content,
      resources: resources ? JSON.stringify(resources) : activity.resources,
      passingScore,
      maxAttempts
    });
    
    return ok(res, { activity }, 'Activity updated successfully');
  } catch (error) {
    console.error('Error updating activity:', error);
    return bad(res, 'Failed to update activity', 500);
  }
};

// Delete activity
export const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    
    const activity = await Activity.findByPk(id);
    if (!activity) {
      return notFound(res, 'Activity not found');
    }
    
    await activity.destroy();
    
    return ok(res, {}, 'Activity deleted successfully');
  } catch (error) {
    console.error('Error deleting activity:', error);
    return bad(res, 'Failed to delete activity', 500);
  }
};

// Reorder activities
export const reorderActivities = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { activities } = req.body; // Array of {id, order}
    
    // Validate course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return notFound(res, 'Course not found');
    }
    
    // Update order for each activity
    for (const activityData of activities) {
      await Activity.update(
        { order: activityData.order },
        { where: { id: activityData.id, courseId } }
      );
    }
    
    return ok(res, {}, 'Activities reordered successfully');
  } catch (error) {
    console.error('Error reordering activities:', error);
    return bad(res, 'Failed to reorder activities', 500);
  }
};

// Duplicate activity
export const duplicateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    
    const originalActivity = await Activity.findByPk(id);
    if (!originalActivity) {
      return notFound(res, 'Activity not found');
    }
    
    const newActivity = await Activity.create({
      courseId: originalActivity.courseId,
      title: `${originalActivity.title} (Copy)`,
      description: originalActivity.description,
      type: originalActivity.type,
      duration: originalActivity.duration,
      order: originalActivity.order + 1,
      isRequired: originalActivity.isRequired,
      content: originalActivity.content,
      resources: originalActivity.resources,
      passingScore: originalActivity.passingScore,
      maxAttempts: originalActivity.maxAttempts
    });
    
    return created(res, { activity: newActivity }, 'Activity duplicated successfully');
  } catch (error) {
    console.error('Error duplicating activity:', error);
    return bad(res, 'Failed to duplicate activity', 500);
  }
};

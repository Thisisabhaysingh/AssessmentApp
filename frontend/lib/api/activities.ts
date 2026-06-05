import { api } from '../api';

export const activitiesApi = {
  // Get activities for a course
  getCourseActivities: async (courseId: string) => {
    return api.get(`/activities/course/${courseId}`);
  },

  // Get single activity
  getActivity: async (id: string) => {
    return api.get(`/activities/${id}`);
  },

  // Create activity
  createActivity: async (courseId: string, activityData: any) => {
    return api.post(`/activities/course/${courseId}`, activityData);
  },

  // Update activity
  updateActivity: async (id: string, activityData: any) => {
    return api.put(`/activities/${id}`, activityData);
  },

  // Delete activity
  deleteActivity: async (id: string) => {
    return api.delete(`/activities/${id}`);
  },

  // Duplicate activity
  duplicateActivity: async (id: string) => {
    return api.post(`/activities/${id}/duplicate`);
  },

  // Reorder activities
  reorderActivities: async (courseId: string, activities: any[]) => {
    return api.put(`/activities/course/${courseId}/reorder`, { activities });
  }
};

import { api } from '../api';
import type { Course } from '@/types/index';

export const courseApi = {
  // Get all courses
  getCourses: async (params?: Record<string, any>): Promise<Course[]> => {
    let url = '/admin/courses';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }
    const response: any = await api.get(url);
    return response.courses || [];
  },

  // Get course by ID
  getCourse: async (id: number): Promise<Course> => {
    const response: any = await api.get(`/admin/courses/${id}`);
    return response.course;
  },

  // Create course
  createCourse: async (data: Partial<Course>): Promise<Course> => {
    const response: any = await api.post('/admin/courses', data);
    return response.course;
  },

  // Update course
  updateCourse: async (id: number, data: Partial<Course>): Promise<Course> => {
    const response: any = await api.put(`/admin/courses/${id}`, data);
    return response.course;
  },

  // Delete course
  deleteCourse: async (id: number): Promise<void> => {
    await api.delete(`/admin/courses/${id}`);
  },
};

export default courseApi;

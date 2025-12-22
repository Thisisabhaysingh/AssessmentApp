import { api } from '../api';
import type { User } from '@/types/index';

export const userApi = {
  // Get all users
  getUsers: async (params?: Record<string, any>): Promise<User[]> => {
    let url = '/admin/users';
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
    return response.data.users || [];
  },

  // Get user by ID
  getUser: async (id: number): Promise<User> => {
    const response: any = await api.get(`/admin/users/${id}`);
    return response.data.user;
  },

  // Create user
  createUser: async (data: Partial<User>): Promise<User> => {
    const response: any = await api.post('/admin/users', data);
    return response.data.user;
  },

  // Update user
  updateUser: async (id: number, data: Partial<User>): Promise<User> => {
    const response: any = await api.put(`/admin/users/${id}`, data);
    return response.data.user;
  },

  // Delete user
  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  // Search users
  searchUsers: async (query: string): Promise<User[]> => {
    const response: any = await api.get(`/admin/users?search=${encodeURIComponent(query)}`);
    return response.data.users || [];
  },

  // Get trainers
  getTrainers: async (): Promise<User[]> => {
    const response: any = await api.get('/admin/trainers');
    return response.data.trainers || [];
  },

  // Get managers
  getManagers: async (): Promise<User[]> => {
    const response: any = await api.get('/admin/managers');
    return response.data.managers || [];
  },
};

export default userApi;

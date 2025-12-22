export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export const api = {
  // HTTP methods
  get: <T = any>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'GET' }),
  post: <T = any>(path: string, data?: any, options?: RequestInit) => request<T>(path, { ...options, method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: <T = any>(path: string, data?: any, options?: RequestInit) => request<T>(path, { ...options, method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  delete: <T = any>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: 'DELETE' }),
  
  // Auth methods
  login: (email: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  trainer: {
    assessments: () => request('/trainer/assessments'),
    history: () => request('/trainer/history'),
    performance: () => request('/trainer/performance'),
    updateAssessmentStatus: (id: number, data: { clear_status: 'Pass' | 'Fail', score?: number }) =>
      request(`/trainer/assessments/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  manager: {
    trainers: () => request('/manager/trainers'),
    getAssessments: () => request('/manager/assessments'), // Get manager's assigned assessments
    submitFeedback: (payload: any) => request('/manager/feedback', { method: 'POST', body: JSON.stringify(payload) }),
    reports: () => request('/manager/reports'),
  },
  admin: {
    overview: () => request('/admin/overview'),
    getUsers: () => request('/admin/users'),
    createUser: (payload: any) => request('/admin/users', { method: 'POST', body: JSON.stringify(payload) }),
    updateUser: (id: number, payload: any) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteUser: (id: number) => request(`/admin/users/${id}`, { method: 'DELETE' }),
    getCourses: () => request('/admin/courses'),
    createCourse: (payload: any) => request('/admin/courses', { method: 'POST', body: JSON.stringify(payload) }),
    updateCourse: (id: number, payload: any) => request(`/admin/courses/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteCourse: (id: number) => request(`/admin/courses/${id}`, { method: 'DELETE' }),
    getTrainers: () => request('/admin/trainers'),
    getManagers: () => request('/admin/managers'),
    getAssessments: () => request('/admin/assessments'),
    createAssessment: (payload: any) => request('/admin/assessments', { method: 'POST', body: JSON.stringify(payload) }),
    updateAssessment: (id: number, payload: any) => request(`/admin/assessments/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteAssessment: (id: number) => request(`/admin/assessments/${id}`, { method: 'DELETE' }),
    getSettings: () => request('/admin/settings'),
    updateSettings: (payload: any) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  },
  // Password reset
  forgotPassword: (email: string) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOTP: (email: string, otp: string) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  resetPassword: (email: string, otp: string, newPassword: string) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) }),
  changePassword: (currentPassword: string, newPassword: string) => request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
}

export type Role = 'trainer' | 'manager' | 'admin'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  department?: string
  designation?: string
  employeeId?: string
}

export interface Course {
  id: number
  name: string
  code?: string
  description?: string
  level?: 'L1' | 'L2' | 'L3'
  createdAt?: string
  updatedAt?: string
}

export interface AssessmentRow {
  id: number
  course: string
  date: string
  status: 'Scheduled' | 'Completed'
  score?: number
  clear_status?: 'Cleared' | 'Redo'
}

'use client'
import { useState, useEffect } from 'react'
import StatCard from '@/components/StatCard'
import Modal from '@/components/Modal'
import Toast from '@/components/Toast'
import { BookOpen, Users, Clock, Plus, Edit, Trash2, Search } from 'lucide-react'
import { api } from '@/lib/api'

export default function CourseManagement() {
  const [courses, setCourses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<any>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 'L1'
  })
  
  // Filter courses based on search and level
  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchQuery === '' ||
      course.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter
    
    return matchesSearch && matchesLevel
  })

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const result: any = await api.admin.getCourses()
      setCourses(result.data.courses)
    } catch (error) {
      console.error('Failed to load courses:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCourse) {
        await api.admin.updateCourse(editingCourse.id, formData)
        setToast({ message: 'Course updated successfully!', type: 'success' })
      } else {
        await api.admin.createCourse(formData)
        setToast({ message: 'Course created successfully!', type: 'success' })
      }
      setShowModal(false)
      setEditingCourse(null)
      setFormData({ name: '', description: '', level: 'L1' })
      loadCourses()
    } catch (error: any) {
      setToast({ message: error.message || `Failed to ${editingCourse ? 'update' : 'create'} course`, type: 'error' })
    }
  }

  const handleEdit = (course: any) => {
    setEditingCourse(course)
    setFormData({
      name: course.name || '',
      description: course.description || '',
      level: course.level || 'L1'
    })
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!courseToDelete) return
    try {
      await api.admin.deleteCourse(courseToDelete.id)
      setToast({ message: 'Course deleted successfully!', type: 'success' })
      setShowDeleteConfirm(false)
      setCourseToDelete(null)
      loadCourses()
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to delete course', type: 'error' })
    }
  }

  const openDeleteConfirm = (course: any) => {
    setCourseToDelete(course)
    setShowDeleteConfirm(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCourse(null)
    setFormData({ name: '', description: '', level: 'L1' })
  }
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Course Management</h1>
          <p className="text-slate-500 text-sm">Manage assessment courses and content</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-900"
          >
            <option value="all">All Levels</option>
            <option value="L1">Level 1</option>
            <option value="L2">Level 2</option>
            <option value="L3">Level 3</option>
          </select>
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2 text-sm hover:bg-red-600"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Courses" value={courses.length} icon={BookOpen} color="text-blue-600" />
        <StatCard title="Active Courses" value={courses.length} icon={BookOpen} color="text-green-600" />
        <StatCard title="Total Enrollments" value={0} icon={Users} color="text-purple-600" />
        <StatCard title="Avg Duration" value="-" icon={Clock} color="text-orange-600" />
      </div>

      {/* Courses Table */}
      <div className="container-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">All Courses</h2>
          <p className="text-sm text-slate-600">Showing {filteredCourses.length} of {courses.length} courses</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200">
              <tr className="text-left">
                <th className="pb-3 font-medium text-slate-600">Course Name</th>
                <th className="pb-3 font-medium text-slate-600">Description</th>
                <th className="pb-3 font-medium text-slate-600">Level</th>
                <th className="pb-3 font-medium text-slate-600">Enrollments</th>
                <th className="pb-3 font-medium text-slate-600">Status</th>
                <th className="pb-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No courses found matching your search
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                <tr key={course.id} className="border-b border-slate-100">
                  <td className="py-3">📘 {course.name}</td>
                  <td className="py-3">{course.description || '-'}</td>
                  <td className="py-3">
                    {course.level === 'L1' && <span className="badge-green">L1</span>}
                    {course.level === 'L2' && <span className="badge-yellow">L2</span>}
                    {course.level === 'L3' && <span className="badge-red">L3</span>}
                  </td>
                  <td className="py-3">-</td>
                  <td className="py-3">
                    <span className="badge-green">active</span>
                  </td>
                  <td className="py-3 space-x-2">
                    <button 
                      onClick={() => handleEdit(course)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                      title="Edit course"
                    >
                      <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                    <button 
                      onClick={() => openDeleteConfirm(course)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete course"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Course Modal - Enhanced Dark Mode */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={editingCourse ? 'Edit Course' : 'Add New Course'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Course Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter course name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Enter course description"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Level</label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="L1">L1 - Beginner</option>
              <option value="L2">L2 - Intermediate</option>
              <option value="L3">L3 - Advanced</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
          >
            {editingCourse ? 'Update Course' : 'Create Course'}
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showDeleteConfirm} 
        onClose={() => {
          setShowDeleteConfirm(false)
          setCourseToDelete(null)
        }} 
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            Are you sure you want to delete <strong>{courseToDelete?.name}</strong>?
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowDeleteConfirm(false)
                setCourseToDelete(null)
              }}
              className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

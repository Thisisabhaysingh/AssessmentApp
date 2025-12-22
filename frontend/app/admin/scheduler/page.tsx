'use client'
import { useState, useEffect } from 'react'
import { Filter, Plus, Search, Edit, X } from 'lucide-react'
import Modal from '@/components/Modal'
import Toast from '@/components/Toast'
import { api } from '@/lib/api'

export default function AdminScheduler() {
  // State for assessments and form data
  const [assessments, setAssessments] = useState<any[]>([])
  const [trainers, setTrainers] = useState<any[]>([])
  const [managers, setManagers] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<any>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [assessmentToCancel, setAssessmentToCancel] = useState<any>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [formData, setFormData] = useState({
    course_id: '',
    trainer_id: '',
    manager_id: '',
    scheduled_date: ''
  })
  
  // Filter assessments based on search and status
  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = searchQuery === '' ||
      assessment.course?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.trainer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.manager?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Fetch all required data from backend including managers
  const loadData = async () => {
    try {
      const [assessmentsRes, trainersRes, managersRes, coursesRes]: any[] = await Promise.all([
        api.admin.getAssessments(),
        api.admin.getTrainers(),
        api.admin.getManagers(), // Fetch managers
        api.admin.getCourses()
      ])
      setAssessments(assessmentsRes.data.assessments)
      setTrainers(trainersRes.data.trainers)
      setManagers(managersRes.data.managers) // Set managers
      setCourses(coursesRes.data.courses)
    } catch (error) {
      console.error('Failed to load data:', error)
      setToast({ message: 'Failed to load data', type: 'error' })
    }
  }

  // Handle form submission to create/update assessment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form data
    if (!formData.course_id || !formData.trainer_id || !formData.scheduled_date) {
      setToast({ message: 'Please fill all fields', type: 'error' })
      return
    }

    try {
      if (editingAssessment) {
        await api.admin.updateAssessment(editingAssessment.id, formData)
        setToast({ message: 'Assessment updated successfully!', type: 'success' })
      } else {
        await api.admin.createAssessment(formData)
        setToast({ message: 'Assessment scheduled successfully!', type: 'success' })
      }
      setShowModal(false)
      setEditingAssessment(null)
      setFormData({ course_id: '', trainer_id: '', manager_id: '', scheduled_date: '' })
      loadData()
    } catch (error: any) {
      setToast({ message: error.message || `Failed to ${editingAssessment ? 'update' : 'schedule'} assessment`, type: 'error' })
    }
  }

  const handleEdit = (assessment: any) => {
    setEditingAssessment(assessment)
    setFormData({
      course_id: assessment.course_id || '',
      trainer_id: assessment.trainer_id || '',
      manager_id: assessment.manager_id || '',
      scheduled_date: assessment.scheduled_date ? new Date(assessment.scheduled_date).toISOString().slice(0, 16) : ''
    })
    setShowModal(true)
  }

  const handleCancel = async () => {
    if (!assessmentToCancel) return
    try {
      await api.admin.deleteAssessment(assessmentToCancel.id)
      setToast({ message: 'Assessment cancelled successfully!', type: 'success' })
      setShowCancelConfirm(false)
      setAssessmentToCancel(null)
      loadData()
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to cancel assessment', type: 'error' })
    }
  }

  const openCancelConfirm = (assessment: any) => {
    setAssessmentToCancel(assessment)
    setShowCancelConfirm(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAssessment(null)
    setFormData({ course_id: '', trainer_id: '', manager_id: '', scheduled_date: '' })
  }
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Assessment Scheduler</h1>
          <p className="text-slate-500 text-sm">Schedule and manage assessment sessions</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by course, trainer, or manager..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-900"
          >
            <option value="all">All Status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
          </select>
          <button 
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2 text-sm hover:bg-red-600"
          >
            <Plus className="w-4 h-4" />
            New Assessment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar & Slots */}
        <div className="lg:col-span-1 space-y-4">
          <div className="container-card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>📅</span> Select Date
            </h3>
            <div className="text-center mb-4">
              <p className="text-sm text-slate-600">October 2025</p>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="text-slate-500 font-medium">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-sm">
              {[28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 1].map((day, i) => (
                <button
                  key={i}
                  className={`p-2 rounded ${day === 4 ? 'bg-slate-800 text-white' : day < 10 && i > 10 ? 'text-slate-400' : 'hover:bg-slate-100'}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="container-card p-5">
            <h3 className="font-semibold mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Assessments</span>
                <span className="font-semibold text-primary">{assessments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Scheduled</span>
                <span className="font-semibold text-orange-600">{assessments.filter(a => a.status === 'Scheduled').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Completed</span>
                <span className="font-semibold text-green-600">{assessments.filter(a => a.status === 'Completed').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Trainers</span>
                <span className="font-semibold text-blue-600">{trainers.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scheduled Assessments */}
        <div className="lg:col-span-2 container-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Scheduled Assessments</h2>
            <p className="text-sm text-slate-600">Showing {filteredAssessments.length} of {assessments.length} assessments</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr className="text-left">
                  <th className="pb-3 font-medium text-slate-600">Course</th>
                  <th className="pb-3 font-medium text-slate-600">Trainer</th>
                  <th className="pb-3 font-medium text-slate-600">Date & Time</th>
                  <th className="pb-3 font-medium text-slate-600">Status</th>
                  <th className="pb-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No assessments found matching your search
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((assessment) => (
                <tr key={assessment.id} className="border-b border-slate-100">
                  <td className="py-3">📘 {assessment.course?.name || 'N/A'}</td>
                  <td className="py-3">{assessment.trainer?.name || 'N/A'}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span>📅 {new Date(assessment.scheduled_date).toLocaleDateString()}</span>
                      <span>🕐 {new Date(assessment.scheduled_date).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    {assessment.status === 'Scheduled' && <span className="badge-yellow">Scheduled</span>}
                    {assessment.status === 'Completed' && <span className="badge-green">Completed</span>}
                  </td>
                  <td className="py-3 space-x-2">
                    <button 
                      onClick={() => handleEdit(assessment)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                      title="Edit assessment"
                    >
                      <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </button>
                    <button 
                      onClick={() => openCancelConfirm(assessment)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Cancel assessment"
                    >
                      <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </td>
                </tr>
              ))
              )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New/Edit Assessment Modal - Enhanced Dark Mode */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={editingAssessment ? 'Edit Assessment' : 'Schedule New Assessment'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Select Course *</label>
            <select
              value={formData.course_id}
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Choose a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.level})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Select Trainer *</label>
            <select
              value={formData.trainer_id}
              onChange={(e) => setFormData({ ...formData, trainer_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Choose a trainer</option>
              {trainers.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name} - {trainer.department || 'N/A'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Select Manager (Optional)</label>
            <select
              value={formData.manager_id}
              onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">No manager assigned</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name} - {manager.department || 'N/A'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Scheduled Date & Time *</label>
            <input
              type="datetime-local"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
          >
            {editingAssessment ? 'Update Assessment' : 'Schedule Assessment'}
          </button>
        </form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal 
        isOpen={showCancelConfirm} 
        onClose={() => {
          setShowCancelConfirm(false)
          setAssessmentToCancel(null)
        }} 
        title="Confirm Cancellation"
      >
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300">
            Are you sure you want to cancel this assessment?
          </p>
          <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg text-sm">
            <p><strong>Course:</strong> {assessmentToCancel?.course?.name}</p>
            <p><strong>Trainer:</strong> {assessmentToCancel?.trainer?.name}</p>
            <p><strong>Date:</strong> {assessmentToCancel?.scheduled_date && new Date(assessmentToCancel.scheduled_date).toLocaleString()}</p>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This action cannot be undone.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowCancelConfirm(false)
                setAssessmentToCancel(null)
              }}
              className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              No, Keep It
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Yes, Cancel Assessment
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

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Plus, Search, Filter, Clock, CheckCircle, XCircle, Edit, Trash2, Eye, Users, Award } from 'lucide-react'
import { api } from '@/lib/api'

interface Assessment {
  id: number
  course_id: number
  trainer_id: number
  manager_ids: number[]
  scheduled_date: string
  status: string
  course?: {
    id: number
    name: string
    code: string
  }
  trainer?: {
    id: number
    name: string
    email: string
  }
  assigned_managers?: any[]
  createdAt: string
  updatedAt: string
}

interface Trainer {
  id: number
  name: string
  email: string
}

export default function SchoolOpsManagerAssessments() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [managers, setManagers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [formData, setFormData] = useState({
    course_id: '',
    trainer_id: '',
    manager_ids: [] as number[],
    scheduled_date: ''
  })

  
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [assessmentsRes, trainersRes, coursesRes, managersRes] = await Promise.all([
        api.get('/school-ops-manager/assessments'),
        api.get('/school-ops-manager/trainers'),
        api.get('/school-ops-manager/courses'),
        api.get('/school-ops-manager/managers')
      ])
      
      if (assessmentsRes.success && Array.isArray(assessmentsRes.data)) {
        setAssessments(assessmentsRes.data)
      } else {
        setAssessments([])
      }
      if (trainersRes.success && Array.isArray(trainersRes.data)) {
        setTrainers(trainersRes.data)
      } else {
        setTrainers([])
      }
      if (coursesRes.success && Array.isArray(coursesRes.data)) {
        setCourses(coursesRes.data)
      } else {
        setCourses([])
      }
      if (managersRes.success && Array.isArray(managersRes.data)) {
        setManagers(managersRes.data)
      } else {
        setManagers([])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setAssessments([])
      setTrainers([])
      setCourses([])
      setManagers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await api.post('/school-ops-manager/assessments/schedule', {
        course_id: parseInt(formData.course_id),
        trainer_id: parseInt(formData.trainer_id),
        manager_ids: formData.manager_ids,
        scheduled_date: formData.scheduled_date
      })

      if (response.success) {
        setShowScheduleModal(false)
        setSelectedAssessment(null)
        setFormData({
          course_id: '',
          trainer_id: '',
          manager_ids: [],
          scheduled_date: ''
        })
        loadData()
      }
    } catch (error) {
      console.error('Failed to schedule assessment:', error)
    }
  }

  const handleDelete = async (assessmentId: number) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return

    try {
      const response = await api.delete(`/school-ops-manager/assessments/${assessmentId}`)
      if (response.success) {
        loadData()
      }
    } catch (error) {
      console.error('Failed to delete assessment:', error)
    }
  }

  const filteredAssessments = Array.isArray(assessments) ? assessments.filter(assessment => {
    const matchesSearch = (assessment.course && assessment.course.name && assessment.course.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (assessment.trainer && assessment.trainer.name && assessment.trainer.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = !statusFilter || assessment.status === statusFilter
    
    // Date filtering
    let matchesDate = true
    if (dateFilter) {
      const assessmentDate = assessment.scheduled_date ? new Date(assessment.scheduled_date) : null
      const filterDate = new Date(dateFilter)
      if (assessmentDate) {
        // Check if assessment date matches the selected date (same day)
        matchesDate = assessmentDate.toDateString() === filterDate.toDateString()
      } else {
        matchesDate = false
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate
  }) : []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const handleManagerToggle = (managerId: number) => {
    setFormData(prev => ({
      ...prev,
      manager_ids: prev.manager_ids.includes(managerId)
        ? prev.manager_ids.filter(id => id !== managerId)
        : [...prev.manager_ids, managerId]
    }))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-6 w-48"></div>
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Assessment Scheduling
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Schedule and manage trainer assessments
            </p>
          </div>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Schedule Assessment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search assessments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              title="Clear date filter"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Assessments List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Assessment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Trainer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Scheduled Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredAssessments.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {assessment.course?.name || 'Unknown Course'}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {assessment.course?.code}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900 dark:text-white">
                      {assessment.trainer?.name}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {assessment.trainer?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                    {new Date(assessment.scheduled_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assessment.status)}`}>
                      {assessment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/school-ops-manager/assessments/${assessment.id}`)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                                            
                      {assessment.status !== 'completed' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedAssessment(assessment)
                              setFormData({
                                course_id: assessment.course_id.toString(),
                                trainer_id: assessment.trainer_id.toString(),
                                manager_ids: assessment.manager_ids || [],
                                scheduled_date: assessment.scheduled_date
                              })
                              setShowScheduleModal(true)
                            }}
                            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(assessment.id)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredAssessments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No assessments found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Get started by scheduling your first assessment'}
            </p>
            {!searchTerm && !statusFilter && (
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Schedule First Assessment
              </button>
            )}
          </div>
        )}
      </div>

      {/* Schedule/Edit Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {selectedAssessment ? 'Edit Assessment' : 'Schedule New Assessment'}
              </h2>
            </div>

            <form onSubmit={handleSchedule} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select Course *
                  </label>
                  <select
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name} - {course.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select Trainer *
                  </label>
                  <select
                    value={formData.trainer_id}
                    onChange={(e) => setFormData({ ...formData, trainer_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Trainer</option>
                    {trainers.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name} - {trainer.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select Managers
                  </label>
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {managers.map((manager) => (
                      <div
                        key={manager.id}
                        onClick={() => handleManagerToggle(manager.id)}
                        className={`p-2 rounded cursor-pointer flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-600 ${
                          formData.manager_ids.includes(manager.id)
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                            : 'border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.manager_ids.includes(manager.id)}
                          onChange={() => handleManagerToggle(manager.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{manager.name}</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">{manager.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {formData.manager_ids.length > 0 && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {formData.manager_ids.length} manager(s) selected
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, manager_ids: [] }))}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Scheduled Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false)
                    setSelectedAssessment(null)
                    setFormData({
                      course_id: '',
                      trainer_id: '',
                      manager_ids: [],
                      scheduled_date: ''
                    })
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {selectedAssessment ? 'Update' : 'Schedule'} Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

          </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Modal from '@/components/Modal'
import Toast from '@/components/Toast'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  BookOpen, 
  Clock, 
  Video, 
  FileText, 
  HelpCircle, 
  Target,
  Copy,
  ArrowUp,
  ArrowDown,
  GripVertical
} from 'lucide-react'
import { activitiesApi } from '@/lib/api/activities'
import { api } from '@/lib/api'

interface Activity {
  id: number
  title: string
  description: string
  type: 'reading' | 'video' | 'quiz' | 'assignment' | 'practical' | 'project'
  duration: number
  order: number
  isRequired: boolean
  content?: any
  resources?: any
  passingScore?: number
  maxAttempts?: number
}

interface Course {
  id: number
  name: string
  description: string
  level: string
  activities: Activity[]
}

export default function CourseDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<Course | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [draggedActivity, setDraggedActivity] = useState<Activity | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'reading' as Activity['type'],
    duration: 30,
    order: 1,
    isRequired: true,
    content: '',
    resources: '',
    passingScore: 70,
    maxAttempts: 3
  })

  useEffect(() => {
    loadCourseDetails()
    loadActivities()
  }, [courseId])

  const loadCourseDetails = async () => {
    try {
      const result: any = await api.admin.getCourses()
      const courseData = result.data.courses.find((c: Course) => c.id === parseInt(courseId))
      setCourse(courseData)
    } catch (error) {
      console.error('Failed to load course details:', error)
    }
  }

  const loadActivities = async () => {
    try {
      const data = await activitiesApi.getCourseActivities(courseId)
      if (data.success) {
        setActivities(data.data.activities)
      }
    } catch (error: any) {
      console.error('Failed to load activities:', error)
      if (error.message?.includes('Forbidden')) {
        setToast({ message: 'You do not have permission to manage activities. Please ensure you are logged in as an administrator.', type: 'error' })
      } else if (error.message?.includes('Unauthorized')) {
        setToast({ message: 'You are not logged in. Please log in again.', type: 'error' })
        router.push('/login')
      } else {
        setToast({ message: 'Failed to load activities. Please try again.', type: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = editingActivity 
        ? await activitiesApi.updateActivity(editingActivity.id.toString(), formData)
        : await activitiesApi.createActivity(courseId, formData)
      
      if (data.success) {
        setToast({ 
          message: editingActivity ? 'Activity updated successfully!' : 'Activity created successfully!', 
          type: 'success' 
        })
        setShowActivityModal(false)
        setEditingActivity(null)
        setFormData({
          title: '',
          description: '',
          type: 'reading',
          duration: 30,
          order: 1,
          isRequired: true,
          content: '',
          resources: '',
          passingScore: 70,
          maxAttempts: 3
        })
        loadActivities()
      } else {
        setToast({ message: data.error || 'Failed to save activity', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'Failed to save activity', type: 'error' })
      console.error('Error saving activity:', error)
    }
  }

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity)
    setFormData({
      title: activity.title,
      description: activity.description || '',
      type: activity.type,
      duration: activity.duration,
      order: activity.order,
      isRequired: activity.isRequired,
      content: activity.content || '',
      resources: activity.resources || '',
      passingScore: activity.passingScore || 70,
      maxAttempts: activity.maxAttempts || 3
    })
    setShowActivityModal(true)
  }

  const handleDelete = async () => {
    if (!activityToDelete) return

    try {
      const data = await activitiesApi.deleteActivity(activityToDelete.id.toString())
      
      if (data.success) {
        setToast({ message: 'Activity deleted successfully!', type: 'success' })
        loadActivities()
      } else {
        setToast({ message: data.error || 'Failed to delete activity', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'Failed to delete activity', type: 'error' })
      console.error('Error deleting activity:', error)
    }
    
    setShowDeleteConfirm(false)
    setActivityToDelete(null)
  }

  const handleDuplicate = async (activity: Activity) => {
    try {
      const data = await activitiesApi.duplicateActivity(activity.id.toString())
      
      if (data.success) {
        setToast({ message: 'Activity duplicated successfully!', type: 'success' })
        loadActivities()
      } else {
        setToast({ message: data.error || 'Failed to duplicate activity', type: 'error' })
      }
    } catch (error) {
      setToast({ message: 'Failed to duplicate activity', type: 'error' })
      console.error('Error duplicating activity:', error)
    }
  }

  const handleReorder = async (draggedIndex: number, targetIndex: number) => {
    const newActivities = [...activities]
    const [draggedItem] = newActivities.splice(draggedIndex, 1)
    newActivities.splice(targetIndex, 0, draggedItem)
    
    // Update order values
    const reorderedActivities = newActivities.map((activity, index) => ({
      id: activity.id,
      order: index + 1
    }))

    try {
      const data = await activitiesApi.reorderActivities(courseId, reorderedActivities)
      
      if (data.success) {
        setActivities(newActivities)
      } else {
        setToast({ message: data.error || 'Failed to reorder activities', type: 'error' })
        loadActivities() // Reload to restore original order
      }
    } catch (error) {
      setToast({ message: 'Failed to reorder activities', type: 'error' })
      console.error('Error reordering activities:', error)
      loadActivities()
    }
  }

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'reading': return <BookOpen className="w-4 h-4" />
      case 'video': return <Video className="w-4 h-4" />
      case 'quiz': return <HelpCircle className="w-4 h-4" />
      case 'assignment': return <FileText className="w-4 h-4" />
      case 'practical': return <Target className="w-4 h-4" />
      case 'project': return <Target className="w-4 h-4" />
      default: return <BookOpen className="w-4 h-4" />
    }
  }

  const getActivityTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'reading': return 'text-blue-600 bg-blue-50'
      case 'video': return 'text-purple-600 bg-purple-50'
      case 'quiz': return 'text-orange-600 bg-orange-50'
      case 'assignment': return 'text-green-600 bg-green-50'
      case 'practical': return 'text-red-600 bg-red-50'
      case 'project': return 'text-indigo-600 bg-indigo-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Course Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">The course you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.push('/admin/courses')}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-red-600"
          >
            Back to Courses
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Course Header */}
      <div className="mb-6">
        <button 
          onClick={() => router.push('/admin/courses')}
          className="mb-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Courses
        </button>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                📘 {course.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {course.description || 'No description available'}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  course.level === 'L1' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  course.level === 'L2' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {course.level}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {activities.length} Activities
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setShowActivityModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-red-600 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Activity
            </button>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Course Activities</h2>
        </div>
        
        {activities.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <BookOpen className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Activities Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start building your course by adding your first activity.
            </p>
            <button
              onClick={() => setShowActivityModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-red-600"
            >
              Add First Activity
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {activities.map((activity, index) => (
              <div 
                key={activity.id} 
                className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                draggable
                onDragStart={() => setDraggedActivity(activity)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedActivity && draggedActivity.id !== activity.id) {
                    const draggedIndex = activities.findIndex(a => a.id === draggedActivity.id)
                    const targetIndex = activities.findIndex(a => a.id === activity.id)
                    handleReorder(draggedIndex, targetIndex)
                    setDraggedActivity(null)
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                    <div className={`p-2 rounded-lg ${getActivityTypeColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {activity.order}. {activity.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.duration} min
                        </span>
                        <span className="capitalize">
                          {activity.type}
                        </span>
                        {activity.isRequired && (
                          <span className="text-red-600">Required</span>
                        )}
                        {activity.type === 'quiz' && (
                          <span>Score: {activity.passingScore}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDuplicate(activity)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      title="Duplicate activity"
                    >
                      <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleEdit(activity)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      title="Edit activity"
                    >
                      <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => {
                        setActivityToDelete(activity)
                        setShowDeleteConfirm(true)
                      }}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete activity"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Activity Modal */}
      <Modal 
        isOpen={showActivityModal} 
        onClose={() => {
          setShowActivityModal(false)
          setEditingActivity(null)
          setFormData({
            title: '',
            description: '',
            type: 'reading',
            duration: 30,
            order: 1,
            isRequired: true,
            content: '',
            resources: '',
            passingScore: 70,
            maxAttempts: 3
          })
        }}
        title={editingActivity ? 'Edit Activity' : 'Add New Activity'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Activity Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter activity title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Enter activity description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Activity Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Activity['type'] })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="reading">📖 Reading</option>
                <option value="video">📹 Video</option>
                <option value="quiz">📝 Quiz</option>
                <option value="assignment">📄 Assignment</option>
                <option value="practical">🎯 Practical</option>
                <option value="project">🚀 Project</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                min="1"
                required
              />
            </div>
          </div>

          {formData.type === 'quiz' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Passing Score (%)</label>
                <input
                  type="number"
                  value={formData.passingScore}
                  onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-200">Max Attempts</label>
                <input
                  type="number"
                  value={formData.maxAttempts}
                  onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                  min="1"
                />
              </div>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRequired"
              checked={formData.isRequired}
              onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isRequired" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Required Activity
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowActivityModal(false)
                setEditingActivity(null)
                setFormData({
                  title: '',
                  description: '',
                  type: 'reading',
                  duration: 30,
                  order: 1,
                  isRequired: true,
                  content: '',
                  resources: '',
                  passingScore: 70,
                  maxAttempts: 3
                })
              }}
              className="px-4 py-2 text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-red-600"
            >
              {editingActivity ? 'Update Activity' : 'Create Activity'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showDeleteConfirm} 
        onClose={() => {
          setShowDeleteConfirm(false)
          setActivityToDelete(null)
        }}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete the activity "{activityToDelete?.title}"? This action cannot be undone.
          </p>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowDeleteConfirm(false)
                setActivityToDelete(null)
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
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

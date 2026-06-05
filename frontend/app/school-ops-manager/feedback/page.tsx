'use client'
import { useEffect, useState } from 'react'
import { Search, Filter, MessageSquare, Calendar, User, Edit, Eye, Send } from 'lucide-react'
import { api } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'

interface Assessment {
  id: number
  course_id: number
  trainer_id: number
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
  assignedManagers?: Array<{
    id: number
    name: string
    email: string
  }>
  feedbacks?: Array<{
    id: number
    manager_id: number
    feedback_text: string
    recommendations?: string
    score?: number
    pass_fail?: string
    created_at: string
    // Evaluation parameters
    timeBasedActivity?: number
    studentEngagementIdeas?: number
    poisedAndConfident?: number
    wellModulatedVoice?: number
    pleasingLook?: number
    totalScore?: number
    percentage?: number
    manager?: {
      id: number
      name: string
      email: string
    }
  }>
  createdAt: string
  updatedAt: string
}

export default function SchoolOpsManagerFeedback() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    feedback_text: '',
    recommendations: '',
    score: ''
  })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  // School Ops Manager evaluation parameters state
  const [evaluationParams, setEvaluationParams] = useState({
    timeBasedActivity: 0,
    studentEngagementIdeas: 0,
    poisedAndConfident: 0,
    wellModulatedVoice: 0,
    pleasingLook: 0
  })

  useEffect(() => {
    loadCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUserId !== null) {
      loadAssessments()
    }
  }, [currentUserId])

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser()
      setCurrentUserId(user?.id || null)
    } catch (error) {
      console.error('Failed to load current user:', error)
      setCurrentUserId(null)
    }
  }

  const loadAssessments = async () => {
    try {
      const response = await api.get('/school-ops-manager/feedback')
      console.log('📊 Feedback API response:', response)
      
      if (response.success && response.data) {
        console.log('📋 Raw feedback data:', response.data)
        const assessmentMap = new Map<number, Assessment>()
        
        response.data.forEach((item: any) => {
          const assessmentId = item.assessment_id
          
          if (!assessmentMap.has(assessmentId)) {
            assessmentMap.set(assessmentId, {
              ...item.assessment,
              feedbacks: []
            })
          }
          
          const assessment = assessmentMap.get(assessmentId)!
          if (item.id) { // Only add if feedback exists
            assessment.feedbacks!.push({
              id: item.id,
              manager_id: item.manager_id,
              feedback_text: item.feedback_text,
              recommendations: item.recommendations,
              score: item.score,
              pass_fail: item.pass_fail,
              created_at: item.created_at,
              // Add evaluation parameters
              timeBasedActivity: item.timeBasedActivity,
              studentEngagementIdeas: item.studentEngagementIdeas,
              poisedAndConfident: item.poisedAndConfident,
              wellModulatedVoice: item.wellModulatedVoice,
              pleasingLook: item.pleasingLook,
              totalScore: item.totalScore,
              percentage: item.percentage,
              manager: item.manager
            })
          }
        })
        
        setAssessments(Array.from(assessmentMap.values()))
      } else {
        setAssessments([])
      }
    } catch (error) {
      console.error('Failed to load assessments:', error)
      setAssessments([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (assessment: Assessment, existingFeedback?: any) => {
    console.log('🎨 handleEdit called with:', { assessment, existingFeedback })
    setSelectedAssessment(assessment)
    
    if (existingFeedback) {
      console.log('📊 Loading existing feedback data:', existingFeedback)
      
      // Load existing evaluation parameters if available
      const evalParams = {
        timeBasedActivity: existingFeedback.timeBasedActivity || 0,
        studentEngagementIdeas: existingFeedback.studentEngagementIdeas || 0,
        poisedAndConfident: existingFeedback.poisedAndConfident || 0,
        wellModulatedVoice: existingFeedback.wellModulatedVoice || 0,
        pleasingLook: existingFeedback.pleasingLook || 0
      }
      console.log('🔧 Setting evaluation params:', evalParams)
      setEvaluationParams(evalParams)
      
      setEditFormData({
        feedback_text: existingFeedback.feedback_text || '',
        recommendations: existingFeedback.recommendations || '',
        score: existingFeedback.score?.toString() || ''
      })
    } else {
      console.log('📝 No existing feedback, using defaults')
      
      // Reset evaluation parameters
      setEvaluationParams({
        timeBasedActivity: 0,
        studentEngagementIdeas: 0,
        poisedAndConfident: 0,
        wellModulatedVoice: 0,
        pleasingLook: 0
      })
      
      setEditFormData({
        feedback_text: '',
        recommendations: '',
        score: ''
      })
    }
    setShowEditModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssessment) return

    try {
      const totalScore = Object.values(evaluationParams).reduce((sum, val) => sum + val, 0)
      const percentage = Math.round((totalScore / 25) * 100)

      // Check if there's existing feedback from school ops manager specifically
      const existingFeedback = selectedAssessment.feedbacks && selectedAssessment.feedbacks.length > 0 
        ? selectedAssessment.feedbacks.find((feedback: any) => feedback.evaluator_role === 'school_ops_manager' || feedback.manager_id === currentUserId) || null
        : null

      console.log('🔍 Existing feedback check:', { 
        feedbacks: selectedAssessment.feedbacks, 
        existingFeedback, 
        currentUserId,
        evaluatorRole: existingFeedback?.evaluator_role,
        evaluationId: existingFeedback?.evaluation_id,
        hasEvaluationId: !!existingFeedback?.evaluation_id
      })

      // Check if we should update or create based on evaluation_id existence
      if (existingFeedback && existingFeedback.evaluation_id) {
        // Update existing evaluation using evaluation ID
        console.log('📝 Updating evaluation with ID:', existingFeedback.evaluation_id)
        await api.put(`/school-ops-manager/evaluations/${existingFeedback.evaluation_id}`, {
          ...evaluationParams,
          totalScore,
          percentage
        })
      } else if (existingFeedback && (existingFeedback.timeBasedActivity !== undefined || existingFeedback.totalScore > 0)) {
        // Case: Evaluation data exists in feedback but no evaluation_id - try to find the evaluation
        console.log('🔍 Evaluation data exists but no evaluation_id, trying to find evaluation...')
        try {
          // Try to get the evaluation by assessment ID
          const evalResponse = await api.get(`/school-ops-manager/evaluations/${selectedAssessment.id}`)
          if (evalResponse.success && evalResponse.data) {
            console.log('📝 Found evaluation, updating with ID:', evalResponse.data.id)
            await api.put(`/school-ops-manager/evaluations/${evalResponse.data.id}`, {
              ...evaluationParams,
              totalScore,
              percentage
            })
          } else {
            throw new Error('No evaluation found')
          }
        } catch (error) {
          console.log('📝 No evaluation found, creating new one')
          await api.post('/school-ops-manager/evaluations', {
            assessmentId: selectedAssessment.id,
            ...evaluationParams,
            totalScore,
            percentage
          })
        }
      } else {
        // Create new evaluation
        console.log('📝 Creating new evaluation for assessment:', selectedAssessment.id)
        await api.post('/school-ops-manager/evaluations', {
          assessmentId: selectedAssessment.id,
          ...evaluationParams,
          totalScore,
          percentage
        })
      }

      // Submit or update traditional feedback with calculated score
      let response
      if (existingFeedback && existingFeedback.id) {
        // Update existing feedback
        console.log('📝 Updating existing feedback with ID:', existingFeedback.id)
        response = await api.put(`/school-ops-manager/feedback/${existingFeedback.id}`, {
          comments: editFormData.feedback_text,
          recommendations: editFormData.recommendations,
          score: percentage // Use calculated percentage instead of manual score
        })
      } else {
        // Create new feedback
        console.log('📝 Creating new feedback for assessment:', selectedAssessment.id)
        response = await api.post(`/school-ops-manager/assessments/${selectedAssessment.id}/feedback`, {
          comments: editFormData.feedback_text,
          recommendations: editFormData.recommendations,
          score: percentage // Use calculated percentage instead of manual score
        })
      }

      if (response.success) {
        setShowEditModal(false)
        setSelectedAssessment(null)
        setEditFormData({ feedback_text: '', recommendations: '', score: '' })
        
        // Reset evaluation parameters
        setEvaluationParams({
          timeBasedActivity: 0,
          studentEngagementIdeas: 0,
          poisedAndConfident: 0,
          wellModulatedVoice: 0,
          pleasingLook: 0
        })
        
        loadAssessments()
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  const handleViewDetails = (assessment: Assessment) => {
    setSelectedAssessment(assessment)
    setShowDetailsModal(true)
  }

  const filteredAssessments = Array.isArray(assessments) ? assessments.filter(assessment => {
    const matchesSearch = 
      (assessment.course?.name && assessment.course.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (assessment.trainer?.name && assessment.trainer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (assessment.feedbacks?.some((feedback: any) => 
        feedback.feedback_text && feedback.feedback_text.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    
    const matchesStatus = !statusFilter || assessment.status === statusFilter
    
    return matchesSearch && matchesStatus
  }) : []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    if (score >= 80) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-6 w-48"></div>
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
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
              Feedback Management
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              View and manage assessment feedback
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
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
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="scheduled">Scheduled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Assessment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssessments.map((assessment) => (
          <div key={assessment.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            {/* Assessment Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {assessment.course?.name || 'Unknown Course'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {assessment.course?.code}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assessment.status)}`}>
                {assessment.status}
              </span>
            </div>

            {/* Trainer Info */}
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Trainer</p>
              <p className="text-sm text-slate-900 dark:text-white">{assessment.trainer?.name}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{assessment.trainer?.email}</p>
            </div>

            {/* Scheduled Date */}
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Scheduled Date</p>
              <p className="text-sm text-slate-900 dark:text-white">
                {new Date(assessment.scheduled_date).toLocaleDateString()}
              </p>
            </div>

            {/* Assigned Managers */}
            {assessment.assignedManagers && assessment.assignedManagers.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Assigned Managers</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {assessment.assignedManagers.map((manager) => (
                    <span key={manager.id} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                      {manager.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Section */}
            {assessment.feedbacks && assessment.feedbacks.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Feedback ({assessment.feedbacks.length})
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {assessment.feedbacks.map((feedback) => (
                    <div key={feedback.id} className="p-2 bg-slate-50 dark:bg-slate-700 rounded border">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-medium text-slate-900 dark:text-white">
                          {feedback.manager?.name}
                        </span>
                        {feedback.score !== null && feedback.score !== undefined && (
                          <span className={`text-xs px-1 py-0.5 rounded ${getScoreColor(feedback.score)}`}>
                            {feedback.score}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                        {feedback.feedback_text}
                      </p>
                      {feedback.recommendations && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-1">
                          💡 {feedback.recommendations}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-3 bg-slate-50 dark:bg-slate-700 rounded">
                <p className="text-sm text-slate-600 dark:text-slate-400">No feedback yet</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleViewDetails(assessment)}
                className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Eye className="w-4 h-4 inline mr-1" />
                View
              </button>
              <button
                onClick={() => {
                  const existingFeedback = assessment.feedbacks && assessment.feedbacks.length > 0 
                    ? assessment.feedbacks.find((feedback: any) => feedback.evaluator_role === 'school_ops_manager' || feedback.manager_id === currentUserId) || null
                    : null
                  handleEdit(assessment, existingFeedback)
                }}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4 inline mr-1" />
                {assessment.feedbacks && assessment.feedbacks.length > 0 && assessment.feedbacks.some((feedback: any) => feedback.evaluator_role === 'school_ops_manager' || feedback.manager_id === currentUserId) ? 'Update' : 'Add'} Feedback
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAssessments.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No assessments found
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {searchTerm || statusFilter ? 'Try adjusting your filters' : 'No assessments assigned to you yet'}
          </p>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Assessment Details
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assessment</h3>
                  <p className="text-slate-900 dark:text-white">
                    {selectedAssessment.course?.name} - {selectedAssessment.course?.code}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Trainer</h3>
                  <p className="text-slate-900 dark:text-white">
                    {selectedAssessment.trainer?.name} ({selectedAssessment.trainer?.email})
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAssessment.status)}`}>
                    {selectedAssessment.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Scheduled Date</h3>
                  <p className="text-slate-900 dark:text-white">
                    {new Date(selectedAssessment.scheduled_date).toLocaleString()}
                  </p>
                </div>
                
                {selectedAssessment.feedbacks && selectedAssessment.feedbacks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">All Feedback</h3>
                    <div className="space-y-3">
                      {selectedAssessment.feedbacks.map((feedback) => (
                        <div key={feedback.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-slate-900 dark:text-white">
                              {feedback.manager?.name}
                            </span>
                            {feedback.score !== null && feedback.score !== undefined && (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreColor(feedback.score)}`}>
                                {feedback.score}%
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 mb-2">
                            {feedback.feedback_text}
                          </p>
                          {feedback.recommendations && (
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Recommendations</p>
                              <p className="text-slate-600 dark:text-slate-400">
                                {feedback.recommendations}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Submitted: {new Date(feedback.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedAssessment(null)
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Feedback Modal */}
      {showEditModal && selectedAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                School Ops Manager Evaluation - {selectedAssessment.trainer?.name}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Evaluation Parameters */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Evaluation Parameters (Max 5 marks each)</h3>
                  
                  {Object.entries({
                    timeBasedActivity: 'Time Based Activity',
                    studentEngagementIdeas: 'Student Engagement Ideas',
                    poisedAndConfident: 'Poised & Confident',
                    wellModulatedVoice: 'Well Modulated Voice',
                    pleasingLook: 'Pleasing Look'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div>
                        <label className="font-medium text-slate-900 dark:text-white">{label}</label>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Evaluate this parameter (0-5 marks)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="5"
                          value={evaluationParams[key as keyof typeof evaluationParams]}
                          onChange={(e) => setEvaluationParams(prev => ({
                            ...prev,
                            [key]: Math.min(5, Math.max(0, parseInt(e.target.value) || 0))
                          }))}
                          className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        <span className="text-sm text-slate-600">/5</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Score Summary */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-900 dark:text-white">Total Score:</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {Object.values(evaluationParams).reduce((sum, val) => sum + val, 0)} / 25
                    </span>
                  </div>
                </div>

                {/* Feedback Comments */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Feedback Comments *
                  </label>
                  <textarea
                    value={editFormData.feedback_text}
                    onChange={(e) => setEditFormData({ ...editFormData, feedback_text: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Recommendations */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Recommendations
                  </label>
                  <textarea
                    value={editFormData.recommendations}
                    onChange={(e) => setEditFormData({ ...editFormData, recommendations: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedAssessment(null)
                    setEditFormData({ feedback_text: '', recommendations: '', score: '' })
                    setEvaluationParams({
                      timeBasedActivity: 0,
                      studentEngagementIdeas: 0,
                      poisedAndConfident: 0,
                      wellModulatedVoice: 0,
                      pleasingLook: 0
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
                  Submit Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

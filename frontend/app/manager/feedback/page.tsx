'use client'
import { useState, useEffect } from 'react'
import { Send, CheckCircle, XCircle } from 'lucide-react'
import Modal from '@/components/Modal'
import Toast from '@/components/Toast'
import { api } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { getSystemSettings } from '@/lib/settings'

export default function FeedbackPanel() {
  // State for assessments and feedback form
  const [assessments, setAssessments] = useState<any[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [settings, setSettings] = useState<any>({ passingPercentage: 60, managerMarks: 35 })
  const [formData, setFormData] = useState({
    score: '',
    pass_fail: '',
    feedback_text: ''
  })

  // Manager evaluation parameters state
  const [evaluationParams, setEvaluationParams] = useState({
    hasKnowledgeOfSTEM: 0,
    abilityToIntegrateSTEM: 0,
    discussesUpToDateInfo: 0,
    provideCourseOutline: 0,
    languageFluency: 0,
    preparationWithLessonPlan: 0
  })

  // Load current user and assessments on mount
  useEffect(() => {
    loadCurrentUser()
  }, [])

  // Load assessments after current user is loaded
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

  // Fetch assessments assigned to this manager
  const loadAssessments = async () => {
    try {
      const [assessmentsResult, settingsResult] = await Promise.all([
        api.manager.getAssessments(),
        getSystemSettings()
      ])
      // Type the API response properly
      const assessmentsData = assessmentsResult as { data: { assessments: any[] } }
      setAssessments(assessmentsData.data.assessments || [])
      setSettings(settingsResult)
    } catch (error) {
      console.error('Failed to load assessments:', error)
      setToast({ message: 'Failed to load assessments', type: 'error' })
    }
  }

  // Open feedback modal for selected assessment
  const openFeedbackModal = (assessment: any) => {
    setSelectedAssessment(assessment)
    
    // Check if this manager already submitted feedback
    const myFeedback = assessment.feedbacks?.find((f: any) => f.manager_id === currentUserId)
    const latestFeedback = assessment.feedbacks?.[0] // Latest feedback for trainer dashboard
    
    if (myFeedback) {
      // Pre-fill with this manager's existing feedback and evaluation parameters
      setFormData({
        score: myFeedback.score?.toString() || '',
        pass_fail: myFeedback.pass_fail || '',
        feedback_text: myFeedback.feedback_text || ''
      })
      
      // Load existing evaluation parameters
      setEvaluationParams({
        hasKnowledgeOfSTEM: myFeedback.hasKnowledgeOfSTEM || 0,
        abilityToIntegrateSTEM: myFeedback.abilityToIntegrateSTEM || 0,
        discussesUpToDateInfo: myFeedback.discussesUpToDateInfo || 0,
        provideCourseOutline: myFeedback.provideCourseOutline || 0,
        languageFluency: myFeedback.languageFluency || 0,
        preparationWithLessonPlan: myFeedback.preparationWithLessonPlan || 0
      })
    } else if (latestFeedback) {
      // Show latest feedback from other manager as reference
      setFormData({
        score: latestFeedback.score?.toString() || '',
        pass_fail: latestFeedback.pass_fail || '',
        feedback_text: latestFeedback.feedback_text || ''
      })
      
      // Reset evaluation parameters for new feedback
      setEvaluationParams({
        hasKnowledgeOfSTEM: 0,
        abilityToIntegrateSTEM: 0,
        discussesUpToDateInfo: 0,
        provideCourseOutline: 0,
        languageFluency: 0,
        preparationWithLessonPlan: 0
      })
    } else {
      // Reset all for new feedback
      setFormData({ score: '', pass_fail: '', feedback_text: '' })
      setEvaluationParams({
        hasKnowledgeOfSTEM: 0,
        abilityToIntegrateSTEM: 0,
        discussesUpToDateInfo: 0,
        provideCourseOutline: 0,
        languageFluency: 0,
        preparationWithLessonPlan: 0
      })
    }
    setShowModal(true)
  }

  
  // Submit feedback for assessment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAssessment || !formData.feedback_text) {
      setToast({ message: 'Please provide feedback text', type: 'error' })
      return
    }

    try {
      const totalScore = Object.values(evaluationParams).reduce((sum, val) => sum + val, 0)
      const percentage = Math.round((totalScore / settings.managerMarks) * 100)
      const pass_fail = percentage >= settings.passingPercentage ? 'Pass' : 'Fail'

      // Check if there's existing evaluation
      const myFeedback = selectedAssessment.feedbacks?.find((f: any) => f.manager_id === currentUserId)
      
      // Save or update evaluation parameters
      if (myFeedback) {
        // Update existing evaluation
        await api.put(`/manager/evaluations/${selectedAssessment.id}`, {
          ...evaluationParams,
          totalScore,
          percentage
        })
      } else {
        // Create new evaluation
        await api.post('/manager/evaluations', {
          assessmentId: selectedAssessment.id,
          ...evaluationParams,
          totalScore,
          percentage
        })
      }

      // Submit traditional feedback with calculated score
      await api.manager.submitFeedback({
        assessment_id: selectedAssessment.id,
        score: percentage,
        pass_fail,
        feedback_text: formData.feedback_text
      })
      
      setToast({ message: pass_fail === 'Pass' ? 'Evaluation submitted and certificate generated successfully!' : 'Evaluation submitted successfully!', type: 'success' })
      setShowModal(false)
      setSelectedAssessment(null)
      setFormData({ score: '', pass_fail: '', feedback_text: '' })
      
      // Reset evaluation parameters
      setEvaluationParams({
        hasKnowledgeOfSTEM: 0,
        abilityToIntegrateSTEM: 0,
        discussesUpToDateInfo: 0,
        provideCourseOutline: 0,
        languageFluency: 0,
        preparationWithLessonPlan: 0
      })
      
      // Always refresh the assessments list to show updated feedback
      setTimeout(() => {
        loadAssessments()
      }, 500)

      // If a certificate was generated, show additional message but don't redirect immediately
      if (pass_fail === 'Pass') {
        setToast({ message: 'Certificate generated! Check certificates page.', type: 'success' });
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to submit evaluation', type: 'error' })
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Feedback Panel</h1>
        <p className="text-slate-500 text-sm">Provide feedback for trainer assessments</p>
      </div>

      {/* Assigned Assessments List */}
      <div className="container-card p-6">
        <h2 className="text-lg font-semibold mb-4">Your Assigned Assessments</h2>
        
        {assessments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No assessments assigned to you yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">📘 {assessment.course?.name || 'N/A'}</h3>
                    <p className="text-sm text-slate-600">Trainer: {assessment.trainer?.name || 'N/A'}</p>
                  </div>
                  {assessment.feedbacks && assessment.feedbacks.length > 0 ? (
                    <span className="badge-green flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Feedback Given
                    </span>
                  ) : (
                    <span className="badge-yellow">Pending Feedback</span>
                  )}
                </div>
                
                <div className="text-sm text-slate-600 mb-3">
                  <p>📅 Scheduled: {new Date(assessment.scheduled_date).toLocaleDateString()}</p>
                  <p>Status: {assessment.status}</p>
                </div>

                {assessment.feedbacks && assessment.feedbacks.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {/* Show ALL feedbacks clearly */}
                    <div className="p-3 bg-white dark:bg-slate-600 rounded border">
                      <p className="text-xs text-slate-500 mb-2 font-bold">All Feedbacks ({assessment.feedbacks.length}):</p>
                      {assessment.feedbacks.map((feedback: any, index: number) => (
                        <div key={feedback.id} className={`p-2 mb-2 rounded ${
                          feedback.manager_id === currentUserId 
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200' 
                            : 'bg-gray-50 dark:bg-gray-700 border border-gray-200'
                        }`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-medium">
                              {feedback.manager?.name} 
                              {feedback.manager_id === currentUserId && ' (YOU)'}
                            </span>
                            <span className="text-xs text-slate-500">
                              {feedback.pass_fail === 'Pass' ? '✅' : '❌'} {feedback.score}/100
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">
                            {feedback.feedback_text}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Created: {new Date(feedback.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Show what trainer sees (latest feedback) */}
                    <div className="text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200">
                      <strong>Trainer sees (Latest):</strong> {assessment.feedbacks[0]?.manager?.name} - {assessment.feedbacks[0]?.score}/100
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => openFeedbackModal(assessment)}
                    className="w-full mt-2 py-2 bg-primary text-white rounded-md hover:bg-red-600 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Provide Feedback
                  </button>
                )}
                
                {/* Action button - show edit if feedback exists, otherwise provide feedback */}
                {assessment.feedbacks && assessment.feedbacks.length > 0 && (
                  <button
                    onClick={() => openFeedbackModal(assessment)}
                    className="w-full mt-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {assessment.feedbacks.find((f: any) => f.manager_id === currentUserId) ? 'Edit Your Feedback' : 'Add Your Feedback'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Manager Evaluation">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Evaluation Parameters */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Evaluation Parameters</h3>
            
            {Object.entries({
              hasKnowledgeOfSTEM: { label: 'Has Knowledge of STEM', max: 5 },
              abilityToIntegrateSTEM: { label: 'Ability to integrate STEM with related activities', max: 10 },
              discussesUpToDateInfo: { label: 'Discusses Up-to-date information related to STEM', max: 5 },
              provideCourseOutline: { label: 'Provide Course Outline', max: 5 },
              languageFluency: { label: 'Language Fluency', max: 5 },
              preparationWithLessonPlan: { label: 'Preparation with Lesson Plan / Practicles', max: 5 }
            }).map(([key, config]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <label className="font-medium text-slate-900 dark:text-white">{config.label}</label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Evaluate this parameter (0-{config.max} marks)</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={config.max}
                    value={evaluationParams[key as keyof typeof evaluationParams]}
                    onChange={(e) => setEvaluationParams(prev => ({
                      ...prev,
                      [key]: Math.min(config.max, Math.max(0, parseInt(e.target.value) || 0))
                    }))}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <span className="text-sm text-slate-600">/{config.max}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Score Summary */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-900 dark:text-white">Total Score:</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Object.values(evaluationParams).reduce((sum, val) => sum + val, 0)} / 35
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Qualitative Feedback *</label>
            <textarea
              value={formData.feedback_text}
              onChange={(e) => setFormData({ ...formData, feedback_text: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Provide detailed feedback about the trainer's performance..."
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-2 bg-primary text-white rounded-md hover:bg-red-600"
          >
            Submit Evaluation
          </button>
        </form>
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

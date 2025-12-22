'use client'
import { useState, useEffect } from 'react'
import { Send, CheckCircle, XCircle } from 'lucide-react'
import Modal from '@/components/Modal'
import Toast from '@/components/Toast'
import { api } from '@/lib/api'

export default function FeedbackPanel() {
  // State for assessments and feedback form
  const [assessments, setAssessments] = useState<any[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [formData, setFormData] = useState({
    score: '',
    pass_fail: '',
    feedback_text: ''
  })

  // Load manager's assigned assessments on mount
  useEffect(() => {
    loadAssessments()
  }, [])

  // Fetch assessments assigned to this manager
  const loadAssessments = async () => {
    try {
      const result: any = await api.manager.getAssessments()
      setAssessments(result.data.assessments || [])
    } catch (error) {
      console.error('Failed to load assessments:', error)
      setToast({ message: 'Failed to load assessments', type: 'error' })
    }
  }

  // Open feedback modal for selected assessment
  const openFeedbackModal = (assessment: any) => {
    setSelectedAssessment(assessment)
    // Pre-fill if feedback already exists
    if (assessment.feedbacks && assessment.feedbacks.length > 0) {
      const existingFeedback = assessment.feedbacks[0]
      setFormData({
        score: existingFeedback.score?.toString() || '',
        pass_fail: existingFeedback.pass_fail || '',
        feedback_text: existingFeedback.feedback_text || ''
      })
    } else {
      setFormData({ score: '', pass_fail: '', feedback_text: '' })
    }
    setShowModal(true)
  }

  // Submit feedback for assessment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAssessment || !formData.score || !formData.pass_fail || !formData.feedback_text) {
      setToast({ message: 'Please fill all fields', type: 'error' })
      return
    }

    try {
      await api.manager.submitFeedback({
        assessment_id: selectedAssessment.id,
        score: parseFloat(formData.score),
        pass_fail: formData.pass_fail,
        feedback_text: formData.feedback_text
      })
      
      setToast({ message: formData.pass_fail === 'Pass' ? 'Feedback submitted and certificate generated successfully!' : 'Feedback submitted successfully!', type: 'success' })
      setShowModal(false)
      setSelectedAssessment(null)
      setFormData({ score: '', pass_fail: '', feedback_text: '' })

      // If a certificate was generated, redirect to certificates page to show it
      if (formData.pass_fail === 'Pass') {
        setToast({ message: 'Certificate generated successfully! Redirecting to certificates...', type: 'success' });
        setTimeout(() => {
          // Force refresh the certificates page to show the new certificate
          window.location.href = '/trainer/certificates?refresh=' + Date.now();
        }, 2000);
      } else {
        setToast({ message: 'Feedback submitted successfully!', type: 'success' });
        loadAssessments() // Refresh list
      }
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to submit feedback', type: 'error' })
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
                  <div className="mt-3 p-3 bg-white dark:bg-slate-600 rounded border">
                    <p className="text-xs text-slate-500 mb-1">Your Feedback:</p>
                    <p className="text-sm mb-2">{assessment.feedbacks[0].feedback_text}</p>
                    <p className="text-xs text-slate-600">
                      Score: {assessment.feedbacks[0].score}/100 • 
                      {assessment.feedbacks[0].pass_fail === 'Pass' ? ' ✅ Pass' : ' ❌ Fail'}
                    </p>
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Submit Feedback">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Score (0-100) *</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Pass/Fail *</label>
            <select
              value={formData.pass_fail}
              onChange={(e) => setFormData({ ...formData, pass_fail: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select result</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
            </select>
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
            Submit Feedback
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

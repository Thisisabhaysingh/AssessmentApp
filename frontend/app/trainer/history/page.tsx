'use client'
import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { api } from '@/lib/api'

export default function TrainerHistory() {
  const [assessments, setAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load trainer's assessment history on component mount
  useEffect(() => {
    loadAssessments()
  }, [])

  // Fetch trainer's assessments from backend
  const loadAssessments = async () => {
    try {
      const result: any = await api.trainer.assessments()
      setAssessments(result.data.assessments || [])
      setLoading(false)
    } catch (error) {
      console.error('Failed to load assessments:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading assessment history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Assessment History</h1>
        <p className="text-slate-500 text-sm">View your completed and scheduled assessments</p>
      </div>

      {/* Assessment History List */}
      <div className="space-y-4">
        {assessments.length === 0 ? (
          <div className="container-card p-8 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No Assessments Yet</h3>
            <p className="text-slate-500 text-sm">Your assessment history will appear here once assigned by admin.</p>
          </div>
        ) : (
          assessments.map((assessment) => (
            <div key={assessment.id} className="container-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">
                    📘 {assessment.course?.name || 'N/A'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Level: {assessment.course?.level || 'N/A'}
                  </p>
                </div>
                <div>
                  {assessment.status === 'Scheduled' && (
                    <span className="badge-yellow flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Scheduled
                    </span>
                  )}
                  {assessment.status === 'Completed' && assessment.clear_status === 'Pass' && (
                    <span className="badge-green flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Passed
                    </span>
                  )}
                  {assessment.status === 'Completed' && assessment.clear_status === 'Fail' && (
                    <span className="badge-red flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Failed
                    </span>
                  )}
                  {assessment.status === 'Completed' && !assessment.clear_status && (
                    <span className="badge bg-blue-100 text-blue-700">
                      Awaiting Feedback
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Scheduled Date</p>
                  <p className="text-sm font-medium">
                    📅 {new Date(assessment.scheduled_date).toLocaleDateString()} at {new Date(assessment.scheduled_date).toLocaleTimeString()}
                  </p>
                </div>
                {assessment.score !== null && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Score</p>
                    <p className="text-sm font-medium">
                      🎯 {assessment.score}/100
                    </p>
                  </div>
                )}
              </div>

              {/* Manager Feedback Section */}
              {assessment.feedback && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-xs text-slate-500 mb-2">Manager Feedback</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    {assessment.feedback.feedback_text || 'No feedback provided yet.'}
                  </p>
                  {assessment.feedback.manager && (
                    <p className="text-xs text-slate-500 mt-2">
                      — {assessment.feedback.manager.name}
                    </p>
                  )}
                </div>
              )}

              {/* Assigned Manager */}
              {assessment.manager && (
                <div className="mt-4 text-sm text-slate-600">
                  <span className="font-medium">Assigned Manager:</span> {assessment.manager.name}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

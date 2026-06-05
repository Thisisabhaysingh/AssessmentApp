'use client'
import { useState, useEffect } from 'react'
import { Calendar, Users, Award, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { getSystemSettings } from '@/lib/settings'

export default function TrainerHistory() {
  const [assessments, setAssessments] = useState<any[]>([])
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>({})

  // Load trainer's assessment history on component mount
  useEffect(() => {
    loadAssessments()
  }, [])

  // Fetch trainer's assessments and evaluations from backend
  const loadAssessments = async () => {
    try {
      // Get system settings for passing criteria
      const settings = await getSystemSettings()
      setSettings(settings)
      
      const [assessmentsResult, evaluationsResult]: any[] = await Promise.all([
        api.trainer.assessments(),
        api.get('/public/evaluations') // Use public evaluations endpoint
      ])
      
      const assessmentsData = assessmentsResult.data.assessments || []
      const evaluationsData = evaluationsResult.data || []
      
      // Attach evaluations to assessments
      const assessmentsWithEvaluations = assessmentsData.map((assessment: any) => {
        const schoolOpsEval = evaluationsData.find(
          (e: any) => e.assessment_id === assessment.id && e.evaluator_role === 'school_ops_manager'
        )
        const managerEval = evaluationsData.find(
          (e: any) => e.assessment_id === assessment.id && e.evaluator_role === 'manager'
        )
        
        const schoolOpsScore = schoolOpsEval?.totalScore || 0
        const managerScore = managerEval?.totalScore || 0
        const combinedScore = schoolOpsScore + managerScore
        const percentage = combinedScore > 0 ? Math.round((combinedScore / settings.totalMarks) * 100) : 0
        
        return {
          ...assessment,
          schoolOpsEvaluation: schoolOpsEval,
          managerEvaluation: managerEval,
          combinedScore,
          percentage,
          hasEvaluations: !!(schoolOpsEval || managerEval)
        }
      })
      
      setAssessments(assessmentsWithEvaluations)
      setEvaluations(evaluationsData)
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
                  {assessment.status === 'Completed' && assessment.hasEvaluations && (
                    <>
                      {assessment.percentage >= settings.passingPercentage ? (
                        <span className="badge-green flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Passed
                        </span>
                      ) : (
                        <span className="badge-red flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </>
                  )}
                  {assessment.status === 'Completed' && !assessment.hasEvaluations && (
                    <span className="badge bg-blue-100 text-blue-700">
                      Awaiting Evaluation
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
                {assessment.hasEvaluations && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Combined Score</p>
                    <p className="text-sm font-medium">
                      🎯 {assessment.percentage}% ({assessment.combinedScore}/{settings.totalMarks})
                    </p>
                  </div>
                )}
              </div>

              {/* Evaluation Breakdown */}
              {assessment.hasEvaluations && (
                <div className="space-y-3 mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  {/* Combined Score Banner */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Final Combined Score</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {assessment.combinedScore}/{settings.totalMarks}
                        </span>
                        <span className="ml-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                          ({assessment.percentage}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* School Ops Manager Evaluation */}
                  {assessment.schoolOpsEvaluation && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-green-800 dark:text-green-200">School Ops Manager</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {assessment.schoolOpsEvaluation.totalScore}/25
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Time Activity:</span>
                          <span className="font-medium">{assessment.schoolOpsEvaluation.timeBasedActivity}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Student Ideas:</span>
                          <span className="font-medium">{assessment.schoolOpsEvaluation.studentEngagementIdeas}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Poised:</span>
                          <span className="font-medium">{assessment.schoolOpsEvaluation.poisedAndConfident}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Voice:</span>
                          <span className="font-medium">{assessment.schoolOpsEvaluation.wellModulatedVoice}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Look:</span>
                          <span className="font-medium">{assessment.schoolOpsEvaluation.pleasingLook}/5</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manager Evaluation */}
                  {assessment.managerEvaluation && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-blue-800 dark:text-blue-200">Manager</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {assessment.managerEvaluation.totalScore}/35
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">STEM Knowledge:</span>
                          <span className="font-medium">{assessment.managerEvaluation.hasKnowledgeOfSTEM}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">STEM Integration:</span>
                          <span className="font-medium">{assessment.managerEvaluation.abilityToIntegrateSTEM}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Up-to-date:</span>
                          <span className="font-medium">{assessment.managerEvaluation.discussesUpToDateInfo}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Course Outline:</span>
                          <span className="font-medium">{assessment.managerEvaluation.provideCourseOutline}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Language:</span>
                          <span className="font-medium">{assessment.managerEvaluation.languageFluency}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Preparation:</span>
                          <span className="font-medium">{assessment.managerEvaluation.preparationWithLessonPlan}/5</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Legacy Feedback Display */}
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

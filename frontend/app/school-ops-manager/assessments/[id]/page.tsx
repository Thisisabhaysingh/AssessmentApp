'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Users, Award, MessageSquare, Clock, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api'

export default function AssessmentDetails() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = parseInt(params.id as string)
  
  const [assessment, setAssessment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [schoolOpsEvaluation, setSchoolOpsEvaluation] = useState<any>(null)
  const [managerEvaluation, setManagerEvaluation] = useState<any>(null)
  const [loadingEvaluations, setLoadingEvaluations] = useState(true)

  useEffect(() => {
    if (assessmentId) {
      loadAssessmentDetails()
    }
  }, [assessmentId])

  const loadAssessmentDetails = async () => {
    try {
      const response = await api.get('/school-ops-manager/assessments')
      const assessmentsData = response.data || []
      
      const assessmentData = assessmentsData.find((a: any) => a.id === assessmentId)
      
      if (!assessmentData) {
        setLoading(false)
        return
      }
      
      setAssessment(assessmentData)
      setLoading(false)
      
      // Load both evaluations
      await loadEvaluations()
    } catch (error) {
      console.error('Failed to load assessment details:', error)
      setLoading(false)
    }
  }

  const loadEvaluations = async () => {
    setLoadingEvaluations(true)
    try {
      // Load School Ops Manager evaluation
      try {
        console.log('🔍 Loading School Ops evaluation for assessment:', assessmentId)
        const schoolOpsResponse = await api.get(`/school-ops-manager/evaluations/${assessmentId}`)
        console.log('📊 School Ops response:', schoolOpsResponse)
        if (schoolOpsResponse.success && schoolOpsResponse.data) {
          setSchoolOpsEvaluation(schoolOpsResponse.data)
          console.log('✅ School Ops evaluation loaded:', schoolOpsResponse.data)
        }
      } catch (error) {
        console.log('❌ No School Ops evaluation found:', error)
      }

      // Load Manager evaluation
      try {
        console.log('🔍 Loading Manager evaluation for assessment:', assessmentId)
        const managerResponse = await api.get(`/school-ops-manager/evaluations/${assessmentId}?role=manager`)
        console.log('📊 Manager response:', managerResponse)
        if (managerResponse.success && managerResponse.data) {
          setManagerEvaluation(managerResponse.data)
          console.log('✅ Manager evaluation loaded:', managerResponse.data)
        }
      } catch (error) {
        console.log('❌ No Manager evaluation found:', error)
      }
    } catch (error) {
      console.error('Failed to load evaluations:', error)
    } finally {
      setLoadingEvaluations(false)
    }
  }

  const calculateFinalScore = () => {
    if (!schoolOpsEvaluation && !managerEvaluation) return null
    
    const schoolOpsScore = schoolOpsEvaluation?.totalScore || 0
    const managerScore = managerEvaluation?.totalScore || 0
    const totalScore = schoolOpsScore + managerScore
    const maxPossible = 60 // 25 + 35
    const percentage = Math.round((totalScore / maxPossible) * 100)
    
    return {
      schoolOpsScore,
      managerScore,
      totalScore,
      percentage,
      maxPossible
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="p-8">
        <div className="text-center py-8">
          <p className="text-slate-500">Assessment not found</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const assessmentDate = assessment.scheduledDate || assessment.scheduled_date || assessment.createdAt || assessment.created_at
  const formattedDate = assessmentDate ? new Date(assessmentDate).toLocaleDateString() : 'Date not available'

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{assessment.title}</h1>
          <p className="text-slate-500 text-sm dark:text-slate-400">Assessment Details</p>
        </div>
      </div>

      {/* Assessment Info Card */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Assessment Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled Date</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{formattedDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Trainer</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{assessment.trainer?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Course</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{assessment.course?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled By</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {assessment.assignedManagers && assessment.assignedManagers.length > 0 
                  ? assessment.assignedManagers.map((manager: any) => manager.name).join(', ')
                  : 'N/A'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                assessment.status === 'Completed' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : assessment.status === 'scheduled'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
              }`}>
                {assessment.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Score and Evaluations */}
      {(assessment.status === 'Completed' || schoolOpsEvaluation || managerEvaluation) && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Evaluation Results</h2>
          
          {/* Final Score */}
          {calculateFinalScore() && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Final Combined Score</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">School Ops Score</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {calculateFinalScore()?.schoolOpsScore}
                  </p>
                  <p className="text-xs text-slate-500">/ 25</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Manager Score</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {calculateFinalScore()?.managerScore}
                  </p>
                  <p className="text-xs text-slate-500">/ 35</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Score</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {calculateFinalScore()?.totalScore}
                  </p>
                  <p className="text-xs text-slate-500">/ 60</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Final Percentage</p>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {calculateFinalScore()?.percentage}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Individual Evaluations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* School Ops Manager Evaluation */}
            {schoolOpsEvaluation && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  School Ops Manager Evaluation
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Time Based Activity</span>
                    <span className="font-medium">{schoolOpsEvaluation.timeBasedActivity}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Student Engagement Ideas</span>
                    <span className="font-medium">{schoolOpsEvaluation.studentEngagementIdeas}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Poised & Confident</span>
                    <span className="font-medium">{schoolOpsEvaluation.poisedAndConfident}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Well Modulated Voice</span>
                    <span className="font-medium">{schoolOpsEvaluation.wellModulatedVoice}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Pleasing Look</span>
                    <span className="font-medium">{schoolOpsEvaluation.pleasingLook}/5</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-blue-200 dark:border-blue-700">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{schoolOpsEvaluation.totalScore}/25 ({schoolOpsEvaluation.percentage}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Manager Evaluation */}
            {managerEvaluation && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <h3 className="text-base font-semibold text-green-900 dark:text-green-100 mb-3">
                  Manager Evaluation
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Has Knowledge of STEM</span>
                    <span className="font-medium">{managerEvaluation.hasKnowledgeOfSTEM}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Ability to integrate STEM</span>
                    <span className="font-medium">{managerEvaluation.abilityToIntegrateSTEM}/10</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Up-to-date STEM Info</span>
                    <span className="font-medium">{managerEvaluation.discussesUpToDateInfo}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Course Outline</span>
                    <span className="font-medium">{managerEvaluation.provideCourseOutline}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Language Fluency</span>
                    <span className="font-medium">{managerEvaluation.languageFluency}/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Lesson Plan Preparation</span>
                    <span className="font-medium">{managerEvaluation.preparationWithLessonPlan}/5</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-green-200 dark:border-green-700">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{managerEvaluation.totalScore}/35 ({managerEvaluation.percentage}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* No Evaluations Yet */}
          {!schoolOpsEvaluation && !managerEvaluation && (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                No evaluations completed yet for this assessment.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Both School Ops Manager and Manager need to complete their evaluations for the final score.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 flex-wrap">
        <button 
          onClick={() => router.push('/school-ops-manager/assessments')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          View All Assessments
        </button>
        
        {/* School Ops Manager Evaluation Button */}
        {!schoolOpsEvaluation && (
          <button 
            onClick={() => router.push(`/school-ops-manager/evaluate/${assessmentId}`)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Complete School Ops Evaluation
          </button>
        )}
        
        {schoolOpsEvaluation && (
          <button 
            onClick={() => router.push(`/school-ops-manager/evaluate/${assessmentId}`)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Edit School Ops Evaluation
          </button>
        )}
        
              </div>
    </div>
  )
}

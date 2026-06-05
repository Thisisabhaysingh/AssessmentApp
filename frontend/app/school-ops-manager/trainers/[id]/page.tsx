'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Phone, Calendar, Award, TrendingUp, Users } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { api } from '@/lib/api'

export default function TrainerDetails() {
  const params = useParams()
  const router = useRouter()
  const trainerId = parseInt(params.id as string)
  
  const [trainer, setTrainer] = useState<any>(null)
  const [trainerStats, setTrainerStats] = useState<any>(null)
  const [assessments, setAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [evaluations, setEvaluations] = useState<any[]>([])

  useEffect(() => {
    if (trainerId) {
      loadTrainerDetails()
    }
  }, [trainerId])

  const loadTrainerDetails = async () => {
    try {
      const [trainersRes, assessmentsRes, evaluationsRes]: any[] = await Promise.all([
        api.get('/school-ops-manager/trainers'),
        api.get('/school-ops-manager/assessments'),
        api.get('/public/evaluations') // Use public evaluations endpoint
      ])
      
      const allTrainers = trainersRes.data || []
      const trainerData = allTrainers.find((t: any) => t.id === trainerId)
      const assessmentsData = assessmentsRes.data || []
      const evaluationsData = evaluationsRes.data || []
      
      if (!trainerData) {
        setLoading(false)
        return
      }
      
      // Filter assessments for this trainer
      const trainerAssessments = assessmentsData.filter(
        (a: any) => a.trainer_id === trainerId
      )
      
      // Filter evaluations for this trainer's assessments
      const trainerEvaluations = evaluationsData.filter(
        (e: any) => trainerAssessments.some((a: any) => a.id === e.assessment_id)
      )
      
      const completedAssessments = trainerAssessments.filter(
        (a: any) => a.status === 'Completed'
      )
      
      // Calculate combined scores for completed assessments with evaluations
      let totalCombinedScore = 0
      let assessmentCount = 0
      
      completedAssessments.forEach((assessment: any) => {
        const schoolOpsEval = trainerEvaluations.find(
          (e: any) => e.assessment_id === assessment.id && e.evaluator_role === 'school_ops_manager'
        )
        const managerEval = trainerEvaluations.find(
          (e: any) => e.assessment_id === assessment.id && e.evaluator_role === 'manager'
        )
        
        if (schoolOpsEval || managerEval) {
          const schoolOpsScore = schoolOpsEval?.totalScore || 0
          const managerScore = managerEval?.totalScore || 0
          const combinedScore = schoolOpsScore + managerScore // Out of 60
          totalCombinedScore += combinedScore
          assessmentCount++
        }
      })
      
      const avgCombinedScore = assessmentCount > 0 
        ? Math.round((totalCombinedScore / assessmentCount) * 10) / 10
        : 0
      
      const avgPercentage = assessmentCount > 0
        ? Math.round((totalCombinedScore / (assessmentCount * 60)) * 100)
        : 0
      
      // Get courses
      const courses = Array.from(
        new Set(trainerAssessments.map((a: any) => a.course?.name).filter(Boolean))
      )
      
      // Attach evaluations to assessments for display
      const assessmentsWithEvaluations = trainerAssessments.map((assessment: any) => {
        const schoolOpsEval = trainerEvaluations.find(
          (e: any) => e.assessment_id === assessment.id && e.evaluator_role === 'school_ops_manager'
        )
        const managerEval = trainerEvaluations.find(
          (e: any) => e.assessment_id === assessment.id && e.evaluator_role === 'manager'
        )
        
        const schoolOpsScore = schoolOpsEval?.totalScore || 0
        const managerScore = managerEval?.totalScore || 0
        const combinedScore = schoolOpsScore + managerScore
        const percentage = combinedScore > 0 ? Math.round((combinedScore / 60) * 100) : 0
        
        return {
          ...assessment,
          schoolOpsEvaluation: schoolOpsEval,
          managerEvaluation: managerEval,
          combinedScore,
          percentage,
          hasEvaluations: !!(schoolOpsEval || managerEval)
        }
      })
      
      const stats = {
        totalAssessments: trainerAssessments.length,
        completedAssessments: completedAssessments.length,
        avgCombinedScore,
        avgPercentage,
        courses,
        recentAssessments: assessmentsWithEvaluations
          .sort((a: any, b: any) => {
            const dateA = a.scheduled_date || a.createdAt || a.created_at
            const dateB = b.scheduled_date || b.createdAt || b.created_at
            return new Date(dateB).getTime() - new Date(dateA).getTime()
          })
          .slice(0, 5)
      }
      
      setTrainer(trainerData)
      setTrainerStats(stats)
      setAssessments(assessmentsWithEvaluations)
      setEvaluations(trainerEvaluations)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load trainer details:', error)
      setLoading(false)
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

  if (!trainer || !trainerStats) {
    return (
      <div className="p-8">
        <div className="text-center py-8">
          <p className="text-slate-500">Trainer not found</p>
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
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{trainer.name}</h1>
          <p className="text-slate-500 text-sm dark:text-slate-400">Trainer Performance Details</p>
        </div>
      </div>

      {/* Trainer Info Card */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Trainer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{trainer.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{trainer.phone || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Department</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{trainer.department || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Joined</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {trainer.created_at ? new Date(trainer.created_at).toLocaleDateString() : trainer.createdAt ? new Date(trainer.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Assessments" value={trainerStats.totalAssessments} icon={TrendingUp} color="text-blue-600" />
        <StatCard title="Completed" value={trainerStats.completedAssessments} icon={Award} color="text-green-600" />
        <StatCard title="Average Score" value={`${trainerStats.avgPercentage}%`} icon={Award} color="text-purple-600" />
        <StatCard title="Avg Combined Score" value={`${trainerStats.avgCombinedScore}/60`} icon={Users} color="text-orange-600" />
      </div>

      {/* Courses */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Courses</h2>
        <div className="flex flex-wrap gap-2">
          {trainerStats.courses.length > 0 ? (
            trainerStats.courses.map((course: string, idx: number) => (
              <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                {course}
              </span>
            ))
          ) : (
            <p className="text-slate-500 dark:text-slate-400">No courses assigned</p>
          )}
        </div>
      </div>

      {/* Recent Assessments */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Recent Assessments</h2>
        <div className="space-y-4">
          {trainerStats.recentAssessments.length > 0 ? (
            trainerStats.recentAssessments.map((assessment: any) => {
              const assessmentDate = assessment.scheduled_date || assessment.createdAt || assessment.created_at
              const formattedDate = assessmentDate ? new Date(assessmentDate).toLocaleDateString() : 'Date not available'
              
              return (
                <div key={assessment.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">{assessment.course?.name || 'Unknown Course'}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Scheduled: {formattedDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        assessment.status === 'Completed' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {assessment.status}
                      </span>
                    </div>
                  </div>

                  {/* Evaluation Breakdown */}
                  {assessment.hasEvaluations && (
                    <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      {/* Combined Score */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">Final Combined Score</span>
                          <div className="text-right">
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {assessment.combinedScore}/60
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

                      {/* No Evaluations Available */}
                      {!assessment.schoolOpsEvaluation && !assessment.managerEvaluation && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                            Evaluations pending from School Ops Manager and/or Manager
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Legacy Feedback Display */}
                  {assessment.feedbacks && assessment.feedbacks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-600 dark:text-slate-300 italic">
                        "{assessment.feedbacks[0].feedback_text}"
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        - {assessment.feedbacks[0].manager?.name || 'Manager'}
                      </p>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <p className="text-slate-500 dark:text-slate-400">No assessments found</p>
          )}
        </div>
      </div>
    </div>
  )
}

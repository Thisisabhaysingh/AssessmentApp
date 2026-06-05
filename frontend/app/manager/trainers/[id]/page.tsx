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

  useEffect(() => {
    if (trainerId) {
      loadTrainerDetails()
    }
  }, [trainerId])

  const loadTrainerDetails = async () => {
    try {
      const [trainersRes, assessmentsRes]: any[] = await Promise.all([
        api.admin.getTrainers(),
        api.manager.getAssessments()
      ])
      
      const allTrainers = trainersRes.data.trainers || []
      const trainerData = allTrainers.find((t: any) => t.id === trainerId)
      const assessmentsData = assessmentsRes.data.assessments || []
      
      if (!trainerData) {
        setLoading(false)
        return
      }
      
      // Filter assessments for this trainer
      const trainerAssessments = assessmentsData.filter(
        (a: any) => a.trainer_id === trainerId
      )
      
      const completedAssessments = trainerAssessments.filter(
        (a: any) => a.status === 'Completed'
      )
      
      const totalScore = completedAssessments.reduce(
        (sum: number, a: any) => sum + (a.score || 0), 
        0
      )
      
      const avgScore = completedAssessments.length > 0 
        ? Math.round((totalScore / completedAssessments.length) * 10) / 10
        : 0
      
      // Get courses
      const courses = Array.from(
        new Set(trainerAssessments.map((a: any) => a.course?.name).filter(Boolean))
      )
      
      const stats = {
        totalAssessments: trainerAssessments.length,
        completedAssessments: completedAssessments.length,
        avgScore,
        courses,
        recentAssessments: trainerAssessments
          .sort((a: any, b: any) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
          .slice(0, 5)
      }
      
      setTrainer(trainerData)
      setTrainerStats(stats)
      setAssessments(trainerAssessments)
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-red-600"
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
      <div className="container-card p-6">
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
                {trainer.created_at ? new Date(trainer.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Assessments" value={trainerStats.totalAssessments} icon={TrendingUp} color="text-blue-600" />
        <StatCard title="Completed" value={trainerStats.completedAssessments} icon={Award} color="text-green-600" />
        <StatCard title="Average Score" value={`${trainerStats.avgScore}%`} icon={Award} color="text-purple-600" />
        <StatCard title="Courses" value={trainerStats.courses.length} icon={Users} color="text-orange-600" />
      </div>

      {/* Courses */}
      <div className="container-card p-6">
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
      <div className="container-card p-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Recent Assessments</h2>
        <div className="space-y-3">
          {trainerStats.recentAssessments.length > 0 ? (
            trainerStats.recentAssessments.map((assessment: any) => (
              <div key={assessment.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">{assessment.course?.name || 'Unknown Course'}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Scheduled: {new Date(assessment.scheduled_date).toLocaleDateString()}
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
                    {assessment.score && (
                      <p className="text-sm font-medium mt-1 text-slate-900 dark:text-slate-100">Score: {assessment.score}%</p>
                    )}
                  </div>
                </div>
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
            ))
          ) : (
            <p className="text-slate-500 dark:text-slate-400">No assessments found</p>
          )}
        </div>
      </div>
    </div>
  )
}

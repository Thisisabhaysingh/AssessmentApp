'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Calendar, CheckCircle, Clock, MessageSquare, TrendingUp } from 'lucide-react'
import { api } from '@/lib/api'

interface DashboardStats {
  totalTrainers: number
  totalAssessments: number
  scheduledAssessments: number
  completedAssessments: number
  pendingFeedback: number
}

interface RecentAssessment {
  id: number
  title: string
  status: string
  scheduledDate?: string
  scheduled_date?: string
  createdAt?: string
  created_at?: string
  trainer: {
    id: number
    name: string
    email: string
  }
}

export default function SchoolOpsManagerDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentAssessments, setRecentAssessments] = useState<RecentAssessment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/school-ops-manager/dashboard')
      if (response.success) {
        setStats(response.data.stats)
        setRecentAssessments(response.data.recentAssessments)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      // Set default values on error
      setStats({
        totalTrainers: 0,
        totalAssessments: 0,
        scheduledAssessments: 0,
        completedAssessments: 0,
        pendingFeedback: 0
      })
      setRecentAssessments([])
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Trainers',
      value: stats?.totalTrainers || 0,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Total Assessments',
      value: stats?.totalAssessments || 0,
      icon: Calendar,
      color: 'bg-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Scheduled',
      value: stats?.scheduledAssessments || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      title: 'Completed',
      value: stats?.completedAssessments || 0,
      icon: CheckCircle,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400'
    }
  ]

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-6 h-32"></div>
            ))}
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 h-64"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          School Operations Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage trainer assessments and provide operational feedback
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-lg p-6 border border-slate-200 dark:border-slate-700`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Assessments */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Recent Assessments
            </h2>
            <button
              onClick={() => window.location.href = '/school-ops-manager/assessments'}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View All
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {recentAssessments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                No assessments scheduled yet
              </p>
              <button
                onClick={() => router.push('/school-ops-manager/assessments')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Schedule First Assessment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                      {assessment.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      <span>Trainer: {assessment.trainer.name}</span>
                      <span>Scheduled: {
                        (() => {
                          const assessmentDate = assessment.scheduledDate || assessment.scheduled_date || assessment.createdAt || assessment.created_at
                          return assessmentDate ? new Date(assessmentDate).toLocaleDateString() : 'Date not available'
                        })()
                      }</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      assessment.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : assessment.status === 'scheduled'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {assessment.status}
                    </span>
                    <button
                      onClick={() => router.push(`/school-ops-manager/assessments/${assessment.id}`)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={() => window.location.href = '/school-ops-manager/assessments'}
          className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow text-left"
        >
          <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            Schedule Assessment
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Create and manage assessment schedules for trainers
          </p>
        </button>

        <button
          onClick={() => window.location.href = '/school-ops-manager/trainers'}
          className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow text-left"
        >
          <Users className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            Manage Trainers
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            View trainer profiles and assessment history
          </p>
        </button>

        <button
          onClick={() => window.location.href = '/school-ops-manager/performance'}
          className="p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow text-left"
        >
          <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3" />
          <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
            Performance Reports
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            View detailed performance analytics and reports
          </p>
        </button>
      </div>
    </div>
  )
}

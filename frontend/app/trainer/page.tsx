'use client'
import { useState, useEffect } from 'react'
import StatCard from '@/components/StatCard'
import { CheckCircle, Clock, TrendingUp, Award } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { api } from '@/lib/api'

export default function TrainerDashboard() {
  const [user, setUser] = useState<any>(null)
  const [assessments, setAssessments] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0,
    avgScore: 0,
    completed: 0,
    pending: 0,
    passRate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      
      // Fetch trainer's assessments
      const result: any = await api.trainer.assessments()
      const assessmentsData = result.data.assessments || []
      
      setAssessments(assessmentsData)
      
      // Calculate stats
      const completed = assessmentsData.filter((a: any) => a.status === 'Completed')
      const pending = assessmentsData.filter((a: any) => a.status === 'Scheduled')
      const passed = completed.filter((a: any) => a.clear_status === 'Pass')
      
      const totalScore = completed.reduce((sum: number, a: any) => sum + (a.score || 0), 0)
      const avgScore = completed.length > 0 ? Math.round(totalScore / completed.length) : 0
      const passRate = completed.length > 0 ? Math.round((passed.length / completed.length) * 100) : 0
      
      setStats({
        total: assessmentsData.length,
        avgScore,
        completed: completed.length,
        pending: pending.length,
        passRate
      })
      
      setLoading(false)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold dark:text-white">Trainer Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Welcome back, {user?.name || 'Trainer'}</p>
      </div>

      {/* Stats - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Assessments" value={stats.total} icon={Award} color="text-blue-600" />
        <StatCard title="Average Score" value={`${stats.avgScore}%`} icon={TrendingUp} color="text-green-600" />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle} color="text-purple-600" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} color="text-orange-600" />
      </div>

      {/* Performance Summary - Enhanced Dark Mode */}
      <div className="container-card p-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Performance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800/30 shadow-md">
            <p className="text-sm text-slate-600 dark:text-slate-200 mb-2 font-medium">Total Assessments</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
          </div>
          <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800/30 shadow-md">
            <p className="text-sm text-slate-600 dark:text-slate-200 mb-2 font-medium">Pass Rate</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.passRate}%</p>
          </div>
          <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800/30 shadow-md">
            <p className="text-sm text-slate-600 dark:text-slate-200 mb-2 font-medium">Average Score</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.avgScore}%</p>
          </div>
        </div>
      </div>

      {/* Recent Assessments */}
      <div className="container-card p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Assessments</h2>
        <div className="overflow-x-auto">
          {assessments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No assessments found. Your assessments will appear here once scheduled by admin.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200">
                <tr className="text-left">
                  <th className="pb-3 font-medium text-slate-600">Course</th>
                  <th className="pb-3 font-medium text-slate-600">Date & Time</th>
                  <th className="pb-3 font-medium text-slate-600">Status</th>
                  <th className="pb-3 font-medium text-slate-600">Score</th>
                  <th className="pb-3 font-medium text-slate-600">Result</th>
                </tr>
              </thead>
              <tbody>
                {assessments.slice(0, 10).map((assessment) => (
                  <tr key={assessment.id} className="border-b border-slate-100">
                    <td className="py-3">📘 {assessment.course?.name || 'N/A'}</td>
                    <td className="py-3">
                      {new Date(assessment.scheduled_date).toLocaleDateString()} {new Date(assessment.scheduled_date).toLocaleTimeString()}
                    </td>
                    <td className="py-3">
                      {assessment.status === 'Scheduled' && <span className="badge-yellow">Scheduled</span>}
                      {assessment.status === 'Completed' && <span className="badge-green">Completed</span>}
                    </td>
                    <td className="py-3">
                      {assessment.score ? `${assessment.score}%` : '-'}
                    </td>
                    <td className="py-3">
                      {assessment.clear_status === 'Pass' && <span className="badge-green">Pass</span>}
                      {assessment.clear_status === 'Fail' && <span className="badge-red">Fail</span>}
                      {!assessment.clear_status && <span className="text-slate-400">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

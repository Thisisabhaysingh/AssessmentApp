'use client'
import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Award, CheckCircle, Clock, Lock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getCurrentUser } from '@/lib/auth'
import { api } from '@/lib/api'
import ChangePasswordModal from '@/components/ChangePasswordModal'

export default function ManagerProfile() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalAssessments: 0,
    avgScore: 0,
    completed: 0,
    pending: 0
  })
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      
      // Fetch manager's assigned assessments
      const assessmentsRes: any = await api.manager.getAssessments()
      const assessments = assessmentsRes.data.assessments || []
      
      const completed = assessments.filter((a: any) => a.status === 'Completed')
      const pending = assessments.filter((a: any) => a.status === 'Scheduled')
      
      const totalScore = completed.reduce((sum: number, a: any) => sum + (a.score || 0), 0)
      const avgScore = completed.length > 0 ? Math.round(totalScore / completed.length) : 0
      
      setStats({
        totalAssessments: assessments.length,
        avgScore,
        completed: completed.length,
        pending: pending.length
      })
      
      setLoading(false)
    } catch (error) {
      console.error('Failed to load profile data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold dark:text-white">Profile</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your personal information and view your performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="container-card p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Personal Information</h2>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-semibold dark:text-white">{user?.name || 'Manager'}</h3>
              <p className="text-slate-500 dark:text-slate-400">Senior Automation Trainer</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm dark:text-slate-300">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span>{user?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm dark:text-slate-300">
              <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center gap-3 text-sm dark:text-slate-300">
              <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span>New York, NY</span>
            </div>
          </div>
          
          {/* Change Password Button */}
          <button
            onClick={() => setShowPasswordModal(true)}
            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
          >
            <Lock className="w-4 h-4" />
            Change Password
          </button>
        </div>

        {/* Statistics Overview - Enhanced Dark Mode */}
        <div className="container-card p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Statistics Overview</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 shadow-sm">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalAssessments}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Total Assessments</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/30 shadow-sm">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.avgScore}%</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Average Score</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800/30 shadow-sm">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.completed}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Completed</p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800/30 shadow-sm">
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary - Enhanced Dark Mode */}
      <div className="container-card p-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Performance Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800/30 shadow-sm">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 font-medium">Assessments Managed</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalAssessments}</p>
          </div>
          <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800/30 shadow-sm">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 font-medium">Completion Rate</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.totalAssessments > 0 ? Math.round((stats.completed / stats.totalAssessments) * 100) : 0}%
            </p>
          </div>
          <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800/30 shadow-sm">
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 font-medium">Average Score Given</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.avgScore}%</p>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Shield, Users, BookOpen, CheckCircle, Lock } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { api } from '@/lib/api'
import ChangePasswordModal from '@/components/ChangePasswordModal'

export default function AdminProfile() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalAssessments: 0,
    completedAssessments: 0
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
      
      // Fetch admin statistics
      const [usersRes, coursesRes, assessmentsRes]: any[] = await Promise.all([
        api.admin.getUsers(),
        api.admin.getCourses(),
        api.admin.getAssessments()
      ])
      
      const users = usersRes.data.users || []
      const courses = coursesRes.data.courses || []
      const assessments = assessmentsRes.data.assessments || []
      
      setStats({
        totalUsers: users.length,
        totalCourses: courses.length,
        totalAssessments: assessments.length,
        completedAssessments: assessments.filter((a: any) => a.status === 'Completed').length
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
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your personal information and view system statistics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info */}
        <div className="lg:col-span-1 container-card p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Personal Information</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-medium">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <p className="font-semibold dark:text-white">{user?.name || 'Admin User'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">System Administrator</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span>{user?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span>{user?.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span>{user?.department || 'Administration'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Shield className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span className="badge-red">Admin</span>
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

        {/* System Statistics - Enhanced Dark Mode */}
        <div className="lg:col-span-2 container-card p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">System Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-slate-600 dark:text-slate-300">Total Users</p>
              </div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalUsers}</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/30 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-slate-600 dark:text-slate-300">Total Courses</p>
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalCourses}</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800/30 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <p className="text-sm text-slate-600 dark:text-slate-300">Total Assessments</p>
              </div>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalAssessments}</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800/30 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <p className="text-sm text-slate-600 dark:text-slate-300">Completed</p>
              </div>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.completedAssessments}</p>
            </div>
          </div>
          
          {/* System Health - Enhanced Dark Mode with Better Contrast */}
          <div className="mt-6 p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 shadow-md">
            <h3 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">System Health</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-2 rounded-lg bg-white/50 dark:bg-slate-700/50">
                <span className="text-slate-600 dark:text-slate-200">Completion Rate</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {stats.totalAssessments > 0 
                    ? Math.round((stats.completedAssessments / stats.totalAssessments) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white/50 dark:bg-slate-700/50">
                <span className="text-slate-600 dark:text-slate-200">Active Users</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white/50 dark:bg-slate-700/50">
                <span className="text-slate-600 dark:text-slate-200">Available Courses</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{stats.totalCourses}</span>
              </div>
            </div>
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

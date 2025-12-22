'use client'
import { useState, useEffect } from 'react'
import StatCard from '@/components/StatCard'
import { Users, BookOpen, CheckCircle, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { api } from '@/lib/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    assessments: 0,
    completedAssessments: 0,
    trainers: 0,
    managers: 0,
    admins: 0
  })
  const [roleData, setRoleData] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${diffDays} days ago`
  }

  const loadData = async () => {
    try {
      const [usersRes, coursesRes, assessmentsRes]: any[] = await Promise.all([
        api.admin.getUsers(),
        api.admin.getCourses(),
        api.admin.getAssessments()
      ])

      const users = usersRes.data.users || []
      const courses = coursesRes.data.courses || []
      const assessments = assessmentsRes.data.assessments || []
      
      const completed = assessments.filter((a: any) => a.status === 'Completed').length
      const trainers = users.filter((u: any) => u.role === 'trainer').length
      const managers = users.filter((u: any) => u.role === 'manager').length
      const admins = users.filter((u: any) => u.role === 'admin').length

      setStats({
        users: users.length,
        courses: courses.length,
        assessments: assessments.length,
        completedAssessments: completed,
        trainers,
        managers,
        admins
      })

      setRoleData([
        { name: 'Trainers', value: trainers, color: '#3b82f6' },
        { name: 'Managers', value: managers, color: '#8b5cf6' },
        { name: 'Admins', value: admins, color: '#ef4444' },
      ])

      // Generate recent activities from real assessment data
      const activities = assessments
        .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
        .slice(0, 4)
        .map(assessment => {
          const userName = assessment.trainer?.name || 'Unknown User'
          const nameParts = userName.split(' ')
          const initials = nameParts.length >= 2 
            ? nameParts[0].charAt(0) + nameParts[1].charAt(0)
            : userName.charAt(0)
          
          return {
            name: userName,
            initials: initials.toUpperCase(),
            action: assessment.status === 'Completed' ? 'completed assessment' : 'scheduled assessment',
            course: assessment.course?.name || 'Unknown Course',
            time: getTimeAgo(assessment.scheduled_date),
            status: assessment.status
          }
        })

      setRecentActivities(activities)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error)
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
        <h1 className="text-2xl font-semibold dark:text-white">Admin Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">System overview and management</p>
      </div>

      {/* Stats - Dynamic Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.users} icon={Users} color="text-blue-600" />
        <StatCard title="Courses" value={stats.courses} icon={BookOpen} color="text-green-600" />
        <StatCard title="Assessments" value={stats.assessments} icon={CheckCircle} color="text-purple-600" />
        <StatCard title="Completed" value={stats.completedAssessments} icon={TrendingUp} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution - Dynamic Data */}
        <div className="container-card p-6">
          <h2 className="text-lg font-semibold mb-4">User Distribution by Role</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity - Matching Manager Dashboard Style */}
      <div className="container-card p-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No recent activities</p>
          ) : (
            recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                {/* Avatar with initials - Fixed dark mode visibility */}
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {activity.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm dark:text-white truncate">
                    <span className="text-slate-900 dark:text-white">{activity.name}</span> {activity.action} <span className="font-medium">{activity.course}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activity.time}</p>
                </div>
                <span className={`badge flex-shrink-0 ${
                  activity.status === 'Completed' ? 'badge-green' :
                  activity.status === 'Scheduled' ? 'badge-yellow' :
                  'badge-blue'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, CheckCircle, Clock, TrendingUp, Download, Filter, Calendar, Search, UserPlus, BarChart3, Eye } from 'lucide-react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getCurrentUser } from '@/lib/auth'
import { api } from '@/lib/api'

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']

export default function ManagerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [trainers, setTrainers] = useState<any[]>([])
  const [assessments, setAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Calculated data from database
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [courseDistribution, setCourseDistribution] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [topPerformers, setTopPerformers] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalTrainers: 0,
    activeAssessments: 0,
    avgPerformance: 0,
    completionRate: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      
      // Fetch all data from database
      const [trainersRes, assessmentsRes]: any[] = await Promise.all([
        api.manager.trainers(),
        api.manager.getAssessments()
      ])
      
      const trainersData = trainersRes.data.trainers || []
      const assessmentsData = assessmentsRes.data.assessments || []
      
      setTrainers(trainersData)
      setAssessments(assessmentsData)
      
      // Calculate stats
      calculateStats(trainersData, assessmentsData)
      
      // Generate charts data
      generatePerformanceData(assessmentsData)
      generateCourseDistribution(assessmentsData)
      generateRecentActivities(assessmentsData)
      generateTopPerformers(assessmentsData)
      
      setLoading(false)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setLoading(false)
    }
  }
  
  const calculateStats = (trainersData: any[], assessmentsData: any[]) => {
    const completedAssessments = assessmentsData.filter(a => a.status === 'Completed')
    const totalScore = completedAssessments.reduce((sum, a) => sum + (a.score || 0), 0)
    const avgScore = completedAssessments.length > 0 ? totalScore / completedAssessments.length : 0
    const completionRate = assessmentsData.length > 0 
      ? (completedAssessments.length / assessmentsData.length) * 100 
      : 0
    
    setStats({
      totalTrainers: trainersData.length,
      activeAssessments: assessmentsData.filter(a => a.status === 'Scheduled').length,
      avgPerformance: Math.round(avgScore * 10) / 10,
      completionRate: Math.round(completionRate)
    })
  }
  
  const generatePerformanceData = (assessmentsData: any[]) => {
    // Group by trainer and calculate average score
    const trainerScores: any = {}
    assessmentsData.forEach(assessment => {
      if (assessment.trainer && assessment.score) {
        const trainerName = assessment.trainer.name.split(' ')[0] + ' ' + assessment.trainer.name.split(' ')[1]?.charAt(0) + '.'
        if (!trainerScores[trainerName]) {
          trainerScores[trainerName] = { total: 0, count: 0 }
        }
        trainerScores[trainerName].total += assessment.score
        trainerScores[trainerName].count += 1
      }
    })
    
    const chartData = Object.keys(trainerScores).map(trainer => ({
      trainer,
      score: Math.round(trainerScores[trainer].total / trainerScores[trainer].count)
    })).slice(0, 5)
    
    setPerformanceData(chartData)
  }
  
  const generateCourseDistribution = (assessmentsData: any[]) => {
    const courseCounts: any = {}
    assessmentsData.forEach(assessment => {
      if (assessment.course) {
        const courseName = assessment.course.name
        courseCounts[courseName] = (courseCounts[courseName] || 0) + 1
      }
    })
    
    const chartData = Object.keys(courseCounts).map(name => ({
      name,
      value: courseCounts[name]
    }))
    
    setCourseDistribution(chartData)
  }
  
  const generateRecentActivities = (assessmentsData: any[]) => {
    const activities = assessmentsData
      .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
      .slice(0, 4)
      .map(assessment => {
        const trainerName = assessment.trainer?.name || 'Unknown'
        const nameParts = trainerName.split(' ')
        const initials = nameParts.length >= 2 
          ? nameParts[0].charAt(0) + nameParts[1].charAt(0)
          : trainerName.charAt(0)
        
        return {
          name: trainerName,
          initials: initials.toUpperCase(),
          action: `${assessment.status === 'Completed' ? 'completed assessment' : 'scheduled assessment'} ${assessment.course?.name || ''}`,
          time: getTimeAgo(assessment.scheduled_date),
          status: assessment.status
        }
      })
    
    setRecentActivities(activities)
  }
  
  const generateTopPerformers = (assessmentsData: any[]) => {
    const trainerPerformance: any = {}
    
    assessmentsData.forEach(assessment => {
      if (assessment.trainer && assessment.status === 'Completed' && assessment.score) {
        const trainerId = assessment.trainer.id
        if (!trainerPerformance[trainerId]) {
          trainerPerformance[trainerId] = {
            name: assessment.trainer.name,
            totalScore: 0,
            count: 0
          }
        }
        trainerPerformance[trainerId].totalScore += assessment.score
        trainerPerformance[trainerId].count += 1
      }
    })
    
    const performers = Object.values(trainerPerformance)
      .map((p: any) => ({
        name: p.name,
        score: Math.round(p.totalScore / p.count),
        assessments: p.count
      }))
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 4)
    
    setTopPerformers(performers)
  }
  
  const getTimeAgo = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return 'Just now'
  }
  
  const exportReport = () => {
    // Create CSV content
    const headers = ['Metric', 'Value']
    const rows = [
      ['Total Trainers', stats.totalTrainers],
      ['Active Assessments', stats.activeAssessments],
      ['Average Performance', `${stats.avgPerformance}%`],
      ['Completion Rate', `${stats.completionRate}%`],
      ['', ''],
      ['Top Performers', ''],
      ...topPerformers.map((p, i) => [`${i + 1}. ${p.name}`, `${p.score}% (${p.assessments} assessments)`])
    ]
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `manager-dashboard-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
          <p className="text-slate-500 text-sm">Manage trainers, track performance, and oversee assessments</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-slate-300 rounded-md flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button 
            onClick={exportReport}
            className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2 hover:bg-red-600"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Enhanced Stats Cards - Dynamic Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm opacity-90">Total Trainers</p>
              <p className="text-3xl font-bold">{stats.totalTrainers}</p>
              <p className="text-xs opacity-75 mt-1">From database</p>
            </div>
            <Users className="w-12 h-12 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm opacity-90">Active Assessments</p>
              <p className="text-3xl font-bold">{stats.activeAssessments}</p>
              <p className="text-xs opacity-75 mt-1">Scheduled</p>
            </div>
            <Calendar className="w-12 h-12 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm opacity-90">Avg Performance</p>
              <p className="text-3xl font-bold">{stats.avgPerformance}%</p>
              <p className="text-xs opacity-75 mt-1">Calculated from scores</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm opacity-90">Completion Rate</p>
              <p className="text-3xl font-bold">{stats.completionRate}%</p>
              <p className="text-xs opacity-75 mt-1">Real-time data</p>
            </div>
            <CheckCircle className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="container-card p-6">
          <h2 className="text-lg font-semibold mb-4">Trainer Performance Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="trainer" stroke="#64748b" />
              <YAxis stroke="#64748b" domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Course Distribution */}
        <div className="container-card p-6">
          <h2 className="text-lg font-semibold mb-4">Course Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={courseDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {courseDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="container-card p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Recent Activities</h2>
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
                      <span className="text-slate-900 dark:text-white">{activity.name}</span> {activity.action}
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

        {/* Quick Actions */}
        <div className="container-card p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Quick Actions</h2>
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/manager/trainers')}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg flex items-center justify-center gap-2 hover:from-purple-600 hover:to-purple-700 transition-all"
            >
              <Search className="w-5 h-5" />
              Search Trainers
            </button>
            <button 
              onClick={() => router.push('/manager/feedback')}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center gap-2 hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              <UserPlus className="w-5 h-5" />
              Assign Assessment
            </button>
            <button 
              onClick={() => router.push('/manager/performance')}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg flex items-center justify-center gap-2 hover:from-green-600 hover:to-green-700 transition-all"
            >
              <BarChart3 className="w-5 h-5" />
              View Performance
            </button>
            <button 
              onClick={() => router.push('/manager/feedback')}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              <Calendar className="w-5 h-5" />
              Schedule Review
            </button>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="container-card p-6">
        <h2 className="text-lg font-semibold mb-4">Top Performers This Month</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {topPerformers.map((performer, index) => (
            <div key={index} className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-yellow-500">#{index + 1}</span>
              </div>
              <p className="font-semibold mb-1">{performer.name}</p>
              <p className="text-3xl font-bold text-primary mb-1">{performer.score}%</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{performer.assessments} assessments completed</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

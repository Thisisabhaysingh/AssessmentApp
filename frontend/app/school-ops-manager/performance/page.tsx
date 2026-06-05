'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, Users, Calendar, BarChart3, CheckCircle, Clock, TrendingUp, MessageSquare, Award, Download } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'
import StatCard from '@/components/StatCard'

const performanceTrends = [
  { month: 'Jan', trainer1: 75, trainer2: 80 },
  { month: 'Feb', trainer1: 80, trainer2: 82 },
  { month: 'Mar', trainer1: 95, trainer2: 88 },
  { month: 'Apr', trainer1: 90, trainer2: 92 },
  { month: 'May', trainer1: 98, trainer2: 95 },
]

interface PerformanceData {
  trainerId: number
  trainerName: string
  totalAssessments: number
  completedAssessments: number
  averageScore: number
  totalScore: number
  assessments: Array<{
    id: number
    title: string
    status: string
    completedAt: string
    score: number | null
    hasSchoolOpsFeedback: boolean
    feedbackCount?: number
  }>
}

export default function SchoolOpsManagerPerformance() {
  const router = useRouter()
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [trainers, setTrainers] = useState<any[]>([])
  const [trainersWithStats, setTrainersWithStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [trainerFilter, setTrainerFilter] = useState('')
  const [selectedTrainer, setSelectedTrainer] = useState<PerformanceData | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'my-performance' | 'trainer-performance'>('my-performance')

  useEffect(() => {
    if (activeTab === 'my-performance') {
      loadPerformanceData()
    } else {
      loadTrainerPerformance()
    }
  }, [activeTab])

  const loadTrainerPerformance = async () => {
    try {
      const [trainersRes, assessmentsRes]: any[] = await Promise.all([
        api.get('/school-ops-manager/trainers'),
        api.get('/school-ops-manager/assessments')
      ])
      
      const trainersData = trainersRes.data || []
      const assessmentsData = assessmentsRes.data || []
      
      // Calculate stats for each trainer
      const trainersWithData = trainersData.map((trainer: any) => {
        const trainerAssessments = assessmentsData.filter(
          (a: any) => a.trainer_id === trainer.id
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
        
        // Get recent feedback
        const recentFeedback = trainerAssessments
          .filter((a: any) => a.feedbacks && a.feedbacks.length > 0)
          .sort((a: any, b: any) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
          [0]?.feedbacks[0]?.feedback_text || 'No feedback available'
        
        return {
          ...trainer,
          totalAssessments: trainerAssessments.length,
          completedAssessments: completedAssessments.length,
          avgScore,
          courses,
          recentFeedback
        }
      })
      
      setTrainers(trainersData)
      setTrainersWithStats(trainersWithData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load trainers:', error)
      setLoading(false)
    }
  }

  const loadPerformanceData = async () => {
    try {
      const response = await api.get('/school-ops-manager/performance')
      if (response.success && Array.isArray(response.data)) {
        setPerformanceData(response.data)
      } else {
        setPerformanceData([])
      }
    } catch (error) {
      console.error('Failed to load performance data:', error)
      setPerformanceData([])
    } finally {
      setLoading(false)
    }
  }

  const filteredData = Array.isArray(performanceData) ? performanceData.filter(data => {
    const matchesSearch = 
      (data.trainerName && data.trainerName.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesTrainer = !trainerFilter || data.trainerId.toString() === trainerFilter
    
    return matchesSearch && matchesTrainer
  }) : []

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 80) return 'text-blue-600 dark:text-blue-400'
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getPassRateColor = (rate: number) => {
    if (rate >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    if (rate >= 80) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    if (rate >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }

  const handleViewDetails = (data: PerformanceData) => {
    setSelectedTrainer(data)
    setShowDetailsModal(true)
  }

  const handleTrainerViewDetails = (trainerId: number) => {
    // Navigate to trainer details page or trainer profile
    router.push(`/school-ops-manager/trainers/${trainerId}`)
  }

  const exportReport = () => {
    const currentData = activeTab === 'my-performance' ? performanceData : trainersWithStats
    const headers = activeTab === 'my-performance' 
      ? ['Trainer Name', 'Total Assessments', 'Completed', 'Average Score', 'School Ops Feedback']
      : ['Trainer Name', 'Email', 'Total Assessments', 'Completed', 'Average Score', 'Courses']
    
    const rows = currentData.map((t: any) => {
      if (activeTab === 'my-performance') {
        return [
          t.trainerName,
          t.totalAssessments,
          t.completedAssessments,
          `${t.averageScore || 0}%`,
          t.assessments.filter((a: any) => a.hasSchoolOpsFeedback).length
        ]
      } else {
        return [
          t.name,
          t.email,
          t.totalAssessments,
          t.completedAssessments,
          `${t.avgScore}%`,
          t.courses.join('; ')
        ]
      }
    })
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}-performance-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-6 w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Performance Reports
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {activeTab === 'my-performance' 
                ? 'Performance insights for assessments assigned to you'
                : 'Trainer performance analytics and insights'
              }
            </p>
          </div>
          <button 
            onClick={exportReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my-performance')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-performance'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              My Performance
            </button>
            <button
              onClick={() => setActiveTab('trainer-performance')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'trainer-performance'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Trainer Performance
            </button>
          </nav>
        </div>
      </div>

      {/* Summary Cards - School Ops Specific Metrics */}
      {activeTab === 'my-performance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Assigned</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {performanceData.reduce((sum, data) => sum + data.totalAssessments, 0)}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Assessments to You
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Completed</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {performanceData.reduce((sum, data) => sum + data.completedAssessments, 0)}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Completed Assessments
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Your Feedback</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {performanceData.reduce((sum, data) => sum + data.assessments.filter(a => a.hasSchoolOpsFeedback).length, 0)}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Feedback Provided
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <BarChart3 className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Coverage</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {(() => {
                const totalAssigned = performanceData.reduce((sum, data) => sum + data.completedAssessments, 0);
                const totalFeedback = performanceData.reduce((sum, data) => sum + data.assessments.filter(a => a.hasSchoolOpsFeedback).length, 0);
                return totalAssigned > 0 ? Math.round((totalFeedback / totalAssigned) * 100) : 0;
              })()}%
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Feedback Coverage
            </div>
          </div>
        </div>
      )}

      {/* Trainer Performance Summary */}
      {activeTab === 'trainer-performance' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <StatCard title="Total Trainers" value={trainersWithStats.length} icon={Users} color="text-blue-600" />
            <StatCard 
              title="Avg Performance" 
              value={`${trainersWithStats.length > 0 ? Math.round(trainersWithStats.reduce((sum, t) => sum + t.avgScore, 0) / trainersWithStats.length) : 0}%`} 
              icon={Award} 
              color="text-green-600" 
            />
            <StatCard 
              title="Total Assessments" 
              value={trainersWithStats.reduce((sum, t) => sum + t.totalAssessments, 0)} 
              icon={TrendingUp} 
              color="text-purple-600" 
            />
            <StatCard 
              title="Completed" 
              value={trainersWithStats.reduce((sum, t) => sum + t.completedAssessments, 0)} 
              icon={Award} 
              color="text-orange-600" 
            />
          </div>

          {/* Performance Trends Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 mb-12">
            <h2 className="text-lg font-semibold mb-6">Performance Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line type="monotone" dataKey="trainer1" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="trainer2" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Trainer Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trainersWithStats.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-slate-500">
                No trainers found
              </div>
            ) : (
              trainersWithStats.slice(0, 3).map((trainer) => (
                <div key={trainer.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8">
                  <h3 className="text-lg font-semibold mb-6">{trainer.name}</h3>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Total Assessments</p>
                      <p className="text-2xl font-bold">{trainer.totalAssessments}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Average Score</p>
                      <p className="text-2xl font-bold text-green-600">{trainer.avgScore}%</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-xs text-slate-500 mb-3">Courses</p>
                    <div className="flex flex-wrap gap-3">
                      {trainer.courses.slice(0, 2).map((course: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                          {course}
                        </span>
                      ))}
                      {trainer.courses.length > 2 && (
                        <button 
                          onClick={() => handleTrainerViewDetails(trainer.id)}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm cursor-pointer hover:underline transition-colors"
                        >
                          +{trainer.courses.length - 2} more
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-xs text-slate-500 mb-2">Recent Feedback</p>
                    <p className="text-sm text-slate-700 italic">{trainer.recentFeedback}</p>
                  </div>

                  <button 
                    onClick={() => handleTrainerViewDetails(trainer.id)}
                    className="w-full py-3 border border-slate-300 dark:border-slate-600 rounded-md text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors hover:text-black dark:hover:text-white"
                  >
                    View Details
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Filters - Only for My Performance */}
      {activeTab === 'my-performance' && (
        <div className="mb-8 flex flex-col sm:flex-row gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search trainers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={trainerFilter}
              onChange={(e) => setTrainerFilter(e.target.value)}
              className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Trainers</option>
              {performanceData.map((data) => (
                <option key={data.trainerId.toString()} value={data.trainerId.toString()}>
                  {data.trainerName}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Performance Table - My Performance */}
      {activeTab === 'my-performance' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Trainer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Assessments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Average Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    School Ops Feedback
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredData.map((data) => {
                  const completionRate = data.totalAssessments > 0 ? (data.completedAssessments / data.totalAssessments * 100).toFixed(1) : '0'
                  const schoolOpsFeedbackCount = data.assessments.filter(a => a.hasSchoolOpsFeedback).length
                  
                  return (
                    <tr key={data.trainerId.toString()} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {data.trainerName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                        {data.totalAssessments}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                        {data.completedAssessments}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`text-sm font-medium ${getScoreColor(parseFloat(data.averageScore || 0))}`}>
                            {data.averageScore || 'N/A'}%
                          </div>
                          {data.assessments.some(a => a.hasSchoolOpsFeedback && a.score !== null) && (
                            <div className="group relative">
                              <div className="w-2 h-2 bg-blue-500 rounded-full cursor-help" title="Includes School Ops Feedback"></div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                Includes School Ops Feedback
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPassRateColor(parseFloat(completionRate))}`}>
                          {completionRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-900 dark:text-white">
                            {schoolOpsFeedbackCount}/{data.completedAssessments}
                          </span>
                          {schoolOpsFeedbackCount === data.completedAssessments && data.completedAssessments > 0 && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewDetails(data)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No performance data found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchTerm || trainerFilter ? 'Try adjusting your filters' : 'No assessment data available yet'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedTrainer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Performance Details - {selectedTrainer.trainerName}
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {selectedTrainer.totalAssessments}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Total Assessments
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {selectedTrainer.completedAssessments}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Completed
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                    <div className={`text-2xl font-bold ${getScoreColor(parseFloat(selectedTrainer.averageScore || 0))}`}>
                      {selectedTrainer.averageScore || 'N/A'}%
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Average Score
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {selectedTrainer.assessments.filter(a => a.hasSchoolOpsFeedback).length}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      School Ops Feedback
                    </div>
                  </div>
                </div>

                {/* Recent Assessments */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Recent Assessments</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedTrainer.assessments.length > 0 ? (
                      selectedTrainer.assessments.map((assessment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded">
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {assessment.title}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {new Date(assessment.completedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            {assessment.score !== null && (
                              <div className={`text-sm font-medium ${getScoreColor(assessment.score)}`}>
                                {assessment.score}%
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <span>{assessment.status}</span>
                              {assessment.hasSchoolOpsFeedback && (
                                <MessageSquare className="w-3 h-3 text-blue-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-600 dark:text-slate-400">No assessments found</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedTrainer(null)
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

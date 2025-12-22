'use client'
import { useState, useEffect } from 'react'
import { Download, Users, TrendingUp, Award } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'

const performanceTrends = [
  { month: 'Jan', trainer1: 75, trainer2: 80 },
  { month: 'Feb', trainer1: 80, trainer2: 82 },
  { month: 'Mar', trainer1: 95, trainer2: 88 },
  { month: 'Apr', trainer1: 90, trainer2: 92 },
  { month: 'May', trainer1: 98, trainer2: 95 },
]

export default function TrainerPerformance() {
  const [trainers, setTrainers] = useState<any[]>([])
  const [trainersWithStats, setTrainersWithStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrainers()
  }, [])

  const loadTrainers = async () => {
    try {
      const [trainersRes, assessmentsRes]: any[] = await Promise.all([
        api.manager.trainers(),
        api.manager.getAssessments()
      ])
      
      const trainersData = trainersRes.data.trainers || []
      const assessmentsData = assessmentsRes.data.assessments || []
      
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
  
  const exportReport = () => {
    // Create CSV content
    const headers = ['Trainer Name', 'Email', 'Total Assessments', 'Completed', 'Average Score', 'Courses']
    const rows = trainersWithStats.map(t => [
      t.name,
      t.email,
      t.totalAssessments,
      t.completedAssessments,
      `${t.avgScore}%`,
      t.courses.join('; ')
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trainer-performance-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Trainer Performance</h1>
          <p className="text-slate-500 text-sm">Analyze trainer performance and track progress over time.</p>
        </div>
        <button 
          onClick={exportReport}
          className="px-4 py-2 bg-primary text-white rounded-md flex items-center gap-2 hover:bg-red-600"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      <div className="container-card p-6">
        <h2 className="text-lg font-semibold mb-4">Performance Trends</h2>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trainersWithStats.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-slate-500">
            No trainers found
          </div>
        ) : (
          trainersWithStats.slice(0, 3).map((trainer) => (
            <div key={trainer.id} className="container-card p-6">
              <h3 className="text-lg font-semibold mb-4">{trainer.name}</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Total Assessments</p>
                  <p className="text-2xl font-bold">{trainer.totalAssessments}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Average Score</p>
                  <p className="text-2xl font-bold text-green-600">{trainer.avgScore}%</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">Courses</p>
                <div className="flex flex-wrap gap-2">
                  {trainer.courses.length > 0 ? (
                    trainer.courses.map((course: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {course}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">No courses</span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-1">Recent Feedback</p>
                <p className="text-sm text-slate-700 italic">{trainer.recentFeedback}</p>
              </div>

              <button className="w-full py-2 border border-slate-300 rounded-md text-sm hover:bg-slate-50">
                View Details
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

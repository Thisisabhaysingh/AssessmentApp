'use client'
import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
import { api } from '@/lib/api'

export default function TrainerSearch() {
  const [trainers, setTrainers] = useState<any[]>([])
  const [trainersWithStats, setTrainersWithStats] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrainers()
  }, [])

  const loadTrainers = async () => {
    try {
      // Fetch trainers and assessments (managers can access these)
      const [trainersRes, assessmentsRes]: any[] = await Promise.all([
        api.manager.trainers(),
        api.manager.getAssessments()
      ])
      
      const trainersData = trainersRes.data.trainers || []
      const assessmentsData = assessmentsRes.data.assessments || []
      
      // Extract unique courses from assessments
      const uniqueCourses = Array.from(
        new Set(assessmentsData.map((a: any) => a.course?.name).filter(Boolean))
      ).map((name, index) => ({ id: index, name }))
      
      setCourses(uniqueCourses)
      
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
          ? Math.round(totalScore / completedAssessments.length) 
          : 0
        
        const lastCourse = trainerAssessments.length > 0
          ? trainerAssessments.sort((a: any, b: any) => 
              new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
            )[0]?.course?.name
          : null
        
        return {
          ...trainer,
          totalAssessments: trainerAssessments.length,
          completedAssessments: completedAssessments.length,
          avgScore,
          lastCourse,
          status: trainerAssessments.length > 0 ? 'active' : 'inactive'
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

  // Apply all filters
  const filteredTrainers = trainersWithStats.filter(trainer => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      trainer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.email?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || trainer.status === statusFilter
    
    // Course filter - check if trainer has taken this course
    const matchesCourse = courseFilter === 'all' || 
      trainer.lastCourse?.toLowerCase().includes(courseFilter.toLowerCase())
    
    return matchesSearch && matchesStatus && matchesCourse
  })

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading trainers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Trainer Management</h1>
        <p className="text-slate-500 text-sm">Search and view trainer information</p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trainers by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-md flex items-center gap-2 hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-900"
        >
          <option value="all">All Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.name}>
              {course.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-md flex items-center gap-2 hover:bg-slate-50 cursor-pointer dark:hover:bg-slate-900"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <p className="text-sm text-slate-600">Showing {filteredTrainers.length} of {trainersWithStats.length} trainers</p>

      {/* Trainers Table */}
      <div className="container-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200">
              <tr className="text-left">
                <th className="pb-3 font-medium text-slate-600">Trainer</th>
                <th className="pb-3 font-medium text-slate-600">Assessments</th>
                <th className="pb-3 font-medium text-slate-600">Avg Score</th>
                <th className="pb-3 font-medium text-slate-600">Last Course</th>
                <th className="pb-3 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrainers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No trainers found
                  </td>
                </tr>
              ) : (
                filteredTrainers.map((trainer) => (
                  <tr key={trainer.id} className="border-b border-slate-100">
                    <td className="py-4">
                      <div>
                        <p className="font-medium">{trainer.name}</p>
                        <p className="text-xs text-slate-500">{trainer.email}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div>
                        <p className="font-medium">{trainer.completedAssessments}/{trainer.totalAssessments}</p>
                        <p className="text-xs text-slate-500">{trainer.totalAssessments} total assessments</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <p className="font-medium">{trainer.avgScore > 0 ? `${trainer.avgScore}%` : '-'}</p>
                    </td>
                    <td className="py-4">
                      <p className="text-sm">{trainer.lastCourse || '-'}</p>
                    </td>
                    <td className="py-4">
                      <span className={trainer.status === 'active' ? 'badge-green' : 'badge bg-slate-100 text-slate-700 dark:hover:bg-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-slate-200'}>
                        {trainer.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

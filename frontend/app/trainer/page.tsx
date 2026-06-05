'use client'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import StatCard from '@/components/StatCard'
import { Calendar, Users, Award, TrendingUp, Star, Target, CheckCircle, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { getSystemSettings } from '@/lib/settings'

export default function TrainerDashboard() {
  const [user, setUser] = useState<any>(null)
  const [assessments, setAssessments] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0,
    avgScore: 0,
    avgCombinedScore: 0,
    completed: 0,
    pending: 0,
    passRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>({ passingPercentage: 60, totalMarks: 60 })
  const [levelData, setLevelData] = useState<any>(null)

  useEffect(() => {
    loadData()
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('⏰ Dashboard loading timeout - forcing load complete')
      setLoading(false)
    }, 15000) // 15 seconds timeout
    
    return () => clearTimeout(timeout)
  }, [])

  const loadData = async () => {
    try {
      console.log('🔄 Loading trainer dashboard data...')
      
      // Test backend connectivity first
      try {
        const testResponse = await fetch('http://localhost:4000/api/public/evaluations')
        console.log('🔍 Backend connectivity test:', testResponse.status)
      } catch (connectivityError) {
        console.error('❌ Backend connectivity failed:', connectivityError)
        setLoading(false)
        return
      }
      
      // Add individual timeouts for each API call
      const apiCallWithTimeout = async (call: Promise<any>, name: string, timeoutMs: number = 5000) => {
        try {
          console.log(`⏳ Starting ${name} API call...`)
          const result = await Promise.race([
            call,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`${name} API call timeout`)), timeoutMs)
            )
          ])
          console.log(`✅ ${name} API call completed`)
          return { status: 'fulfilled', value: result }
        } catch (error) {
          console.error(`❌ ${name} API call failed:`, error)
          return { status: 'rejected', reason: error }
        }
      }
      
      const [userRes, assessmentsRes, evaluationsRes, levelRes] = await Promise.all([
        apiCallWithTimeout(api.get('/auth/me'), 'User', 3000),
        apiCallWithTimeout(api.trainer.assessments(), 'Assessments', 5000),
        apiCallWithTimeout(api.get('/public/evaluations'), 'Evaluations', 5000),
        apiCallWithTimeout(api.trainerLevel.getMyLevel(), 'Level', 3000)
      ])
      
      console.log('📊 API Results:', {
        user: userRes.status,
        assessments: assessmentsRes.status,
        evaluations: evaluationsRes.status,
        level: levelRes.status
      })
      
      // Handle user data
      if (userRes.status === 'fulfilled') {
        console.log('✅ User data loaded:', (userRes.value as any).data)
        setUser((userRes.value as any).data.user)
      } else {
        console.error('❌ Failed to load user data:', userRes.reason)
      }
      
      // Handle level data
      if (levelRes.status === 'fulfilled') {
        const levelData = (levelRes.value as any).data
        console.log('✅ Level data loaded:', levelData)
        console.log('📊 Level progress data:', levelData.progress)
        console.log('📋 Level progress keys:', levelData.progress ? Object.keys(levelData.progress) : 'No progress data')
        setLevelData(levelData)
      } else {
        console.error('❌ Failed to load level data:', levelRes.reason)
        setLevelData(null)
      }
      
      // Process assessments with evaluations
      const assessmentsData = assessmentsRes.status === 'fulfilled' ? (assessmentsRes.value as any).data?.assessments || [] : []
      const evaluationsData = evaluationsRes.status === 'fulfilled' ? (evaluationsRes.value as any).data || [] : []
      
      console.log('📈 Data counts:', {
        assessments: assessmentsData.length,
        evaluations: evaluationsData.length
      })
      
      console.log('📋 Sample assessment:', assessmentsData[0])
      console.log('📋 Sample evaluation:', evaluationsData[0])
      console.log('📊 Evaluations API response structure:', evaluationsRes.status === 'fulfilled' ? (evaluationsRes.value as any).data : 'Failed')
      
      const assessmentsWithEvaluations = assessmentsData.map((assessment: any) => {
        const assessmentEvaluations = evaluationsData.filter((evaluation: any) => evaluation.assessment_id === assessment.id)
        
        console.log(`🔍 Assessment ${assessment.id}: Found ${assessmentEvaluations.length} evaluations`)
        
        if (assessmentEvaluations.length === 0) {
          return { 
            ...assessment, 
            hasEvaluations: false, 
            combinedScore: 0, 
            percentage: 0,
            schoolOpsScore: 0,
            managerScore: 0,
            schoolOpsEvaluations: [],
            managerEvaluations: []
          }
        }
        
        const schoolOpsEvaluations = assessmentEvaluations.filter((evaluation: any) => evaluation.evaluator_role === 'school_ops_manager')
        const managerEvaluations = assessmentEvaluations.filter((evaluation: any) => evaluation.evaluator_role === 'manager')
        
        console.log(`📊 Assessment ${assessment.id}: School Ops: ${schoolOpsEvaluations.length}, Manager: ${managerEvaluations.length}`)
        
        const schoolOpsScore = schoolOpsEvaluations.reduce((sum: number, evaluation: any) => {
          // Use totalScore field if available, otherwise calculate from individual fields
          let score = 0;
          if (evaluation.totalScore) {
            score = evaluation.totalScore;
          } else {
            // Try individual fields
            const scoreFields = ['abilityToIntegrateSTEM', 'discussesUpToDateInfo', 'hasKnowledgeOfSTEM', 'languageFluency', 'preparationWithLessonPlan', 'provideCourseOutline']
            score = scoreFields.reduce((s: number, field: string) => s + (evaluation[field] || 0), 0);
          }
          console.log(`🔍 School Ops Evaluation ${evaluation.id}:`, { evaluation, score })
          return sum + score
        }, 0)
        
        const managerScore = managerEvaluations.reduce((sum: number, evaluation: any) => {
          // Use totalScore field if available, otherwise calculate from individual fields
          let score = 0;
          if (evaluation.totalScore) {
            score = evaluation.totalScore;
          } else {
            // Try individual fields
            const scoreFields = ['abilityToIntegrateSTEM', 'discussesUpToDateInfo', 'hasKnowledgeOfSTEM', 'languageFluency', 'preparationWithLessonPlan', 'provideCourseOutline']
            score = scoreFields.reduce((s: number, field: string) => s + (evaluation[field] || 0), 0);
          }
          console.log(`🔍 Manager Evaluation ${evaluation.id}:`, { evaluation, score })
          return sum + score
        }, 0)
        
        const combinedScore = schoolOpsScore + managerScore
        const totalMarks = settings.totalMarks || 60
        const percentage = Math.round((combinedScore / totalMarks) * 100)
        
        console.log(`💯 Assessment ${assessment.id} Score Calculation:`, {
          schoolOpsScore,
          managerScore,
          combinedScore,
          totalMarks,
          percentage
        })
        
        return {
          ...assessment,
          hasEvaluations: true,
          combinedScore,
          percentage,
          schoolOpsScore,
          managerScore,
          schoolOpsEvaluations,
          managerEvaluations
        }
      })
      
      setAssessments(assessmentsWithEvaluations)
      
      // Calculate stats based on combined scores
      const completed = assessmentsWithEvaluations.filter((a: any) => a.status === 'Completed')
      const pending = assessmentsWithEvaluations.filter((a: any) => a.status === 'Scheduled')
      const passed = completed.filter((a: any) => a.hasEvaluations && a.percentage >= settings.passingPercentage)
      
      const totalCombinedScore = completed.reduce((sum: number, a: any) => sum + (a.combinedScore || 0), 0)
      const avgCombinedScore = completed.length > 0 ? Math.round(totalCombinedScore / completed.length) : 0
      const avgPercentage = completed.length > 0 ? Math.round((totalCombinedScore / (completed.length * settings.totalMarks)) * 100) : 0
      const passRate = completed.length > 0 ? Math.round((passed.length / completed.length) * 100) : 0
      
      setStats({
        total: assessmentsWithEvaluations.length,
        avgScore: avgPercentage, // Use percentage instead of raw score
        avgCombinedScore, // Add combined score
        completed: completed.length,
        pending: pending.length,
        passRate
      })
      
      // Always set loading to false, even with partial data
      setLoading(false)
      console.log('✅ Dashboard data loading completed - setting loading to false')
      
      // Show warning if some data failed to load
      const failedCalls = [userRes, assessmentsRes, evaluationsRes, levelRes].filter(res => res.status === 'rejected')
      if (failedCalls.length > 0) {
        console.warn(`⚠️ ${failedCalls.length} API calls failed, showing partial data`)
      }
      
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error)
      setLoading(false)
      console.log('❌ Error occurred - setting loading to false')
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
      {console.log('🎨 Rendering dashboard - Loading:', loading, 'User:', !!user, 'Assessments:', assessments.length, 'Level Data:', !!levelData)}
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

      {/* Trainer Level Progress */}
      {levelData && (() => {
        console.log('🎨 Rendering trainer level progress section:', { levelData, progressKeys: Object.keys(levelData.progress || {}) })
        return (
        <div className="container-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
            <Star className="w-5 h-5 text-yellow-500" />
            Trainer Level Progress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Level */}
            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800/30">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-1">
                {levelData.currentLevel || 'L0'}
              </h3>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Current Level
              </p>
              {levelData.levelAchievedDate && (
                <p className="text-xs text-yellow-500 dark:text-yellow-500 mt-2">
                  Achieved: {new Date(levelData.levelAchievedDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Level Progress */}
            {Object.entries(levelData.progress || {}).map(([level, progress]: [string, any]) => {
              console.log(`🎨 Rendering level ${level}:`, progress)
              return (
              <div key={level} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-sm dark:text-white">{progress.levelName}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    progress.qualified 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                  }`}>
                    {progress.qualified ? '✓ Achieved' : 'In Progress'}
                  </span>
                </div>
                
                {/* New Requirements Display */}
                <div className="space-y-2">
                  {/* Total Passed Assessments */}
                  <div className="mb-2">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Total Passed (≥70%): {progress.passedAssessmentsCount} / {progress.requiredTotalAssessments}
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress.totalProgressPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* High Score Assessments */}
                  <div className="mb-2">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      High Scores (≥{progress.minScore}%): {progress.qualifyingAssessmentsCount} / {progress.requiredQualifyingAssessments}
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress.qualifyingProgressPercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Progress Summary */}
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  {progress.qualified ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">✓ Level Achieved!</span>
                  ) : (
                    <span>
                      {Math.min(progress.totalProgressPercent, progress.qualifyingProgressPercent)}% Complete
                    </span>
                  )}
                </div>
              </div>
              )})}
          </div>
        </div>
        )
      })()}

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
                  <th className="pb-3 font-medium text-slate-600">Combined Score</th>
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
                      {assessment.hasEvaluations ? (
                        <div>
                          <span className="font-semibold text-blue-600">{assessment.percentage}%</span>
                          <span className="text-xs text-slate-500 ml-1">({assessment.combinedScore}/{settings.totalMarks})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3">
                      {assessment.hasEvaluations ? (
                        assessment.percentage >= settings.passingPercentage ? (
                          <span className="badge-green">Pass</span>
                        ) : (
                          <span className="badge-red">Fail</span>
                        )
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
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

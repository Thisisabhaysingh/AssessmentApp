'use client'
import { useEffect, useState } from 'react'
import { Users, Search, Calendar, Award, Eye, MessageSquare } from 'lucide-react'
import { api } from '@/lib/api'

interface Trainer {
  id: number
  name: string
  email: string
  department: string
  designation: string
  status: string
  lastLogin: string
  user: {
    id: number
    email: string
    status: string
    lastLogin: string
  }
  assessments?: any[]
  stats?: {
    totalAssessments: number
    completedAssessments: number
    averageScore: string
  }
}

export default function SchoolOpsManagerTrainers() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadTrainers()
  }, [])

  const loadTrainers = async () => {
    try {
      const response = await api.get('/school-ops-manager/trainers')
      if (response.success && Array.isArray(response.data)) {
        setTrainers(response.data)
      } else {
        console.error('Invalid response format:', response)
        setTrainers([])
      }
    } catch (error) {
      console.error('Failed to load trainers:', error)
      setTrainers([])
    } finally {
      setLoading(false)
    }
  }

  const loadTrainerDetails = async (trainerId: number) => {
    try {
      const [trainerResponse, assessmentsResponse] = await Promise.all([
        api.get(`/school-ops-manager/trainers/${trainerId}`),
        api.get('/school-ops-manager/assessments')
      ])
      
      if (trainerResponse.success) {
        const trainer = trainerResponse.data.trainer
        const allAssessments = assessmentsResponse.data || []
        
        // Filter assessments for this specific trainer
        const trainerAssessments = allAssessments.filter(
          (assessment: any) => assessment.trainer_id === trainerId
        )
        
        // Calculate statistics
        const completedAssessments = trainerAssessments.filter(
          (assessment: any) => assessment.status === 'Completed'
        )
        
        const totalScore = completedAssessments.reduce(
          (sum: number, assessment: any) => sum + (assessment.score || 0), 
          0
        )
        
        const averageScore = completedAssessments.length > 0 
          ? Math.round((totalScore / completedAssessments.length) * 10) / 10
          : 0
        
        // Update trainer with calculated stats and assessments
        const trainerWithStats = {
          ...trainer,
          stats: {
            totalAssessments: trainerAssessments.length,
            completedAssessments: completedAssessments.length,
            averageScore: averageScore > 0 ? `${averageScore}%` : 'N/A'
          },
          assessments: trainerAssessments
        }
        
        setSelectedTrainer(trainerWithStats)
        setShowDetails(true)
      }
    } catch (error) {
      console.error('Failed to load trainer details:', error)
    }
  }

  const filteredTrainers = Array.isArray(trainers) ? trainers.filter(trainer =>
    trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trainer.department?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : []

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-6 w-48"></div>
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Trainer Management
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          View and manage trainer profiles and assessment history
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search trainers by name, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Trainers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrainers.map((trainer) => (
          <div
            key={trainer.id}
            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  {trainer.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {trainer.designation}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  {trainer.department}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                trainer.user.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {trainer.user.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                <Users className="w-4 h-4 mr-2" />
                {trainer.email}
              </div>
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="w-4 h-4 mr-2" />
                Last login: {trainer.user.lastLogin ? 
                  new Date(trainer.user.lastLogin).toLocaleDateString() : 
                  'Never'
                }
              </div>
            </div>

            {/* Stats */}
            {trainer.stats && (
              <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {trainer.stats.totalAssessments}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {trainer.stats.completedAssessments}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {trainer.stats.averageScore}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Avg Score</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => loadTrainerDetails(trainer.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
              <button
                onClick={() => window.location.href = `/school-ops-manager/assessments?trainerId=${trainer.id}`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTrainers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            No trainers found
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            {searchTerm ? 'Try adjusting your search terms' : 'No trainers are available in the system'}
          </p>
        </div>
      )}

      {/* Trainer Details Modal */}
      {showDetails && selectedTrainer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {selectedTrainer.name} - Details
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Name</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedTrainer.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedTrainer.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Department</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedTrainer.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Designation</p>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedTrainer.designation}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-4">Assessment Statistics</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Total Assessments</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {selectedTrainer.stats?.totalAssessments || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Completed Assessments</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {selectedTrainer.stats?.completedAssessments || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Average Score</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {selectedTrainer.stats?.averageScore || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Account Status</p>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        selectedTrainer.user.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {selectedTrainer.user.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Assessments */}
              {selectedTrainer.assessments && selectedTrainer.assessments.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-slate-900 dark:text-white mb-4">Recent Assessments</h3>
                  <div className="space-y-3">
                    {selectedTrainer.assessments.slice(0, 5).map((assessment: any) => {
                      const assessmentDate = assessment.scheduled_date || assessment.createdAt || assessment.created_at
                      const formattedDate = assessmentDate ? new Date(assessmentDate).toLocaleDateString() : 'Date not available'
                      
                      return (
                        <div key={assessment.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{assessment.title}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {formattedDate}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            assessment.status === 'completed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : assessment.status === 'scheduled'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {assessment.status}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => window.location.href = `/school-ops-manager/assessments?trainerId=${selectedTrainer.id}`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Schedule Assessment
                </button>
                <button
                  onClick={() => window.location.href = `/school-ops-manager/performance?trainerId=${selectedTrainer.id}`}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Performance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

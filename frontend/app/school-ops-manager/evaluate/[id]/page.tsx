'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'

interface Assessment {
  id: number
  title: string
  trainer: {
    id: number
    name: string
    email: string
  }
  course: {
    id: number
    name: string
  }
  status: string
  scheduled_date: string
}

interface EvaluationParameters {
  timeBasedActivity: number
  studentEngagementIdeas: number
  poisedAndConfident: number
  wellModulatedVoice: number
  pleasingLook: number
}

export default function SchoolOpsEvaluation() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = parseInt(params.id as string)
  
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingEvaluation, setExistingEvaluation] = useState<any>(null)
  const [parameters, setParameters] = useState<EvaluationParameters>({
    timeBasedActivity: 0,
    studentEngagementIdeas: 0,
    poisedAndConfident: 0,
    wellModulatedVoice: 0,
    pleasingLook: 0
  })

  useEffect(() => {
    if (assessmentId) {
      loadAssessmentDetails()
      loadExistingEvaluation()
    }
  }, [assessmentId])

  const loadAssessmentDetails = async () => {
    try {
      const response = await api.get('/school-ops-manager/assessments')
      const assessmentsData = response.data || []
      const assessmentData = assessmentsData.find((a: any) => a.id === assessmentId)
      
      if (assessmentData) {
        setAssessment(assessmentData)
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to load assessment details:', error)
      setLoading(false)
    }
  }

  const loadExistingEvaluation = async () => {
    try {
      const response = await api.get(`/school-ops-manager/evaluations/${assessmentId}`)
      if (response.success && response.data) {
        setExistingEvaluation(response.data)
        setParameters({
          timeBasedActivity: response.data.timeBasedActivity || 0,
          studentEngagementIdeas: response.data.studentEngagementIdeas || 0,
          poisedAndConfident: response.data.poisedAndConfident || 0,
          wellModulatedVoice: response.data.wellModulatedVoice || 0,
          pleasingLook: response.data.pleasingLook || 0
        })
      }
    } catch (error) {
      // No existing evaluation found
      console.log('No existing evaluation found')
    }
  }

  const calculateTotal = () => {
    return Object.values(parameters).reduce((sum, value) => sum + value, 0)
  }

  const calculatePercentage = () => {
    const total = calculateTotal()
    const maxPossible = 25 // School Ops Manager max marks
    return Math.round((total / maxPossible) * 100)
  }

  const handleParameterChange = (param: keyof EvaluationParameters, value: number) => {
    // Ensure value is between 0 and 5
    const clampedValue = Math.min(5, Math.max(0, value))
    setParameters(prev => ({
      ...prev,
      [param]: clampedValue
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const evaluationData = {
        assessmentId,
        ...parameters,
        totalScore: calculateTotal(),
        percentage: calculatePercentage()
      }

      const endpoint = existingEvaluation 
        ? `/school-ops-manager/evaluations/${assessmentId}`
        : '/school-ops-manager/evaluations'
      
      const method = existingEvaluation ? 'put' : 'post'
      
      const response = await api[method](endpoint, evaluationData)
      
      if (response.success) {
        router.push(`/school-ops-manager/assessments/${assessmentId}`)
      } else {
        alert('Failed to save evaluation')
      }
    } catch (error) {
      console.error('Failed to save evaluation:', error)
      alert('Failed to save evaluation')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="p-8">
        <div className="text-center py-8">
          <p className="text-slate-500">Assessment not found</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            School Ops Manager Evaluation
          </h1>
          <p className="text-slate-500 text-sm dark:text-slate-400">
            {assessment.title} - {assessment.trainer.name}
          </p>
        </div>
      </div>

      {/* Assessment Info */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Assessment Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Trainer</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">{assessment.trainer.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Course</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">{assessment.course.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Date</p>
            <p className="font-medium text-slate-900 dark:text-slate-100">
              {new Date(assessment.scheduled_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Evaluation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold mb-6 dark:text-white">Evaluation Parameters (Max 5 marks each)</h2>
          
          <div className="space-y-6">
            {/* Time Based Activity */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-medium text-slate-900 dark:text-white">
                  Time Based Activity
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={parameters.timeBasedActivity}
                    onChange={(e) => handleParameterChange('timeBasedActivity', parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">/ 5</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Evaluate the trainer's ability to manage time effectively during the session and complete activities within the allocated timeframe.
              </p>
            </div>

            {/* Student Engagement Ideas */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-medium text-slate-900 dark:text-white">
                  Student Engagement Ideas
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={parameters.studentEngagementIdeas}
                    onChange={(e) => handleParameterChange('studentEngagementIdeas', parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">/ 5</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Assess the trainer's creativity and effectiveness in engaging students through innovative ideas and interactive methods.
              </p>
            </div>

            {/* Poised & Confident */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-medium text-slate-900 dark:text-white">
                  Poised & Confident
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={parameters.poisedAndConfident}
                    onChange={(e) => handleParameterChange('poisedAndConfident', parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">/ 5</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Evaluate the trainer's confidence, composure, and professional demeanor during the assessment.
              </p>
            </div>

            {/* Well Modulated Voice */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-medium text-slate-900 dark:text-white">
                  Well Modulated Voice
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={parameters.wellModulatedVoice}
                    onChange={(e) => handleParameterChange('wellModulatedVoice', parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">/ 5</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Assess the trainer's voice clarity, modulation, and ability to maintain audience attention through vocal delivery.
              </p>
            </div>

            {/* Pleasing Look */}
            <div className="pb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-medium text-slate-900 dark:text-white">
                  Pleasing Look
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={parameters.pleasingLook}
                    onChange={(e) => handleParameterChange('pleasingLook', parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">/ 5</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Evaluate the trainer's professional appearance, grooming, and overall presentation.
              </p>
            </div>
          </div>
        </div>

        {/* Score Summary */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Score Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Score</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {calculateTotal()}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">out of 25</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Percentage</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {calculatePercentage()}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Status</p>
              <div className="flex items-center justify-center gap-2">
                {calculatePercentage() >= 60 ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 dark:text-green-400 font-medium">Pass</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-600 dark:text-red-400 font-medium">Needs Improvement</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : (existingEvaluation ? 'Update Evaluation' : 'Submit Evaluation')}
          </button>
        </div>
      </form>
    </div>
  )
}

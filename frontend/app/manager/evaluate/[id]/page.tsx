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

interface ManagerEvaluationParameters {
  hasKnowledgeOfSTEM: number
  abilityToIntegrateSTEM: number
  discussesUpToDateInfo: number
  provideCourseOutline: number
  languageFluency: number
  preparationWithLessonPlan: number
}

export default function ManagerEvaluation() {
  console.log('Manager evaluation page component loaded!')
  
  const params = useParams()
  const router = useRouter()
  const assessmentId = parseInt(params.id as string)
  
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingEvaluation, setExistingEvaluation] = useState<any>(null)
  const [parameters, setParameters] = useState<ManagerEvaluationParameters>({
    hasKnowledgeOfSTEM: 0,
    abilityToIntegrateSTEM: 0,
    discussesUpToDateInfo: 0,
    provideCourseOutline: 0,
    languageFluency: 0,
    preparationWithLessonPlan: 0
  })

  useEffect(() => {
    console.log('useEffect running, assessmentId:', assessmentId)
    if (assessmentId) {
      loadAssessmentDetails()
      loadExistingEvaluation()
    }
  }, [assessmentId])

  const loadAssessmentDetails = async () => {
    try {
      const response = await api.get('/manager/assessments')
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
      console.log('Loading evaluation for assessment:', assessmentId)
      const response = await api.get(`/manager/evaluations/${assessmentId}`)
      console.log('API response:', response)
      
      if (response.success && response.data) {
        console.log('Setting parameters from:', response.data)
        setExistingEvaluation(response.data)
        setParameters({
          hasKnowledgeOfSTEM: response.data.hasKnowledgeOfSTEM || 0,
          abilityToIntegrateSTEM: response.data.abilityToIntegrateSTEM || 0,
          discussesUpToDateInfo: response.data.discussesUpToDateInfo || 0,
          provideCourseOutline: response.data.provideCourseOutline || 0,
          languageFluency: response.data.languageFluency || 0,
          preparationWithLessonPlan: response.data.preparationWithLessonPlan || 0
        })
      } else {
        console.log('No evaluation found')
        setExistingEvaluation(null)
      }
    } catch (error) {
      console.error('Error loading evaluation:', error)
      setExistingEvaluation(null)
    }
  }

  const calculateTotal = () => {
    return Object.values(parameters).reduce((sum, value) => sum + value, 0)
  }

  const calculatePercentage = () => {
    const total = calculateTotal()
    const maxPossible = 35 // Manager max marks
    return Math.round((total / maxPossible) * 100)
  }

  const handleParameterChange = (param: keyof ManagerEvaluationParameters, value: number) => {
    // Ensure value is within valid range for each parameter
    const maxValues = {
      hasKnowledgeOfSTEM: 5,
      abilityToIntegrateSTEM: 10,
      discussesUpToDateInfo: 5,
      provideCourseOutline: 5,
      languageFluency: 5,
      preparationWithLessonPlan: 5
    }
    
    const clampedValue = Math.min(maxValues[param], Math.max(0, value))
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
        ? `/manager/evaluations/${assessmentId}`
        : '/manager/evaluations'
      
      const method = existingEvaluation ? 'put' : 'post'
      
      const response = await api[method](endpoint, evaluationData)
      
      if (response.success) {
        router.push(`/manager/assessments/${assessmentId}`)
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
            Manager Evaluation
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
        {/* Simple Debug Info */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <small className="text-blue-800">
            Assessment ID: {assessmentId} | 
            Existing Evaluation: {existingEvaluation ? 'YES' : 'NO'} | 
            First Parameter: {parameters.hasKnowledgeOfSTEM}
          </small>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold mb-6 dark:text-white">Evaluation Parameters</h2>
          
          <div className="space-y-6">
            {/* Has Knowledge of STEM */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-medium text-slate-900 dark:text-white">
                  Has Knowledge of STEM
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={parameters.hasKnowledgeOfSTEM}
                    onChange={(e) => handleParameterChange('hasKnowledgeOfSTEM', parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">/ 5</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Evaluate the trainer's understanding and knowledge of STEM concepts, principles, and methodologies.
              </p>
            </div>

            {/* Ability to integrate STEM with related activities */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-medium text-slate-900 dark:text-white">
                  Ability to integrate STEM with related activities
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={parameters.abilityToIntegrateSTEM}
                    onChange={(e) => handleParameterChange('abilityToIntegrateSTEM', parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">/ 10</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Assess the trainer's capability to integrate STEM concepts with practical activities and real-world applications.
              </p>
            </div>

            {/* Discusses Up-to-date information related to STEM */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-medium text-slate-900 dark:text-white">
                  Discusses Up-to-date information related to STEM
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={parameters.discussesUpToDateInfo}
                    onChange={(e) => handleParameterChange('discussesUpToDateInfo', parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">/ 5</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Evaluate the trainer's awareness and discussion of current trends, research, and developments in STEM fields.
              </p>
            </div>

            {/* Provide Course Outline */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-medium text-slate-900 dark:text-white">
                  Provide Course Outline
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={parameters.provideCourseOutline}
                    onChange={(e) => handleParameterChange('provideCourseOutline', parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">/ 5</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Assess the trainer's ability to provide a clear, structured, and comprehensive course outline.
              </p>
            </div>

            {/* Language Fluency */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-medium text-slate-900 dark:text-white">
                  Language Fluency
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={parameters.languageFluency}
                    onChange={(e) => handleParameterChange('languageFluency', parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">/ 5</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Evaluate the trainer's language proficiency, clarity, and communication skills.
              </p>
            </div>

            {/* Preparation with Lesson Plan / Practicles */}
            <div className="pb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-base font-medium text-slate-900 dark:text-white">
                  Preparation with Lesson Plan / Practicles
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={parameters.preparationWithLessonPlan}
                    onChange={(e) => handleParameterChange('preparationWithLessonPlan', parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">/ 5</span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Assess the trainer's preparation level, including detailed lesson plans and practical materials for the session.
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
              <p className="text-sm text-slate-600 dark:text-slate-400">out of 35</p>
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

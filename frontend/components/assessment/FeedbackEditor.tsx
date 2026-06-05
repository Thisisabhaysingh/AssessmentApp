'use client'
import { useState } from 'react'
import { Edit, Save, X } from 'lucide-react'
import { api } from '@/lib/api'

interface Feedback {
  id: number
  assessment_id: number
  manager_id: number
  feedback_text: string
  score: number
  pass_fail: 'Pass' | 'Fail'
  created_at: string
  manager?: {
    name: string
    email: string
  }
}

interface FeedbackEditorProps {
  feedback: Feedback
  onFeedbackUpdate?: (updatedFeedback: Feedback) => void
  readonly?: boolean
}

export default function FeedbackEditor({ feedback, onFeedbackUpdate, readonly = false }: FeedbackEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    feedback_text: feedback.feedback_text,
    score: feedback.score,
    pass_fail: feedback.pass_fail as 'Pass' | 'Fail'
  })
  const [loading, setLoading] = useState(false)

  const handleEdit = () => {
    setEditData({
      feedback_text: feedback.feedback_text,
      score: feedback.score,
      pass_fail: feedback.pass_fail
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const response: any = await api.manager.editFeedback({
        feedback_id: feedback.id,
        ...editData
      })
      
      const updatedFeedback = { ...feedback, ...editData }
      onFeedbackUpdate?.(updatedFeedback)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({
      feedback_text: feedback.feedback_text,
      score: feedback.score,
      pass_fail: feedback.pass_fail
    })
  }

  if (isEditing) {
    return (
      <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Feedback Text
            </label>
            <textarea
              value={editData.feedback_text}
              onChange={(e) => setEditData({ ...editData, feedback_text: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Enter feedback..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Score
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={editData.score}
                onChange={(e) => setEditData({ ...editData, score: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Score (0-100)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={editData.pass_fail}
                onChange={(e) => setEditData({ ...editData, pass_fail: e.target.value as 'Pass' | 'Fail' })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-100">
            {feedback.manager?.name || 'Unknown Manager'}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {feedback.manager?.email || 'No email'}
          </div>
        </div>
        {!readonly && (
          <button
            onClick={handleEdit}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
          >
            <Edit className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-slate-700 dark:text-slate-300 italic">
            "{feedback.feedback_text}"
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-slate-500 dark:text-slate-400">Score:</span>
              <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                {feedback.score}/100
              </span>
            </div>
            <div className="text-sm">
              <span className="text-slate-500 dark:text-slate-400">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                feedback.pass_fail === 'Pass' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {feedback.pass_fail}
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">
            {new Date(feedback.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}

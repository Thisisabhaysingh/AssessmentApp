'use client'
import { useState, useEffect } from 'react'
import { Users, Edit, Save, X } from 'lucide-react'
import { api } from '@/lib/api'

interface Manager {
  id: number
  name: string
  email: string
  department?: string
}

interface ManagerAssignmentProps {
  assessmentId: number
  currentManagers?: Manager[]
  onAssignmentChange?: (managers: Manager[]) => void
}

export default function ManagerAssignment({ assessmentId, currentManagers = [], onAssignmentChange }: ManagerAssignmentProps) {
  const [availableManagers, setAvailableManagers] = useState<Manager[]>([])
  const [selectedManagers, setSelectedManagers] = useState<Manager[]>(currentManagers)
  const [loading, setLoading] = useState(false)
  const [showManagerList, setShowManagerList] = useState(false)

  useEffect(() => {
    loadManagers()
  }, [])

  const loadManagers = async () => {
    try {
      const response: any = await api.manager.getManagers()
      setAvailableManagers(response.data.managers || [])
    } catch (error) {
      console.error('Failed to load managers:', error)
    }
  }

  const handleManagerToggle = (manager: Manager) => {
    const isSelected = selectedManagers.some(m => m.id === manager.id)
    if (isSelected) {
      setSelectedManagers(selectedManagers.filter(m => m.id !== manager.id))
    } else {
      setSelectedManagers([...selectedManagers, manager])
    }
  }

  const handleSaveAssignment = async () => {
    setLoading(true)
    try {
      await api.manager.assignManagersToAssessment({
        assessment_id: assessmentId,
        manager_ids: selectedManagers.map(m => m.id)
      })
      
      onAssignmentChange?.(selectedManagers)
      setShowManagerList(false)
    } catch (error) {
      console.error('Failed to assign managers:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Assigned Managers ({selectedManagers.length})
          </span>
        </div>
        <button
          onClick={() => setShowManagerList(!showManagerList)}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
        >
          <Edit className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Current managers display */}
      <div className="flex flex-wrap gap-2">
        {selectedManagers.map(manager => (
          <span
            key={manager.id}
            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm flex items-center gap-1"
          >
            {manager.name}
            <button
              onClick={() => handleManagerToggle(manager)}
              className="ml-1 hover:text-blue-900 dark:hover:text-blue-300"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {selectedManagers.length === 0 && (
          <span className="text-sm text-slate-500 dark:text-slate-400">No managers assigned</span>
        )}
      </div>

      {/* Manager selection modal/list */}
      {showManagerList && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-slate-900 dark:text-slate-100">Assign Managers</h3>
            <button
              onClick={() => setShowManagerList(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableManagers.map(manager => (
              <label
                key={manager.id}
                className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedManagers.some(m => m.id === manager.id)}
                  onChange={() => handleManagerToggle(manager)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {manager.name}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {manager.email}
                  </div>
                  {manager.department && (
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      {manager.department}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setShowManagerList(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAssignment}
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
                  Save Assignment
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

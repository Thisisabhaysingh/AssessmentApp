'use client'
import { useState, useEffect } from 'react'
import { Database, Shield, Server, Mail, Edit, Save, X } from 'lucide-react'
import Toast from '@/components/Toast'
import { api } from '@/lib/api'

export default function SystemSettings() {
  const [editMode, setEditMode] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [loading, setLoading] = useState(true)
  const [originalSettings, setOriginalSettings] = useState<any>(null)
  
  // Settings state
  const [settings, setSettings] = useState({
    // Security
    twoFactorAuth: true,
    sessionTimeout: '8',
    passwordMinLength: '8',
    // Database
    autoBackup: true,
    backupTime: '2:00 AM',
    dataRetention: '2',
    performanceMonitoring: true,
    // Notifications
    emailNotifications: true,
    assessmentReminders: true,
    performanceReports: true,
    reportFrequency: 'weekly'
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res: any = await api.admin.getSettings()
      const loadedSettings = res.data.settings
      setSettings(loadedSettings)
      setOriginalSettings(loadedSettings)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load settings:', error)
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await api.admin.updateSettings(settings)
      setOriginalSettings(settings)
      setToast({ message: 'Settings saved successfully!', type: 'success' })
      setEditMode(false)
    } catch (error) {
      setToast({ message: 'Failed to save settings', type: 'error' })
    }
  }

  const handleCancel = () => {
    setSettings(originalSettings)
    setEditMode(false)
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold dark:text-white">System Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Configure system preferences and settings</p>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <button 
                onClick={handleCancel}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 text-sm transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 text-sm hover:bg-red-600 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </>
          ) : (
            <button 
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg flex items-center gap-2 text-sm hover:bg-red-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Settings
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health - Read Only */}
        <div className="container-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
            <Server className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            System Health
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Database', status: 'healthy', uptime: '99.9%' },
              { label: 'Authentication', status: 'healthy', uptime: '99.8%' },
              { label: 'File Storage', status: 'warning', uptime: '98.5%' },
              { label: 'Email Service', status: 'healthy', uptime: '99.7%' },
              { label: 'Backup System', status: 'healthy', uptime: '99.9%' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                <div>
                  <p className="font-medium text-sm dark:text-white">{item.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Uptime: {item.uptime}</p>
                </div>
                {item.status === 'healthy' ? (
                  <span className="badge-green">healthy</span>
                ) : (
                  <span className="badge-yellow">warning</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Security Settings - Editable */}
        <div className="container-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
            <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            Security Settings
          </h2>
          <div className="space-y-4">
            {/* Two-Factor Authentication */}
            <div className={`p-4 rounded-lg border transition-colors ${
              editMode 
                ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600' 
                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm dark:text-white">Two-Factor Authentication</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Require 2FA for admin accounts</p>
                </div>
                {editMode ? (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.twoFactorAuth}
                      onChange={(e) => setSettings({...settings, twoFactorAuth: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                ) : (
                  <span className="badge-green">{settings.twoFactorAuth ? 'Enabled' : 'Disabled'}</span>
                )}
              </div>
            </div>

            {/* Session Timeout */}
            <div className={`p-4 rounded-lg border transition-colors ${
              editMode 
                ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600' 
                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm dark:text-white">Session Timeout</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Auto logout after inactivity</p>
                </div>
                {editMode ? (
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: e.target.value})}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm dark:text-white focus:ring-2 focus:ring-primary"
                    min="1"
                    max="24"
                  />
                ) : (
                  <span className="text-sm font-medium dark:text-slate-300">{settings.sessionTimeout} hours</span>
                )}
              </div>
            </div>

            {/* Password Min Length */}
            <div className={`p-4 rounded-lg border transition-colors ${
              editMode 
                ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600' 
                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm dark:text-white">Password Policy</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Minimum password length</p>
                </div>
                {editMode ? (
                  <input
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings({...settings, passwordMinLength: e.target.value})}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm dark:text-white focus:ring-2 focus:ring-primary"
                    min="6"
                    max="20"
                  />
                ) : (
                  <span className="text-sm font-medium dark:text-slate-300">{settings.passwordMinLength} characters</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Database Settings - Editable */}
        <div className="container-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
            <Database className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            Database Settings
          </h2>
          <div className="space-y-4">
            {/* Auto Backup */}
            <div className={`p-4 rounded-lg border transition-colors ${
              editMode 
                ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600' 
                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm dark:text-white">Automatic Backups</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daily at {settings.backupTime}</p>
                </div>
                {editMode ? (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.autoBackup}
                      onChange={(e) => setSettings({...settings, autoBackup: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                ) : (
                  <span className="badge-green">{settings.autoBackup ? 'Active' : 'Inactive'}</span>
                )}
              </div>
            </div>

            {/* Data Retention */}
            <div className={`p-4 rounded-lg border transition-colors ${
              editMode 
                ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600' 
                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm dark:text-white">Data Retention</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Keep assessment data for</p>
                </div>
                {editMode ? (
                  <select
                    value={settings.dataRetention}
                    onChange={(e) => setSettings({...settings, dataRetention: e.target.value})}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm dark:text-white focus:ring-2 focus:ring-primary"
                  >
                    <option value="1">1 year</option>
                    <option value="2">2 years</option>
                    <option value="3">3 years</option>
                    <option value="5">5 years</option>
                  </select>
                ) : (
                  <span className="text-sm font-medium dark:text-slate-300">{settings.dataRetention} years</span>
                )}
              </div>
            </div>

            {/* Performance Monitoring */}
            <div className={`p-4 rounded-lg border transition-colors ${
              editMode 
                ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600' 
                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm dark:text-white">Performance Monitoring</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Track query performance</p>
                </div>
                {editMode ? (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.performanceMonitoring}
                      onChange={(e) => setSettings({...settings, performanceMonitoring: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                ) : (
                  <span className="badge-green">{settings.performanceMonitoring ? 'Enabled' : 'Disabled'}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings - Editable */}
        <div className="container-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
            <Mail className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            Notification Settings
          </h2>
          <div className="space-y-4">
            {/* Email Notifications */}
            <div className={`p-4 rounded-lg border transition-colors ${
              editMode 
                ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600' 
                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm dark:text-white">Email Notifications</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">System alerts and reports</p>
                </div>
                {editMode ? (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                ) : (
                  <span className="badge-green">{settings.emailNotifications ? 'Enabled' : 'Disabled'}</span>
                )}
              </div>
            </div>

            {/* Assessment Reminders */}
            <div className={`p-4 rounded-lg border transition-colors ${
              editMode 
                ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600' 
                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm dark:text-white">Assessment Reminders</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Send before scheduled assessments</p>
                </div>
                {editMode ? (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.assessmentReminders}
                      onChange={(e) => setSettings({...settings, assessmentReminders: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                ) : (
                  <span className="badge-green">{settings.assessmentReminders ? 'Enabled' : 'Disabled'}</span>
                )}
              </div>
            </div>

            {/* Performance Reports */}
            <div className={`p-4 rounded-lg border transition-colors ${
              editMode 
                ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600' 
                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm dark:text-white">Performance Reports</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Summary email frequency</p>
                </div>
                {editMode ? (
                  <select
                    value={settings.reportFrequency}
                    onChange={(e) => setSettings({...settings, reportFrequency: e.target.value})}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm dark:text-white focus:ring-2 focus:ring-primary"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                ) : (
                  <span className="text-sm font-medium dark:text-slate-300 capitalize">{settings.reportFrequency}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

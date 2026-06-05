'use client'
import { useState, useEffect } from 'react'
import { Database, Shield, Server, Mail, Edit, Save, X } from 'lucide-react'
import Toast from '@/components/Toast'
import { api } from '@/lib/api'
import { clearSettingsCache } from '@/lib/settings'

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
    reportFrequency: 'weekly',
    // Assessment Settings
    passingPercentage: 60,
    totalMarks: 60,
    schoolOpsManagerMarks: 25,
    managerMarks: 35,
    evaluationCriteria: {},
    // Trainer Level Settings
    trainerLevelSettings: {
      L1: {
        totalAssessmentsRequired: 10,
        minScore: 70,
        qualifyingAssessmentsRequired: 10,
        enabled: true
      },
      L2: {
        totalAssessmentsRequired: 20,
        minScore: 85,
        qualifyingAssessmentsRequired: 10,
        enabled: true,
        requiresPreviousLevel: true
      },
      L3: {
        totalAssessmentsRequired: 25,
        minScore: 90,
        qualifyingAssessmentsRequired: 5,
        enabled: true,
        requiresPreviousLevel: true
      }
    }
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      console.log('🔍 Debug: LOAD SETTINGS STARTED');
      
      // Always get fresh data for admin settings page - bypass cache
      const res: any = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api'}/admin/settings`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error(await res.text());
      }
      
      const response = await res.json();
      const loadedSettings = response.data.settings || response.data || {}
      
      console.log('🔍 Debug: Raw data from API:', JSON.stringify(response, null, 2));
      console.log('🔍 Debug: Loaded trainerLevelSettings:', JSON.stringify(loadedSettings.trainerLevelSettings, null, 2));
      // Merge loaded settings with defaults to ensure all properties exist
      const mergedSettings = {
        // Security
        twoFactorAuth: loadedSettings.twoFactorAuth !== undefined ? loadedSettings.twoFactorAuth : true,
        sessionTimeout: loadedSettings.sessionTimeout || '8',
        passwordMinLength: loadedSettings.passwordMinLength || '8',
        // Database
        autoBackup: loadedSettings.autoBackup !== undefined ? loadedSettings.autoBackup : true,
        backupTime: loadedSettings.backupTime || '2:00 AM',
        dataRetention: loadedSettings.dataRetention || '2',
        performanceMonitoring: loadedSettings.performanceMonitoring !== undefined ? loadedSettings.performanceMonitoring : true,
        // Notifications
        emailNotifications: loadedSettings.emailNotifications !== undefined ? loadedSettings.emailNotifications : true,
        assessmentReminders: loadedSettings.assessmentReminders !== undefined ? loadedSettings.assessmentReminders : true,
        performanceReports: loadedSettings.performanceReports !== undefined ? loadedSettings.performanceReports : true,
        reportFrequency: loadedSettings.reportFrequency || 'weekly',
        // Assessment Settings
        passingPercentage: loadedSettings.passingPercentage || 60,
        totalMarks: loadedSettings.totalMarks || 60,
        schoolOpsManagerMarks: loadedSettings.schoolOpsManagerMarks || 25,
        managerMarks: loadedSettings.managerMarks || 35,
        evaluationCriteria: loadedSettings.evaluationCriteria || {},
        // Trainer Level Settings
        trainerLevelSettings: {
          L1: {
            totalAssessmentsRequired: loadedSettings.trainerLevelSettings?.L1?.totalAssessmentsRequired || 10,
            minScore: loadedSettings.trainerLevelSettings?.L1?.minScore || 70,
            qualifyingAssessmentsRequired: loadedSettings.trainerLevelSettings?.L1?.qualifyingAssessmentsRequired || 10,
            enabled: loadedSettings.trainerLevelSettings?.L1?.enabled !== undefined ? loadedSettings.trainerLevelSettings.L1.enabled : true
          },
          L2: {
            totalAssessmentsRequired: loadedSettings.trainerLevelSettings?.L2?.totalAssessmentsRequired || 20,
            minScore: loadedSettings.trainerLevelSettings?.L2?.minScore || 85,
            qualifyingAssessmentsRequired: loadedSettings.trainerLevelSettings?.L2?.qualifyingAssessmentsRequired || 10,
            enabled: loadedSettings.trainerLevelSettings?.L2?.enabled !== undefined ? loadedSettings.trainerLevelSettings.L2.enabled : true,
            requiresPreviousLevel: loadedSettings.trainerLevelSettings?.L2?.requiresPreviousLevel !== undefined ? loadedSettings.trainerLevelSettings.L2.requiresPreviousLevel : true
          },
          L3: {
            totalAssessmentsRequired: loadedSettings.trainerLevelSettings?.L3?.totalAssessmentsRequired || 25,
            minScore: loadedSettings.trainerLevelSettings?.L3?.minScore || 90,
            qualifyingAssessmentsRequired: loadedSettings.trainerLevelSettings?.L3?.qualifyingAssessmentsRequired || 5,
            enabled: loadedSettings.trainerLevelSettings?.L3?.enabled !== undefined ? loadedSettings.trainerLevelSettings.L3.enabled : true,
            requiresPreviousLevel: loadedSettings.trainerLevelSettings?.L3?.requiresPreviousLevel !== undefined ? loadedSettings.trainerLevelSettings.L3.requiresPreviousLevel : true
          }
        }
      };
      
      console.log('🔍 Debug: Final merged trainerLevelSettings:', JSON.stringify(mergedSettings.trainerLevelSettings, null, 2));
      setSettings(mergedSettings)
      setOriginalSettings(mergedSettings)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load settings:', error)
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      console.log('🔍 Debug: SAVE PROCESS STARTED');
      console.log('🔍 Debug: Current settings before save:', JSON.stringify(settings.trainerLevelSettings, null, 2));
      console.log('🔍 Debug: Full settings object being sent:', JSON.stringify(settings, null, 2));
      
      // Use the new working trainer settings API
      const response = await api.trainerSettings.updateSettings({
        trainerLevelSettings: settings.trainerLevelSettings
      });
      console.log('🔍 Debug: Save API response:', response);
      
      clearSettingsCache() // Clear cache so other users get updated settings
      setOriginalSettings(settings)
      setToast({ message: 'Settings saved successfully!', type: 'success' })
      setEditMode(false)
      
      console.log('🔍 Debug: Settings saved, reloading fresh data...');
      
      // Reload settings to get fresh data
      setTimeout(() => {
        console.log('🔍 Debug: Starting reload...');
        loadSettings()
      }, 500)
    } catch (error) {
      console.error('🔍 Debug: Save failed with error:', error);
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

        {/* Assessment Settings - Editable */}
        <div className="container-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
            <Edit className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            Assessment Settings
          </h2>
          <div className="space-y-4">
            {/* Passing Percentage */}
            <div className={`p-4 rounded-lg border transition-colors ${
              editMode 
                ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600' 
                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm dark:text-white">Passing Percentage</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Minimum percentage required to pass</p>
                </div>
                {editMode ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={settings.passingPercentage}
                      onChange={(e) => setSettings({...settings, passingPercentage: parseInt(e.target.value) || 0})}
                      className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm dark:text-white focus:ring-2 focus:ring-primary"
                      min="0"
                      max="100"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">%</span>
                  </div>
                ) : (
                  <span className="text-sm font-medium dark:text-slate-300">{settings.passingPercentage}%</span>
                )}
              </div>
            </div>

            {/* Total Marks */}
            <div className={`p-4 rounded-lg border transition-colors ${
              editMode 
                ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600' 
                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm dark:text-white">Total Assessment Marks</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Combined total marks for assessment</p>
                </div>
                {editMode ? (
                  <input
                    type="number"
                    value={settings.totalMarks}
                    onChange={(e) => setSettings({...settings, totalMarks: parseInt(e.target.value) || 0})}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm dark:text-white focus:ring-2 focus:ring-primary"
                    min="1"
                    max="100"
                  />
                ) : (
                  <span className="text-sm font-medium dark:text-slate-300">{settings.totalMarks} marks</span>
                )}
              </div>
            </div>

            {/* School Ops Manager Marks */}
            <div className={`p-4 rounded-lg border transition-colors ${
              editMode 
                ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600' 
                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm dark:text-white">School Ops Manager Marks</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Marks allocated to School Ops Manager evaluation</p>
                </div>
                {editMode ? (
                  <input
                    type="number"
                    value={settings.schoolOpsManagerMarks}
                    onChange={(e) => setSettings({...settings, schoolOpsManagerMarks: parseInt(e.target.value) || 0})}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm dark:text-white focus:ring-2 focus:ring-primary"
                    min="0"
                    max="100"
                  />
                ) : (
                  <span className="text-sm font-medium dark:text-slate-300">{settings.schoolOpsManagerMarks} marks</span>
                )}
              </div>
            </div>

            {/* Manager Marks */}
            <div className={`p-4 rounded-lg border transition-colors ${
              editMode 
                ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600' 
                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-sm dark:text-white">Manager Marks</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Marks allocated to Manager evaluation</p>
                </div>
                {editMode ? (
                  <input
                    type="number"
                    value={settings.managerMarks}
                    onChange={(e) => setSettings({...settings, managerMarks: parseInt(e.target.value) || 0})}
                    className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm dark:text-white focus:ring-2 focus:ring-primary"
                    min="0"
                    max="100"
                  />
                ) : (
                  <span className="text-sm font-medium dark:text-slate-300">{settings.managerMarks} marks</span>
                )}
              </div>
            </div>

            {/* Marks Summary */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-blue-800 dark:text-blue-200">Current Distribution</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    School Ops Manager: {settings.schoolOpsManagerMarks} + Manager: {settings.managerMarks} = {settings.schoolOpsManagerMarks + settings.managerMarks} total marks
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Passing Score</p>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {Math.round((settings.passingPercentage / 100) * (settings.schoolOpsManagerMarks + settings.managerMarks))} marks
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trainer Level Settings - Editable */}
        <div className="container-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
            <Edit className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            Trainer Level Settings
          </h2>
          <div className="space-y-4">
            {['L1', 'L2', 'L3'].map((level) => {
              const levelSettings = settings.trainerLevelSettings[level];
              const levelName = level === 'L1' ? 'Level 1' : level === 'L2' ? 'Level 2' : 'Level 3';
              
              return (
                <div key={level} className={`p-4 rounded-lg border transition-colors ${
                  editMode 
                    ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600' 
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm dark:text-white">{levelName} Trainer</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {level === 'L1' ? 'Entry level trainer certification' : 
                         level === 'L2' ? 'Intermediate level trainer certification' : 
                         'Advanced level trainer certification'}
                      </p>
                    </div>
                    {editMode ? (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={levelSettings.enabled}
                          onChange={(e) => {
                            const newSettings = {...settings};
                            newSettings.trainerLevelSettings[level].enabled = e.target.checked;
                            setSettings(newSettings);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    ) : (
                      <span className={`badge ${levelSettings.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {levelSettings.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    )}
                  </div>
                  
                  {levelSettings.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Total Assessments Required */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Total Assessments</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Minimum passed assessments (≥70%)</p>
                        </div>
                        {editMode ? (
                          <input
                            type="number"
                            value={levelSettings.totalAssessmentsRequired}
                            onChange={(e) => {
                              console.log(`🔍 Debug: Changing ${level} totalAssessmentsRequired from ${levelSettings.totalAssessmentsRequired} to ${e.target.value}`);
                              const newSettings = {...settings};
                              newSettings.trainerLevelSettings[level as 'L1' | 'L2' | 'L3'].totalAssessmentsRequired = parseInt(e.target.value) || 0;
                              console.log('🔍 Debug: New settings object:', JSON.stringify(newSettings.trainerLevelSettings, null, 2));
                              setSettings(newSettings);
                            }}
                            className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm dark:text-white focus:ring-2 focus:ring-primary"
                            min="1"
                            max="100"
                          />
                        ) : (
                          <span className="text-sm font-medium dark:text-slate-300">{levelSettings.totalAssessmentsRequired}</span>
                        )}
                      </div>
                      
                      {/* Minimum Score */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Minimum Score</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Score threshold for qualifying assessments</p>
                        </div>
                        {editMode ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={levelSettings.minScore}
                              onChange={(e) => {
                                console.log(`🔍 Debug: Changing ${level} minScore from ${levelSettings.minScore} to ${e.target.value}`);
                                const newSettings = {...settings};
                                newSettings.trainerLevelSettings[level as 'L1' | 'L2' | 'L3'].minScore = parseInt(e.target.value) || 0;
                                console.log('🔍 Debug: New settings object:', JSON.stringify(newSettings.trainerLevelSettings, null, 2));
                                setSettings(newSettings);
                              }}
                              className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm dark:text-white focus:ring-2 focus:ring-primary"
                              min="0"
                              max="100"
                            />
                            <span className="text-sm text-slate-600 dark:text-slate-400">%</span>
                          </div>
                        ) : (
                          <span className="text-sm font-medium dark:text-slate-300">{levelSettings.minScore}%</span>
                        )}
                      </div>
                      
                      {/* Qualifying Assessments Required */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Qualifying Assessments</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Number of assessments ≥ {levelSettings.minScore}%</p>
                        </div>
                        {editMode ? (
                          <input
                            type="number"
                            value={levelSettings.qualifyingAssessmentsRequired}
                            onChange={(e) => {
                              console.log(`🔍 Debug: Changing ${level} qualifyingAssessmentsRequired from ${levelSettings.qualifyingAssessmentsRequired} to ${e.target.value}`);
                              const newSettings = {...settings};
                              newSettings.trainerLevelSettings[level as 'L1' | 'L2' | 'L3'].qualifyingAssessmentsRequired = parseInt(e.target.value) || 0;
                              console.log('🔍 Debug: New settings object:', JSON.stringify(newSettings.trainerLevelSettings, null, 2));
                              setSettings(newSettings);
                            }}
                            className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm dark:text-white focus:ring-2 focus:ring-primary"
                            min="1"
                            max="100"
                          />
                        ) : (
                          <span className="text-sm font-medium dark:text-slate-300">{levelSettings.qualifyingAssessmentsRequired}</span>
                        )}
                      </div>
                      
                      {/* Requires Previous Level (only for L2 and L3) */}
                      {(level === 'L2' || level === 'L3') && (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Previous Level Required</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Must achieve {level === 'L2' ? 'L1' : 'L2'} first</p>
                          </div>
                          {editMode ? (
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={levelSettings.requiresPreviousLevel}
                                onChange={(e) => {
                                  console.log(`🔍 Debug: Changing ${level} requiresPreviousLevel from ${levelSettings.requiresPreviousLevel} to ${e.target.checked}`);
                                  const newSettings = {...settings};
                                  newSettings.trainerLevelSettings[level as 'L1' | 'L2' | 'L3'].requiresPreviousLevel = e.target.checked;
                                  console.log('🔍 Debug: New settings object:', JSON.stringify(newSettings.trainerLevelSettings, null, 2));
                                  setSettings(newSettings);
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          ) : (
                            <span className={`badge ${levelSettings.requiresPreviousLevel ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                              {levelSettings.requiresPreviousLevel ? 'Required' : 'Not Required'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Summary Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Trainer Level Progression</p>
              <div className="space-y-1 text-xs text-blue-600 dark:text-blue-400">
                <p>• L1: Entry level - Basic trainer certification</p>
                <p>• L2: Intermediate - Advanced training skills</p>
                <p>• L3: Expert - Master trainer certification</p>
                <p>• Levels can be disabled to prevent new certifications</p>
                <p>• Changes affect all future level calculations</p>
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

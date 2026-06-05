import { api } from './api'

export interface SystemSettings {
  passingPercentage: number
  totalMarks: number
  schoolOpsManagerMarks: number
  managerMarks: number
  evaluationCriteria: any
  trainerLevelSettings: {
    L1: {
      totalAssessmentsRequired: number
      minScore: number
      qualifyingAssessmentsRequired: number
      enabled: boolean
    }
    L2: {
      totalAssessmentsRequired: number
      minScore: number
      qualifyingAssessmentsRequired: number
      enabled: boolean
      requiresPreviousLevel: boolean
    }
    L3: {
      totalAssessmentsRequired: number
      minScore: number
      qualifyingAssessmentsRequired: number
      enabled: boolean
      requiresPreviousLevel: boolean
    }
  }
  [key: string]: any
}

// Cache for settings to avoid repeated API calls
let cachedSettings: SystemSettings | null = null
let lastFetchTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const getSystemSettings = async (): Promise<SystemSettings> => {
  const now = Date.now()
  
  // Return cached settings if still valid
  if (cachedSettings && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedSettings
  }
  
  try {
    const response: any = await api.get('/public/settings')
    const settings = response.data.settings || response.data || {}
    
    // Cache the settings
    cachedSettings = settings
    lastFetchTime = now
    
    return settings
  } catch (error) {
    console.error('Failed to fetch system settings:', error)
    
    // Return default settings if API fails
    const defaultSettings: SystemSettings = {
      passingPercentage: 60,
      totalMarks: 60,
      schoolOpsManagerMarks: 25,
      managerMarks: 35,
      evaluationCriteria: {},
      trainerLevelSettings: {
        L1: { totalAssessmentsRequired: 10, minScore: 70, qualifyingAssessmentsRequired: 10, enabled: true },
        L2: { totalAssessmentsRequired: 20, minScore: 85, qualifyingAssessmentsRequired: 10, enabled: true, requiresPreviousLevel: true },
        L3: { totalAssessmentsRequired: 25, minScore: 90, qualifyingAssessmentsRequired: 5, enabled: true, requiresPreviousLevel: true }
      }
    }
    
    return defaultSettings
  }
}

export const clearSettingsCache = () => {
  cachedSettings = null
  lastFetchTime = 0
}

import { api } from './api'

export async function getCurrentUser() {
  try {
    const result: any = await api.me()
    return result.data.user
  } catch (error) {
    return null
  }
}

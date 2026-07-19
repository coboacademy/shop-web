export interface SettingItem {
  id: number
  key: string
  value: string | boolean | number | Record<string, any> | null
  raw_value: string | null
  type: 'string' | 'boolean' | 'integer' | 'json'
  group: string
  updated_at: string
}

export interface SettingsResponse {
  status: string
  message: string
  data: {
    settings: SettingItem[]
  }
}

export interface UpdateSettingsPayload {
  app_name: string
  support_email: string
  allow_registration: boolean
  maintenance_mode: boolean
  default_user_role: string
}

export const useSettings = () => {
  const api = useApi()

  const getSettings = async (): Promise<SettingsResponse> => {
    try {
      const response = await api.get<SettingsResponse>('/settings')
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch settings',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const updateSettings = async (
    payload: UpdateSettingsPayload
  ): Promise<SettingsResponse> => {
    try {
      const response = await api.put<SettingsResponse>('/settings', payload)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to update settings',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  return {
    getSettings,
    updateSettings,
  }
}
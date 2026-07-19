export interface ProfileUser {
  id: number
  name: string
  email: string
  role?: string | null
  roles?: string[]
  permissions?: string[]
  status?: string
  created_at?: string
}

export interface ProfileResponse {
  status: string
  message: string
  data: {
    user: ProfileUser
  }
}

export interface UpdateProfilePayload {
  name: string
  email: string
}

export interface UpdatePasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}

export const useProfile = () => {
  const api = useApi()

  const getProfile = async (): Promise<ProfileResponse> => {
    try {
      const response = await api.get<ProfileResponse>('/profile')
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch profile',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const updateProfile = async (
    payload: UpdateProfilePayload
  ): Promise<ProfileResponse> => {
    try {
      const response = await api.put<ProfileResponse>('/profile', payload)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to update profile',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const updatePassword = async (payload: UpdatePasswordPayload) => {
    try {
      const response = await api.put('/profile/password', payload)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to update password',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  return {
    getProfile,
    updateProfile,
    updatePassword,
  }
}
export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export interface PasswordResetResponse {
  status: string
  message: string
}

export const usePasswordReset = () => {
  const api = useApi()

  const forgotPassword = async (
    payload: ForgotPasswordPayload
  ): Promise<PasswordResetResponse> => {
    try {
      const response = await api.post<PasswordResetResponse>('/forgot-password', payload)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to send reset link',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const resetPassword = async (
    payload: ResetPasswordPayload
  ): Promise<PasswordResetResponse> => {
    try {
      const response = await api.post<PasswordResetResponse>('/reset-password', payload)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to reset password',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  return {
    forgotPassword,
    resetPassword,
  }
}
export interface SendPasswordOtpPayload {
  email: string
}

export interface VerifyPasswordOtpPayload {
  email: string
  otp: string
}

export interface ResetPasswordWithOtpPayload {
  email: string
  otp: string
  password: string
  password_confirmation: string
}

export interface PasswordOtpResponse {
  status: string
  message: string
}

export const usePasswordOtp = () => {
  const api = useApi()

  const sendPasswordOtp = async (
    payload: SendPasswordOtpPayload
  ): Promise<PasswordOtpResponse> => {
    try {
      const response = await api.post<PasswordOtpResponse>('/password/otp/send', payload)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to send OTP',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const verifyPasswordOtp = async (
    payload: VerifyPasswordOtpPayload
  ): Promise<PasswordOtpResponse> => {
    try {
      const response = await api.post<PasswordOtpResponse>('/password/otp/verify', payload)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to verify OTP',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const resetPasswordWithOtp = async (
    payload: ResetPasswordWithOtpPayload
  ): Promise<PasswordOtpResponse> => {
    try {
      const response = await api.post<PasswordOtpResponse>('/password/otp/reset', payload)
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
    sendPasswordOtp,
    verifyPasswordOtp,
    resetPasswordWithOtp,
  }
}
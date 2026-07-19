export interface EmailOtpResponse {
  status: string
  message: string
  data?: {
    user?: any
  }
}

export const useEmailOtp = () => {
  const api = useApi()

  const verifyEmailOtp = async (otp: string): Promise<EmailOtpResponse> => {
    try {
      const response = await api.post<EmailOtpResponse>('/email/otp/verify', {
        otp,
      })

      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to verify email OTP',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const resendEmailOtp = async (): Promise<EmailOtpResponse> => {
    try {
      const response = await api.post<EmailOtpResponse>('/email/otp/resend')
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to resend email OTP',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  return {
    verifyEmailOtp,
    resendEmailOtp,
  }
}
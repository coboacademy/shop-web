export interface VerifyEmailResponse {
  status: string
  message: string
  data?: {
    user?: any
  }
}

export const useEmailVerification = () => {
  const api = useApi()

  const verifyEmailByUrl = async (signedUrl: string): Promise<VerifyEmailResponse> => {
    try {
      const response = await api.get<VerifyEmailResponse>(signedUrl, {
        baseURL: '',
      })

      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to verify email',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const resendVerificationEmail = async (): Promise<VerifyEmailResponse> => {
    try {
      const response = await api.post<VerifyEmailResponse>('/email/verification-notification')
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to resend verification email',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  return {
    verifyEmailByUrl,
    resendVerificationEmail,
  }
}
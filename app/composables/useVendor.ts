export interface VendorProfile {
  id: string
  user_id?: number | string
  business_name: string
  slug?: string
  email?: string
  phone?: string
  description?: string
  website?: string
  country?: string
  province?: string
  city?: string
  address?: string
  logo?: string | null
  cover_image?: string | null
  status?: string
  verified_at?: string | null
  created_at?: string
}

export interface VendorProfileResponse {
  status: string
  message: string
  data: {
    vendor: VendorProfile
  }
}

export type VendorKycPayload = Omit<
  VendorProfile,
  'id' | 'user_id' | 'slug' | 'email' | 'logo' | 'cover_image' | 'status' | 'verified_at' | 'created_at'
>

export const useVendor = () => {
  const api = useApi()

  const getProfile = async (): Promise<VendorProfileResponse> => {
    try {
      const response = await api.get<VendorProfileResponse>('/vendor/profile')
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch vendor profile',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const updateKyc = async (payload: VendorKycPayload): Promise<VendorProfileResponse> => {
    try {
      const response = await api.put<VendorProfileResponse>('/vendor/kyc', payload)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to update vendor KYC',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  return {
    getProfile,
    updateKyc,
  }
}

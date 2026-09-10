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

export interface Store {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  description: string
  logo?: string | null
  cover_image?: string | null
  country: string
  province: string
  city: string
  address: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateStorePayload {
  name: string
  email: string
  phone: string
  description: string
  country: string
  province: string
  city: string
  address: string
}

export interface UpdateStorePayload {
  name?: string
  phone?: string
  description?: string
}

export interface StoreResponse {
  status: string
  message: string
  data: {
    store: Store
  }
}

export interface StoreListResponse {
  status: string
  message: string
  data: {
    stores: Store[]
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

  const createStore = async (payload: CreateStorePayload): Promise<StoreResponse> => {
    try {
      const response = await api.post<StoreResponse>('/vendor/stores', payload)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to create store',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const getStore = async (id: string): Promise<StoreResponse> => {
    try {
      const response = await api.get<StoreResponse>(`/vendor/stores/${id}`)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch store',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const getStores = async (): Promise<StoreListResponse> => {
    try {
      const response = await api.get<StoreListResponse>('/vendor/stores')
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch stores',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const updateStore = async (
    id: string,
    payload: UpdateStorePayload
  ): Promise<StoreResponse> => {
    try {
      const response = await api.patch<StoreResponse>(`/vendor/stores/${id}`, payload)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to update store',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const deleteStore = async (id: string): Promise<StoreResponse> => {
    try {
      const response = await api.delete<StoreResponse>(`/vendor/stores/${id}`)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to delete store',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const uploadStoreLogo = async (id: string, file: File): Promise<StoreResponse> => {
    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await api.post<StoreResponse>(`/vendor/stores/${id}/logo`, formData)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to upload store logo',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const deleteStoreLogo = async (id: string): Promise<StoreResponse> => {
    try {
      const response = await api.delete<StoreResponse>(`/vendor/stores/${id}/logo`)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to delete store logo',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const uploadStoreCover = async (id: string, file: File): Promise<StoreResponse> => {
    try {
      const formData = new FormData()
      formData.append('cover', file)

      const response = await api.post<StoreResponse>(`/vendor/stores/${id}/cover`, formData)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to upload store cover',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  return {
    getProfile,
    updateKyc,
    createStore,
    getStore,
    getStores,
    updateStore,
    deleteStore,
    uploadStoreLogo,
    deleteStoreLogo,
    uploadStoreCover,
  }
}

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

export interface VendorPagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface AdminVendorListResponse {
  status: string
  message: string
  data: {
    vendors: VendorProfile[]
    pagination: VendorPagination
  }
}

export interface AdminVendorFilters {
  search?: string
  status?: string
  country?: string
  city?: string
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface AdminVendorStatistics {
  total: number
  pending: number
  approved: number
  rejected: number
  suspended: number
}

export interface AdminVendorStatisticsResponse {
  status?: string
  message?: string
  data?: {
    statistics?: AdminVendorStatistics
  }
  statistics?: AdminVendorStatistics
}

export interface AdminVendorAccount {
  id?: number | string
  name?: string
  email?: string
  phone?: string
  status?: string
}

export interface AdminVendorDetails {
  vendor: VendorProfile & {
    updated_at?: string
    store_count?: number
    stores_count?: number
    stores?: Store[]
  }
  account?: AdminVendorAccount | null
  store_count?: number
  stores?: Store[]
}

export interface AdminVendorDetailsResponse {
  status?: string
  message?: string
  data?: AdminVendorDetails
  vendor?: AdminVendorDetails["vendor"]
  account?: AdminVendorAccount | null
  store_count?: number
  stores?: Store[]
}

export interface AdminVendorActionResponse {
  status?: string
  message?: string
  data?: {
    vendor?: VendorProfile
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
  cover_image_url?: string | null
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

  const getAdminVendors = async (
    params?: AdminVendorFilters
  ): Promise<AdminVendorListResponse> => {
    try {
      const response = await api.get<AdminVendorListResponse>('/admin/vendors', {
        params,
      })

      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch vendors',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const getAdminVendorStatistics = async (): Promise<AdminVendorStatistics> => {
    try {
      const response = await api.get<AdminVendorStatisticsResponse>(
        '/admin/vendors/statistics'
      )
      const statistics = response.data.data?.statistics || response.data.statistics

      if (!statistics) {
        throw new Error('Vendor statistics were missing from the response')
      }

      return statistics
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message ||
          error.message ||
          'Failed to fetch vendor statistics',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const getAdminVendor = async (id: string): Promise<AdminVendorDetails> => {
    try {
      const response = await api.get<AdminVendorDetailsResponse>(`/admin/vendors/${id}`)
      const payload = response.data.data || response.data

      if ("vendor" in payload && payload.vendor) {
        return payload as AdminVendorDetails
      }

      if ("id" in payload) {
        return { vendor: payload as AdminVendorDetails["vendor"] }
      }

      throw new Error("Vendor details were missing from the response")
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || error.message || "Failed to fetch vendor details",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const approveAdminVendor = async (id: string): Promise<AdminVendorActionResponse> => {
    try {
      const response = await api.patch<AdminVendorActionResponse>(
        `/admin/vendors/${id}/approve`
      )
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to approve vendor",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const rejectAdminVendor = async (
    id: string,
    reason: string
  ): Promise<AdminVendorActionResponse> => {
    try {
      const response = await api.patch<AdminVendorActionResponse>(
        `/admin/vendors/${id}/reject`,
        { reason }
      )
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to reject vendor",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const suspendAdminVendor = async (
    id: string,
    reason: string
  ): Promise<AdminVendorActionResponse> => {
    try {
      const response = await api.patch<AdminVendorActionResponse>(
        `/admin/vendors/${id}/suspend`,
        { reason }
      )
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to suspend vendor",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const reactivateAdminVendor = async (
    id: string
  ): Promise<AdminVendorActionResponse> => {
    try {
      const response = await api.patch<AdminVendorActionResponse>(
        `/admin/vendors/${id}/reactivate`
      )
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to reactivate vendor',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

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

  const activateStore = async (id: string): Promise<StoreResponse> => {
    try {
      const response = await api.patch<StoreResponse>(`/vendor/stores/${id}/activate`)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to activate store',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const deactivateStore = async (id: string): Promise<StoreResponse> => {
    try {
      const response = await api.patch<StoreResponse>(`/vendor/stores/${id}/deactivate`)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to deactivate store',
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

  const deleteStoreCover = async (id: string): Promise<StoreResponse> => {
    try {
      const response = await api.delete<StoreResponse>(`/vendor/stores/${id}/cover`)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to delete store cover',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  return {
    getAdminVendors,
    getAdminVendorStatistics,
    getAdminVendor,
    approveAdminVendor,
    rejectAdminVendor,
    suspendAdminVendor,
    reactivateAdminVendor,
    getProfile,
    updateKyc,
    createStore,
    getStore,
    getStores,
    updateStore,
    activateStore,
    deactivateStore,
    deleteStore,
    uploadStoreLogo,
    deleteStoreLogo,
    uploadStoreCover,
    deleteStoreCover,
  }
}

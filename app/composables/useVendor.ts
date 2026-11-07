export type VendorReviewStatus = "pending" | "approved" | "rejected" | "suspended"

export interface VendorProfile {
  id: string
  user_id?: number | string
  business_name: string
  slug?: string
  email?: string | null
  phone?: string | null
  description?: string | null
  website?: string | null
  country?: string | null
  province?: string | null
  city?: string | null
  address?: string | null
  logo?: string | null
  cover_image?: string | null
  status?: VendorReviewStatus | string
  verified_at?: string | null
  created_at?: string
}

export interface AdminVendorUser {
  id: number
  name: string
  email: string
}

export type AdminVendorStatus = "pending" | "approved" | "rejected" | "suspended"

export interface AdminVendorStore {
  id: string
  name: string
  slug: string
  is_active: boolean
}

export interface AdminVendor {
  id: string
  business_name: string
  slug?: string | null
  email?: string | null
  phone?: string | null
  description?: string | null
  website?: string | null
  country?: string | null
  province?: string | null
  city?: string | null
  address?: string | null
  status: AdminVendorStatus
  user?: AdminVendorUser | null
  stores_count?: number
  stores?: AdminVendorStore[]
  created_at?: string
  updated_at?: string
}

export interface VendorProfileResponse {
  status: string
  message: string
  data: {
    vendor: VendorProfile
  }
}

export interface VendorDashboardOrderItem {
  id: number
  product_id: string
  variant_id: string | null
  vendor_id: string
  store_id: string
  product_name: string
  variant_name: string | null
  sku: string
  quantity: number
  unit_price: string
  subtotal: string
  total: string
}

export interface VendorDashboardOrder {
  id: number
  order_number: string
  status: "pending" | "confirmed" | "processing" | "delivered" | "cancelled"
  payment_status: string
  vendor_item_subtotal: string
  items: VendorDashboardOrderItem[]
  created_at: string
}

export interface VendorDashboardSummary {
  orders: {
    total: number
    pending: number
    confirmed: number
    processing: number
    delivered: number
    cancelled: number
  }
  products: {
    total: number
    active: number
  }
  stores: {
    total: number
    active: number
  }
}

export interface VendorDashboardSummaryResponse {
  status: string
  message: string
  data: {
    summary: VendorDashboardSummary
    recent_orders: VendorDashboardOrder[]
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
    vendors: AdminVendor[]
    pagination: VendorPagination
  }
}

export interface AdminVendorFilters {
  search?: string
  status?: AdminVendorStatus
  country?: string
  city?: string
  sort_by?: "business_name" | "status" | "created_at" | "updated_at"
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
  status: string
  message: string
  data: {
    statistics: AdminVendorStatistics
  }
}

export interface AdminVendorDetails {
  vendor: AdminVendor
}

export interface AdminVendorDetailsResponse {
  status: string
  message: string
  data: AdminVendorDetails
}

export interface AdminVendorActionResponse {
  status: string
  message: string
  data: {
    vendor: AdminVendor
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
    pagination?: VendorPagination
  }
}

export interface VendorProfileUpdatePayload {
  business_name: string
  email: string
  phone: string | null
  description: string | null
  website: string | null
  country: string | null
  province: string | null
  city: string | null
  address: string | null
}

export interface VendorKycPayload {
  business_name: string
  phone: string
  description?: string | null
  website?: string | null
  country: string
  province: string
  city: string
  address: string
}

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
      const statistics = response.data.data?.statistics
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
      const response = await api.get<AdminVendorDetailsResponse>(
        `/admin/vendors/${encodeURIComponent(id)}`
      )
      const details = response.data.data
      if (!details?.vendor) {
        throw new Error('Vendor details were missing from the response')
      }

      return details
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
        `/admin/vendors/${encodeURIComponent(id)}/approve`
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
        `/admin/vendors/${encodeURIComponent(id)}/reject`,
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
        `/admin/vendors/${encodeURIComponent(id)}/suspend`,
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
        `/admin/vendors/${encodeURIComponent(id)}/reactivate`
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

  const getDashboardSummary = async (): Promise<VendorDashboardSummaryResponse> => {
    try {
      const response = await api.get<VendorDashboardSummaryResponse>(
        '/vendor/dashboard/summary'
      )
      return response.data
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message || 'Failed to fetch vendor dashboard summary',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const submitKyc = async (
    payload: VendorKycPayload
  ): Promise<VendorProfileResponse> => {
    try {
      const response = await api.post<VendorProfileResponse>('/vendor/kyc', payload)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to submit vendor KYC',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const updateKyc = async (
    payload: VendorKycPayload
  ): Promise<VendorProfileResponse> => {
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

  const updateProfile = async (
    payload: VendorProfileUpdatePayload
  ): Promise<VendorProfileResponse> => {
    try {
      const response = await api.put<VendorProfileResponse>('/vendor/profile', payload)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to update vendor profile',
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

  const getStores = async (page = 1): Promise<StoreListResponse> => {
    try {
      const response = await api.get<{
        status: string
        message: string
        data: {
          stores:
            | Store[]
            | {
                data: Store[]
                meta: VendorPagination
              }
        }
      }>('/vendor/stores', { params: { page } })
      const storeCollection = response.data.data?.stores

      if (Array.isArray(storeCollection)) {
        return {
          ...response.data,
          data: { stores: storeCollection },
        }
      }

      if (!storeCollection || !Array.isArray(storeCollection.data)) {
        throw new Error('The stores API returned an invalid store collection.')
      }

      return {
        ...response.data,
        data: {
          stores: storeCollection.data,
          pagination: storeCollection.meta,
        },
      }
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message ||
          error.message ||
          'Failed to fetch stores',
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
    getDashboardSummary,
    submitKyc,
    updateKyc,
    updateProfile,
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

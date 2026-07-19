import { downloadBlobFile } from '~/utils/downloadFile'

export interface RoleItem {
  id: number
  name: string
  guard_name: string
  permissions?: string[]
  permissions_count?: number
  users_count?: number
  is_protected?: boolean
  created_at?: string
  updated_at?: string
}
export interface RolePagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface RoleListResponse {
  status: string
  message: string
  data: {
    roles: RoleItem[]
    pagination: RolePagination
    stats: {
      total_roles: number
    }
  }
}

export interface RolePayload {
  name: string
  guard_name?: string
}

export interface RolePermissionItem {
  id: number
  name: string
  guard_name: string
}

export interface RoleItem {
  id: number
  name: string
  guard_name: string
  permissions_count?: number | null
  permissions?: RolePermissionItem[]
  created_at?: string
}

export interface RoleShowResponse {
  status: string
  message: string
  data: {
    role: RoleItem
  }
}

export interface RoleQueryParams {
  search?: string
  guard_name?: string
  page?: number
  per_page?: number
}

export interface SyncRolePermissionsPayload {
  permissions: string[]
}

export interface CloneRolePayload {
  name: string
  guard_name?: string
}

export const useRole = () => {
  const api = useApi()

  const getRoles = async (params?: RoleQueryParams): Promise<RoleListResponse> => {
    try {
      const response = await api.get<RoleListResponse>('/roles', {
        params,
      })

      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch roles',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const createRole = async (payload: RolePayload) => {
    const response = await api.post('/roles', payload)
    return response.data
  }

  const updateRole = async (id: number | string, payload: RolePayload) => {
    const response = await api.put(`/roles/${id}`, payload)
    return response.data
  }

  const deleteRole = async (id: number | string) => {
    const response = await api.delete(`/roles/${id}`)
    return response.data
  }

  const getRole = async (id: number | string): Promise<RoleShowResponse> => {
    try {
      const response = await api.get<RoleShowResponse>(`/roles/${id}`)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch role',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const syncRolePermissions = async (
    id: number | string,
    payload: SyncRolePermissionsPayload
  ): Promise<RoleShowResponse> => {
    try {
      const response = await api.post<RoleShowResponse>(
        `/roles/${id}/permissions`,
        payload
      )

      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to update role permissions',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const exportRoles = async (params?: {
    search?: string
    guard_name?: string
  }) => {
    try {
      const response = await api.get('/roles/export', {
        params,
        responseType: 'blob',
      })

      downloadBlobFile(
        response.data,
        `roles-export-${new Date().toISOString().slice(0, 10)}.csv`
      )
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to export roles',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const importRoles = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/roles/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to import roles',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const cloneRole = async (
    id: number | string,
    payload: CloneRolePayload
  ) => {
    try {
      const response = await api.post(`/roles/${id}/clone`, payload)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to clone role',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  return {
    getRoles,
    getRole,
    syncRolePermissions,
    createRole,
    updateRole,
    deleteRole,
    exportRoles,
    importRoles,
    cloneRole,
  }
}
export interface RbacStats {
  total_users: number
  active_users: number
  inactive_users: number
  pending_users: number
  total_roles: number
  total_permissions: number
}

export interface RbacRoleOverview {
  id: number
  name: string
  guard_name: string
  users_count: number
  permissions_count: number
}

export interface PermissionModuleOverview {
  module: string
  total: number
  permissions: string[]
}

export interface RbacDashboardResponse {
  status: string
  message: string
  data: {
    stats: RbacStats
    roles: RbacRoleOverview[]
    permission_modules: PermissionModuleOverview[]
  }
}

export const useRbac = () => {
  const api = useApi()

  const getRbacDashboard = async (): Promise<RbacDashboardResponse> => {
    try {
      const response = await api.get<RbacDashboardResponse>('/rbac/dashboard')
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch RBAC dashboard',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  return {
    getRbacDashboard,
  }
}
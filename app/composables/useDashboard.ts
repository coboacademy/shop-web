export interface DashboardStats {
  total_users: number
  active_users: number
  pending_users: number
  inactive_users: number
  total_roles: number
  total_permissions: number
  total_audit_logs: number
}

export interface DashboardRecentUser {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
}

export interface DashboardAuditUser {
  id: number
  name: string
  email: string
}

export interface DashboardRecentAuditLog {
  id: number
  action: string
  module: string | null
  user: DashboardAuditUser | null
  created_at: string
}

export interface DashboardRoleDistribution {
  id: number
  name: string
  users_count: number
}

export interface DashboardSystem {
  status: string
  environment: string
  timezone: string
}

export interface DashboardSummaryResponse {
  status: string
  message: string
  data: {
    stats: DashboardStats
    recent_users: DashboardRecentUser[]
    recent_audit_logs: DashboardRecentAuditLog[]
    role_distribution: DashboardRoleDistribution[]
    system: DashboardSystem
  }
}

export const useDashboard = () => {
  const api = useApi()

  const getDashboardSummary = async (): Promise<DashboardSummaryResponse> => {
    try {
      const response = await api.get<DashboardSummaryResponse>('/dashboard/summary')
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch dashboard summary',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  return {
    getDashboardSummary,
  }
}
export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface NotificationItem {
  id: number
  title: string
  message: string
  type: NotificationType
  action_url?: string | null
  data?: Record<string, any> | null
  read: boolean
  read_at?: string | null
  created_at: string
  created_at_raw?: string | null
}

export interface NotificationPagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface NotificationApiResponse {
  status: string
  message: string
  data: {
    notifications?: NotificationItem[]
    notification?: NotificationItem
    unread_count: number
    pagination?: NotificationPagination
  }
}

export const useNotification = () => {
  const api = useApi()

  const handleError = (error: any, fallback: string) => {
    throw {
      message: error.response?.data?.message || fallback,
      errors: error.response?.data?.errors || {},
      status: error.response?.status || 500,
    }
  }

  const getNotifications = async (params?: {
    page?: number
    per_page?: number
    read?: 'all' | 'read' | 'unread'
  }): Promise<NotificationApiResponse> => {
    try {
      const response = await api.get<NotificationApiResponse>('/notifications', {
        params,
      })

      return response.data
    } catch (error: any) {
      handleError(error, 'Failed to fetch notifications')
    }
  }

  const markNotificationAsRead = async (
    id: number | string
  ): Promise<NotificationApiResponse> => {
    try {
      const response = await api.patch<NotificationApiResponse>(
        `/notifications/${id}/read`
      )

      return response.data
    } catch (error: any) {
      handleError(error, 'Failed to mark notification as read')
    }
  }

  const markAllNotificationsAsRead = async (): Promise<NotificationApiResponse> => {
    try {
      const response = await api.patch<NotificationApiResponse>(
        '/notifications/read-all'
      )

      return response.data
    } catch (error: any) {
      handleError(error, 'Failed to mark all notifications as read')
    }
  }

  const clearNotifications = async (): Promise<NotificationApiResponse> => {
    try {
      const response = await api.delete<NotificationApiResponse>(
        '/notifications/clear'
      )

      return response.data
    } catch (error: any) {
      handleError(error, 'Failed to clear notifications')
    }
  }

  return {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
  }
}
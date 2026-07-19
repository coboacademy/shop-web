export interface MenuItem {
  id: number
  name: string
  label: string
  route: string
  icon?: string | null
  permission?: string | null
  parent_id?: number | null
  sort_order: number
  is_active: boolean
  is_system: boolean
  children?: MenuItem[]
  created_at?: string
  updated_at?: string
}

export interface MenuPayload {
  name: string
  label: string
  route: string
  icon?: string | null
  permission?: string | null
  group: string
  parent_id?: number | null
  sort_order: number
  is_active: boolean
}

export interface MenuResponse {
  status: string
  message: string
  data: {
    menus?: MenuItem[]
    menu?: MenuItem
  }
}

export interface ReorderMenuPayload {
  menus: {
    id: number
    sort_order: number
    parent_id?: number | null
  }[]
}

export interface MenuItem {
  id: number
  name: string
  label: string
  route: string
  icon?: string | null
  permission?: string | null
  group?: string
  parent_id?: number | null
  sort_order: number
  is_active: boolean
  is_system: boolean
  children?: MenuItem[]
  created_at?: string
  updated_at?: string
}


export const useMenu = () => {
  const api = useApi()

  const handleError = (error: any, fallback: string) => {
    throw {
      message: error.response?.data?.message || fallback,
      errors: error.response?.data?.errors || {},
      status: error.response?.status || 500,
    }
  }

  const getMyMenus = async (): Promise<MenuResponse> => {
    try {
      const response = await api.get<MenuResponse>('/my-menus')
      return response.data
    } catch (error: any) {
      handleError(error, 'Failed to fetch menus')
    }
  }

  const getMenus = async (): Promise<MenuResponse> => {
    try {
      const response = await api.get<MenuResponse>('/menus')
      return response.data
    } catch (error: any) {
      handleError(error, 'Failed to fetch menus')
    }
  }

  const createMenu = async (payload: MenuPayload): Promise<MenuResponse> => {
    try {
      const response = await api.post<MenuResponse>('/menus', payload)
      return response.data
    } catch (error: any) {
      handleError(error, 'Failed to create menu')
    }
  }

  const updateMenu = async (
    id: number | string,
    payload: MenuPayload
  ): Promise<MenuResponse> => {
    try {
      const response = await api.put<MenuResponse>(`/menus/${id}`, payload)
      return response.data
    } catch (error: any) {
      handleError(error, 'Failed to update menu')
    }
  }

  const deleteMenu = async (id: number | string): Promise<MenuResponse> => {
    try {
      const response = await api.delete<MenuResponse>(`/menus/${id}`)
      return response.data
    } catch (error: any) {
      handleError(error, 'Failed to delete menu')
    }
  }

  const reorderMenus = async (
    payload: ReorderMenuPayload
  ): Promise<MenuResponse> => {
    try {
      const response = await api.patch<MenuResponse>('/menus/reorder', payload)
      return response.data
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || 'Failed to reorder menus',
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      }
    }
  }

  const toggleMenuActive = async (
  id: number | string
): Promise<MenuResponse> => {
  try {
    const response = await api.patch<MenuResponse>(`/menus/${id}/toggle-active`)
    return response.data
  } catch (error: any) {
    throw {
      message: error.response?.data?.message || 'Failed to update menu status',
      errors: error.response?.data?.errors || {},
      status: error.response?.status || 500,
    }
  }
}

  return {
    getMyMenus,
    getMenus,
    createMenu,
    updateMenu,
    deleteMenu,
    reorderMenus,
    toggleMenuActive,
  }
}
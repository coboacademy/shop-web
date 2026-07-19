export interface ProductItem {
  id: number
  name: string
  sku: string
  description?: string | null
  price: number
  stock: number
  status: 'active' | 'inactive' | 'draft'
  image?: string | null
  image_url?: string | null
  created_at?: string
  updated_at?: string
}

export interface ProductPagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ProductStats {
  total_products: number
  active_products: number
  inactive_products: number
  draft_products: number
  low_stock_products: number
}

export interface ProductFilters {
  search?: string
  status?: string
  page?: number
  per_page?: number
}

export interface ProductPayload {
  name: string
  sku: string
  description?: string | null
  price: number
  stock: number
  status: 'active' | 'inactive' | 'draft'
  image?: File | null
}

export interface ProductListResponse {
  status: string
  message: string
  data: {
    products: ProductItem[]
    pagination: ProductPagination
    stats: ProductStats
  }
}

export const useProduct = () => {
  const api = useApi()

  const toFormData = (payload: ProductPayload) => {
    const formData = new FormData()

    formData.append('name', payload.name)
    formData.append('sku', payload.sku)
    formData.append('description', payload.description || '')
    formData.append('price', String(payload.price))
    formData.append('stock', String(payload.stock))
    formData.append('status', payload.status)

    if (payload.image instanceof File) {
      formData.append('image', payload.image)
    }

    return formData
  }

  const getProducts = async (filters: ProductFilters = {}) => {
    const response = await api.get('/products', {
      params: filters,
    })

    return response.data as ProductListResponse
  }

  const createProduct = async (payload: ProductPayload) => {
    const response = await api.post('/products', toFormData(payload), {
      headers: {
        Accept: 'application/json',
      },
    })

    return response.data
  }

  const updateProduct = async (id: number, payload: ProductPayload) => {
    const response = await api.post(`/products/${id}`, toFormData(payload), {
      params: {
        _method: 'PUT',
      },
      headers: {
        Accept: 'application/json',
      },
    })

    return response.data
  }

  const deleteProduct = async (id: number) => {
    const response = await api.delete(`/products/${id}`)

    return response.data
  }

  return {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}
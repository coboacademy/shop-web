// Backup of app/composables/useProduct.ts
// Original file moved during product removal.

import type { AxiosResponse } from 'axios'
import { useApi } from './useApi'

export type ProductItem = {
  id: number | string
  name: string
  sku?: string
  description?: string | null
  price: number
  stock: number
  status?: string
  image?: string | null
  image_url?: string | null
  created_at?: string | number | null
}

export type GetProductsResponse = {
  products: ProductItem[]
  stats?: {
    total_products?: number
    active_products?: number
  }
}

export const useProduct = () => {
  const api = useApi()

  const getProducts = (params: Record<string, any> = {}) => {
    return api.get<GetProductsResponse>('/products', { params })
  }

  const createProduct = (payload: Record<string, any>) => api.post('/products', payload)
  const updateProduct = (id: string | number, payload: Record<string, any>) => api.put(`/products/${id}`, payload)
  const deleteProduct = (id: string | number) => api.delete(`/products/${id}`)

  return {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  }
}

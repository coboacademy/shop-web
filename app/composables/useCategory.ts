import type { ProductCategory } from "./useProduct";

export interface CategoryItem extends ProductCategory {
  icon?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CategoryFilters {
  search?: string;
  page?: number;
  per_page?: number;
}

export interface CategoryPayload {
  name: string;
  slug: string;
  parent_id: string | null;
  description: string;
  image: string;
  icon: string;
  is_active: boolean;
}

export interface CategoryListResponse {
  status: string;
  message: string;
  data: {
    categories: CategoryItem[];
    pagination?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
    stats?: {
      total_categories: number;
    };
  };
}

export const useCategory = () => {
  const api = useApi();

  const getCategories = async (filters: CategoryFilters = {}) => {
    const response = await api.get<CategoryListResponse>("/categories", {
      params: filters,
    });

    return response.data;
  };

  const createCategory = async (payload: CategoryPayload) => {
    const response = await api.post("/categories", payload);

    return response.data;
  };

  const updateCategory = async (id: string, payload: CategoryPayload) => {
    const response = await api.put(`/categories/${encodeURIComponent(id)}`, payload);

    return response.data;
  };

  const deleteCategory = async (id: string) => {
    const response = await api.delete(`/categories/${encodeURIComponent(id)}`);

    return response.data;
  };

  return {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};

import type { ProductCategory } from "./useProduct";

export interface CategoryItem extends ProductCategory {
  image_url?: string | null;
  icon?: string | null;
  icon_url?: string | null;
  parent?: CategoryItem | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CategoryFilters {
  page?: number;
  per_page?: number;
}

export interface CategoryPayload {
  name?: string;
  parent_id?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export interface CategoryListResponse {
  status: string;
  message: string;
  data: {
    categories: CategoryItem[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

export interface CategoryTreeResponse {
  status: string;
  message: string;
  data: {
    categories: CategoryItem[];
  };
}

export interface CategoryResourceResponse {
  status: string;
  message: string;
  data: {
    category: CategoryItem;
  };
}

export interface CategoryChildrenResponse {
  status: string;
  message: string;
  data: {
    categories: CategoryItem[];
  };
}

export interface CategoryDeleteResponse {
  status: string;
  message: string;
  data: [];
}

export const useCategory = () => {
  const api = useApi();
  const categoryPath = "/admin/categories";

  const getCategories = async (filters: CategoryFilters = {}) => {
    const response = await api.get<CategoryListResponse>(categoryPath, {
      params: filters,
    });

    return response.data;
  };

  const getCategoryTree = async () => {
    const response = await api.get<CategoryTreeResponse>(`${categoryPath}/tree`);

    return response.data;
  };

  const getCategory = async (id: string) => {
    const response = await api.get<CategoryResourceResponse>(
      `${categoryPath}/${encodeURIComponent(id)}`
    );

    return response.data;
  };

  const getCategoryChildren = async (id: string) => {
    const response = await api.get<CategoryChildrenResponse>(
      `${categoryPath}/${encodeURIComponent(id)}/children`
    );

    return response.data;
  };

  const createCategory = async (
    payload: Pick<CategoryPayload, "name" | "parent_id" | "description">
  ) => {
    const response = await api.post<CategoryResourceResponse>(categoryPath, payload);

    return response.data;
  };

  const updateCategory = async (id: string, payload: CategoryPayload) => {
    const response = await api.patch<CategoryResourceResponse>(
      `${categoryPath}/${encodeURIComponent(id)}`,
      payload
    );

    return response.data;
  };

  const deleteCategory = async (id: string) => {
    const response = await api.delete<CategoryDeleteResponse>(
      `${categoryPath}/${encodeURIComponent(id)}`
    );

    return response.data;
  };

  const uploadCategoryImage = async (id: string, file: File) => {
    const body = new FormData();
    body.append("image", file);
    const response = await api.post<CategoryResourceResponse>(
      `${categoryPath}/${encodeURIComponent(id)}/image`,
      body
    );

    return response.data;
  };

  const deleteCategoryImage = async (id: string) => {
    const response = await api.delete<CategoryResourceResponse>(
      `${categoryPath}/${encodeURIComponent(id)}/image`
    );

    return response.data;
  };

  const uploadCategoryIcon = async (id: string, file: File) => {
    const body = new FormData();
    body.append("icon", file);
    const response = await api.post<CategoryResourceResponse>(
      `${categoryPath}/${encodeURIComponent(id)}/icon`,
      body
    );

    return response.data;
  };

  const deleteCategoryIcon = async (id: string) => {
    const response = await api.delete<CategoryResourceResponse>(
      `${categoryPath}/${encodeURIComponent(id)}/icon`
    );

    return response.data;
  };

  return {
    getCategories,
    getCategoryTree,
    getCategory,
    getCategoryChildren,
    createCategory,
    updateCategory,
    deleteCategory,
    uploadCategoryImage,
    deleteCategoryImage,
    uploadCategoryIcon,
    deleteCategoryIcon,
  };
};

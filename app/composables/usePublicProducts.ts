import { isAxiosError } from "axios";
import { useApi } from "./useApi";

export interface PublicProductStore {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
}

export interface PublicProductCategory {
  id: number | string;
  name: string;
  slug: string;
}

export interface PublicProductImage {
  id: number | string;
  product_id: string;
  image: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PublicProductOptionValue {
  id: number | string;
  option_id: number | string;
  value: string;
  color_code: string | null;
  image: string | null;
  sort_order: number;
}

export interface PublicProductOption {
  id: number | string;
  product_id: string;
  name: string;
  display_type: string;
  sort_order: number;
  values: PublicProductOptionValue[];
}

export interface PublicProductVariant {
  id: number | string;
  product_id: string;
  sku: string;
  price: string;
  compare_at_price: string | null;
  is_active: boolean;
  sort_order: number;
  option_values: PublicProductOptionValue[];
  inventory?: {
    available_quantity: number;
    is_out_of_stock: boolean;
    is_low_stock: boolean;
  } | null;
}

export interface PublicProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compare_at_price: string | null;
  store: PublicProductStore | null;
  categories: PublicProductCategory[];
  images: PublicProductImage[];
  options?: PublicProductOption[];
  variants?: PublicProductVariant[];
  created_at: string;
}

export interface PublicProductPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PublicProductReview {
  id: number;
  product_id: string;
  rating: number;
  comment: string | null;
  customer: {
    id: number;
    name: string;
  };
  created_at: string;
}

export interface PublicProductQuestion {
  id: number;
  product_id: string;
  question: string;
  answer: string | null;
  customer: {
    id: number;
    name: string;
  };
  answered_by?: {
    id: number;
    name: string;
  } | null;
  answered_at: string | null;
  created_at: string;
  updated_at?: string;
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

const normalizeError = (error: unknown, fallback: string) => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return {
      message: error.response?.data?.message || fallback,
      errors: error.response?.data?.errors || {},
      status: error.response?.status || 500,
    };
  }

  return {
    message: error instanceof Error ? error.message : fallback,
    errors: {},
    status: 500,
  };
};

export interface PublicProductFilters {
  search?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  per_page?: number;
}

export const usePublicProducts = () => {
  const api = useApi();

  const getProducts = async (filters: PublicProductFilters = {}) => {
    try {
      const response = await api.get<
        ApiResponse<{
          products: PublicProduct[];
          pagination: PublicProductPagination;
        }>
      >("/products", { params: filters });
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to load products.");
    }
  };

  const getProduct = async (productId: string) => {
    try {
      const response = await api.get<
        ApiResponse<{ product: PublicProduct }>
      >(`/products/${encodeURIComponent(productId)}`);
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to load this product.");
    }
  };

  const getProductReviews = async (productId: string, page = 1) => {
    try {
      const response = await api.get<
        ApiResponse<{ reviews: PublicProductReview[] }>
      >(`/products/${encodeURIComponent(productId)}/reviews`, {
        params: { page, per_page: 10 },
      });
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to load product reviews.");
    }
  };

  const getProductQuestions = async (productId: string, page = 1) => {
    try {
      const response = await api.get<
        ApiResponse<{ questions: PublicProductQuestion[] }>
      >(`/products/${encodeURIComponent(productId)}/questions`, {
        params: { page, per_page: 10 },
      });
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to load product questions.");
    }
  };

  const createProductQuestion = async (payload: {
    product_id: string;
    question: string;
  }) => {
    try {
      const response = await api.post<
        ApiResponse<{ question: PublicProductQuestion }>
      >("/questions", payload);
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to submit your question.");
    }
  };

  return {
    getProducts,
    getProduct,
    getProductReviews,
    getProductQuestions,
    createProductQuestion,
  };
};

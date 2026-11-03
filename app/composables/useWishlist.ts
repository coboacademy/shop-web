import { isAxiosError } from "axios";
import { useApi } from "./useApi";

export interface WishlistProduct {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  sku: string;
  short_description: string | null;
  description: string | null;
  price: string;
  compare_at_price: string | null;
  status: string;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: number;
  product_id: string;
  product: WishlistProduct;
  created_at: string;
}

export interface WishlistPagination {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface WishlistPage {
  data: WishlistItem[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: WishlistPagination;
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

export interface WishlistApiError {
  message: string;
  errors: Record<string, string[]>;
  status: number;
}

const normalizeError = (error: unknown, fallback: string): WishlistApiError => {
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

export const useWishlist = () => {
  const api = useApi();

  const getWishlist = async (page = 1) => {
    try {
      const response = await api.get<ApiResponse<{ wishlist: WishlistPage }>>(
        "/wishlist",
        { params: { page } },
      );
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to load your wishlist.");
    }
  };

  const addItem = async (productId: string) => {
    try {
      const response = await api.post<
        ApiResponse<{ wishlist_item: WishlistItem }>
      >("/wishlist", { product_id: productId });
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Could not add this product to your wishlist.");
    }
  };

  const removeItem = async (productId: string) => {
    try {
      const response = await api.delete<ApiResponse<[]>>(
        `/wishlist/${encodeURIComponent(productId)}`,
      );
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Could not remove this product from your wishlist.");
    }
  };

  const clearWishlist = async () => {
    try {
      const response = await api.delete<ApiResponse<[]>>("/wishlist");
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Could not clear your wishlist.");
    }
  };

  const toggleProduct = async (productId: string) => {
    try {
      const response = await api.post<
        ApiResponse<{ added: boolean }>
      >(`/wishlist/toggle/${encodeURIComponent(productId)}`);
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Could not update your wishlist.");
    }
  };

  return {
    getWishlist,
    addItem,
    removeItem,
    clearWishlist,
    toggleProduct,
  };
};

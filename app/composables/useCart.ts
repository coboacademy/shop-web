import { isAxiosError } from "axios";
import { useApi } from "./useApi";

export interface CartItemProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: string;
}

export interface CartItemVariant {
  id: string;
  sku: string;
  price: string;
  is_active: boolean;
}

export interface CartItem {
  id: number;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: string;
  line_total: string;
  product: CartItemProduct;
  variant: CartItemVariant | null;
  created_at: string;
  updated_at: string;
}

export interface UserCart {
  id: number;
  user_id: number;
  total_items: number;
  subtotal: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

export interface CartResponse {
  status: string;
  message: string;
  data: {
    cart: UserCart;
  };
}

export interface CartApiError {
  message: string;
  errors: Record<string, string[]>;
  status: number;
}

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

const normalizeError = (error: unknown, fallback: string): CartApiError => {
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

export const useCart = () => {
  const api = useApi();

  const getCart = async (): Promise<CartResponse> => {
    try {
      const response = await api.get<CartResponse>("/cart");
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to load your cart.");
    }
  };

  const addItem = async (payload: {
    product_id: string;
    variant_id?: string | null;
    quantity: number;
  }): Promise<CartResponse> => {
    try {
      const response = await api.post<CartResponse>("/cart/items", payload);
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to add this item to your cart.");
    }
  };

  const updateItem = async (
    itemId: number,
    quantity: number,
  ): Promise<CartResponse> => {
    try {
      const response = await api.patch<CartResponse>(
        `/cart/items/${itemId}`,
        { quantity },
      );
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to update this cart item.");
    }
  };

  const removeItem = async (itemId: number): Promise<CartResponse> => {
    try {
      const response = await api.delete<CartResponse>(`/cart/items/${itemId}`);
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to remove this cart item.");
    }
  };

  const clearCart = async (): Promise<CartResponse> => {
    try {
      const response = await api.delete<CartResponse>("/cart");
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to clear your cart.");
    }
  };

  return {
    getCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
  };
};

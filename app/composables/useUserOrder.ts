import { isAxiosError } from "axios";
import { useApi } from "./useApi";
import type { CheckoutShipping } from "./useCheckout";

export interface UserOrderListItem {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: string;
  shipping_fee: string;
  discount: string;
  total: string;
  shipping: CheckoutShipping;
  customer_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserOrder extends UserOrderListItem {
  items: Array<{
    id: number;
    product_id: string;
    variant_id: string | null;
    vendor_id: number | string;
    store_id: number | string;
    product_name: string;
    variant_name: string | null;
    sku: string | null;
    quantity: number;
    unit_price: string;
    subtotal: string;
    total: string;
  }>;
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

export interface UserOrderApiError {
  message: string;
  errors: Record<string, string[]>;
  status: number;
}

const normalizeError = (error: unknown, fallback: string): UserOrderApiError => {
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

export const useUserOrder = () => {
  const api = useApi();

  const getOrders = async (page = 1) => {
    try {
      const response = await api.get<ApiResponse<{ orders: UserOrderListItem[] }>>(
        "/orders",
        { params: { page } },
      );
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to load your orders.");
    }
  };

  const getOrder = async (orderId: number) => {
    try {
      const response = await api.get<ApiResponse<{ order: UserOrder }>>(
        `/orders/${orderId}`,
      );
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to load order details.");
    }
  };

  return {
    getOrders,
    getOrder,
  };
};

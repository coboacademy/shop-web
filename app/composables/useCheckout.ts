import { isAxiosError } from "axios";
import { useApi } from "./useApi";
import type { CartItem } from "./useCart";

export interface CheckoutShipping {
  name: string;
  phone: string;
  country: string;
  province: string;
  city: string;
  address: string;
  postal_code: string | null;
}

export interface CheckoutSummary {
  items: CartItem[];
  shipping: CheckoutShipping | null;
  subtotal: string;
  shipping_fee: string;
  discount: string;
  total: string;
}

export interface CheckoutPayload {
  shipping_name: string;
  shipping_phone: string;
  shipping_country: string;
  shipping_province: string;
  shipping_city: string;
  shipping_address: string;
  shipping_postal_code: string | null;
}

export interface CreateOrderPayload extends CheckoutPayload {
  customer_note?: string | null;
}

export interface CreatedOrder {
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
  created_at: string;
  updated_at: string;
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

export interface CheckoutApiError {
  message: string;
  errors: Record<string, string[]>;
  status: number;
}

const normalizeError = (
  error: unknown,
  fallback: string,
): CheckoutApiError => {
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

export const useCheckout = () => {
  const api = useApi();

  const getCheckout = async () => {
    try {
      const response = await api.get<ApiResponse<{ checkout: CheckoutSummary }>>(
        "/checkout",
      );
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to load checkout.");
    }
  };

  const validateCheckout = async (payload: CheckoutPayload) => {
    try {
      const response = await api.post<
        ApiResponse<{ checkout: CheckoutSummary }>
      >("/checkout/validate", payload);
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Checkout validation failed.");
    }
  };

  const createOrder = async (payload: CreateOrderPayload) => {
    try {
      const response = await api.post<ApiResponse<{ order: CreatedOrder }>>(
        "/orders",
        payload,
      );
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Could not place your order.");
    }
  };

  return {
    getCheckout,
    validateCheckout,
    createOrder,
  };
};

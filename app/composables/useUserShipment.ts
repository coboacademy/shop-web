import { isAxiosError } from "axios";
import { useApi } from "./useApi";

export type UserShipmentStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface UserShipmentItem {
  id: number;
  order_item_id: number;
  quantity: number;
  product_name: string | null;
  variant_name: string | null;
  sku: string | null;
}

export interface UserShipment {
  id: number;
  order_id: number;
  store_id: string;
  status: UserShipmentStatus | string;
  tracking_number: string | null;
  carrier: string | null;
  shipping_fee: string;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  items: UserShipmentItem[];
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

export interface UserShipmentApiError {
  message: string;
  errors: Record<string, string[]>;
  status: number;
}

const normalizeError = (
  error: unknown,
  fallback: string,
): UserShipmentApiError => {
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

export const useUserShipment = () => {
  const api = useApi();

  const getOrderShipments = async (orderId: number) => {
    try {
      const response = await api.get<ApiResponse<{ shipments: UserShipment[] }>>(
        `/shipments/order/${orderId}`,
      );
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to load shipments for this order.");
    }
  };

  return { getOrderShipments };
};

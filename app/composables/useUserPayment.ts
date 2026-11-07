import { isAxiosError } from "axios";
import { useApi } from "./useApi";

export type UserPaymentMethod =
  | "cash_on_delivery"
  | "bank_transfer"
  | "online";

export interface UserPayment {
  id: number;
  order_id: number;
  method: UserPaymentMethod | string;
  status: string;
  amount: string;
  transaction_id: string | null;
  provider: string | null;
  paid_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  created_at: string;
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

export interface UserPaymentApiError {
  message: string;
  errors: Record<string, string[]>;
  status: number;
}

const normalizeError = (
  error: unknown,
  fallback: string,
): UserPaymentApiError => {
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

export const useUserPayment = () => {
  const api = useApi();

  const createPayment = async (payload: {
    order_id: number;
    method: UserPaymentMethod;
    provider?: string | null;
  }) => {
    try {
      const response = await api.post<ApiResponse<{ payment: UserPayment }>>(
        "/payments",
        payload,
      );
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Could not create a payment record.");
    }
  };

  const getPayment = async (paymentId: number) => {
    try {
      const response = await api.get<ApiResponse<{ payment: UserPayment }>>(
        `/payments/${paymentId}`,
      );
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Could not load payment details.");
    }
  };

  return {
    createPayment,
    getPayment,
  };
};

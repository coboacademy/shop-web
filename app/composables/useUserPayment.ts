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

export type UserPaymentMetadata = Record<string, unknown> | unknown[];

export interface CreateUserPaymentPayload {
  order_id: number;
  method: UserPaymentMethod;
  metadata?: UserPaymentMetadata | null;
}

export interface DemoPayment {
  order_reference: string;
  amount: string;
  status: "pending" | "paid" | "failed";
  expires_at: string;
}

export interface UserPaymentApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface CreateUserPaymentResponse
  extends UserPaymentApiResponse<{
    payment: UserPayment;
    payment_url: string;
  }> {}

export interface DemoPaymentResponse
  extends UserPaymentApiResponse<{ payment: DemoPayment }> {}

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

  const createPayment = async (payload: CreateUserPaymentPayload) => {
    try {
      const response = await api.post<CreateUserPaymentResponse>(
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
      const response = await api.get<
        UserPaymentApiResponse<{ payment: UserPayment }>
      >(`/payments/${paymentId}`);
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Could not load payment details.");
    }
  };

  const getDemoPayment = async (token: string) => {
    try {
      const response = await api.get<DemoPaymentResponse>(
        `/payments/demo/${encodeURIComponent(token)}`,
      );
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Could not load this demo payment.");
    }
  };

  const succeedDemoPayment = async (token: string) => {
    try {
      const response = await api.post<DemoPaymentResponse>(
        `/payments/demo/${encodeURIComponent(token)}/success`,
      );
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Could not complete this demo payment.");
    }
  };

  const failDemoPayment = async (token: string) => {
    try {
      const response = await api.post<DemoPaymentResponse>(
        `/payments/demo/${encodeURIComponent(token)}/failure`,
      );
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Could not record this demo payment failure.");
    }
  };

  return {
    createPayment,
    getPayment,
    getDemoPayment,
    succeedDemoPayment,
    failDemoPayment,
  };
};

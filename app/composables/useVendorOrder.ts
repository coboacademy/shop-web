export type VendorOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "cancelled"
  | "delivered";

export interface VendorOrderItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  vendor_id: string;
  store_id: string;
  product_name: string;
  variant_name: string | null;
  sku: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
  total: string;
}

export interface VendorOrderShipping {
  name: string;
  phone: string;
  country: string;
  province: string;
  city: string;
  address: string;
  postal_code: string;
}

export interface VendorOrder {
  id: number;
  order_number: string;
  status: VendorOrderStatus;
  payment_status: string;
  items: VendorOrderItem[];
  shipping: VendorOrderShipping;
  created_at: string;
}

export interface VendorOrderPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface VendorOrderListResponse {
  status: string;
  message: string;
  data: {
    orders: {
      data: VendorOrder[];
      meta: VendorOrderPagination;
    };
  };
}

export interface VendorOrderResponse {
  status: string;
  message: string;
  data: {
    order: VendorOrder;
  };
}

export const useVendorOrder = () => {
  const api = useApi();

  const formatError = (error: any, fallback: string) => ({
    message: error.response?.data?.message || fallback,
    errors: error.response?.data?.errors || {},
    status: error.response?.status || 500,
  });

  const getOrders = async (page = 1): Promise<VendorOrderListResponse> => {
    try {
      const response = await api.get<VendorOrderListResponse>("/vendor/orders", {
        params: { page },
      });
      return response.data;
    } catch (error: any) {
      throw formatError(error, "Failed to fetch vendor orders");
    }
  };

  const getOrder = async (id: number): Promise<VendorOrderResponse> => {
    try {
      const response = await api.get<VendorOrderResponse>(`/vendor/orders/${id}`);
      return response.data;
    } catch (error: any) {
      throw formatError(error, "Failed to fetch vendor order");
    }
  };

  const updateOrderStatus = async (
    id: number,
    status: VendorOrderStatus,
  ): Promise<VendorOrderResponse> => {
    try {
      const response = await api.patch<VendorOrderResponse>(
        `/vendor/orders/${id}/status`,
        { status },
      );
      return response.data;
    } catch (error: any) {
      throw formatError(error, "Failed to update order status");
    }
  };

  return {
    getOrders,
    getOrder,
    updateOrderStatus,
  };
};

import { useApi } from "./useApi";

export interface Product {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  sku: string;
  short_description: string;
  description: string;
  price: string;
  compare_at_price: string;
  status: string;
  is_featured: boolean;
  published_at: string | null;
  categories?: ProductCategory[];
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  image_url?: string | null;
  icon?: string | null;
  icon_url?: string | null;
  is_active?: boolean;
  children?: ProductCategory[];
}

export interface ProductCategoryTreeResponse {
  status: string;
  message: string;
  data: {
    categories: ProductCategory[];
  };
}

export interface ProductCategorySyncResponse {
  status: string;
  message: string;
  data: {
    categories: ProductCategory[];
  };
}

export interface ProductPagination {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface ProductListResponse {
  status: string;
  message: string;
  data: {
    products: Product[];
    pagination?: ProductPagination;
  };
}

export interface ProductResponse {
  status: string;
  message: string;
  data: {
    product: Partial<Product>;
  };
}

export interface ProductInventory {
  id: string;
  product_id: string;
  sku: string;
  quantity: number;
  reserved_quantity: number | null;
  available_quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  variant_id: string | null;
  created_at: string;
  updated_at: string;
  product: Product;
}

export interface ProductInventoryResponse {
  status: string;
  message: string;
  data: {
    inventory: ProductInventory;
  };
}

export interface ProductInventoryPayload {
  quantity: number;
  low_stock_threshold: number;
}

export interface ProductStockChangePayload {
  quantity: number;
  reason?: string;
}

export interface ProductInventoryMovement {
  id: string;
  inventory_id: string;
  type: "stock_in" | "stock_out" | "adjustment" | string;
  quantity: number;
  before_quantity: number;
  after_quantity: number;
  reason: string;
  reference_type: string | null;
  reference_id: string | null;
  created_by: number;
  creator?: {
    id: number;
    name: string;
    email: string;
    status: string;
    created_at: string;
    updated_at: string;
  } | null;
  created_at: string;
}

export interface ProductInventoryMovementsResponse {
  status: string;
  message: string;
  data: {
    movements: ProductInventoryMovement[];
  };
}

export type VendorInventoryPagination = ProductPagination;

export interface VendorInventoryListResponse {
  status: string;
  message: string;
  data: {
    inventories: ProductInventory[];
    pagination?: VendorInventoryPagination;
  };
}

export interface ProductImage {
  id: string;
  product_id: string;
  image: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImagesResponse {
  status: string;
  message: string;
  data: {
    images: ProductImage[];
  };
}

export interface ProductImageResponse {
  status: string;
  message: string;
  data: {
    image: ProductImage;
  };
}

export interface ProductVariantOptionValue {
  id: string;
  option_id: string;
  value: string;
  color_code: string | null;
  image: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  display_type: string;
  sort_order: number;
  values: ProductVariantOptionValue[];
  created_at: string;
  updated_at: string;
}

export interface ProductOptionsResponse {
  status: string;
  message: string;
  data: {
    options: ProductOption[];
  };
}

export interface ProductOptionResponse {
  status: string;
  message: string;
  data: {
    option: ProductOption;
  };
}

export interface ProductOptionPayload {
  name: string;
  display_type: string;
  sort_order: number;
}

export interface ProductOptionValueResponse {
  status: string;
  message: string;
  data: {
    value: ProductVariantOptionValue;
  };
}

export interface ProductOptionValuesResponse {
  status: string;
  message: string;
  data: {
    values: ProductVariantOptionValue[];
  };
}

export interface ProductOptionValuePayload {
  value: string;
  color_code?: string;
  sort_order?: number;
}

export interface ProductVariantInventory {
  id: string;
  quantity: number;
  reserved_quantity: number | null;
  available_quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  price: string;
  compare_at_price: string;
  is_active: boolean;
  sort_order: number;
  option_values: ProductVariantOptionValue[];
  inventory: ProductVariantInventory | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariantsResponse {
  status: string;
  message: string;
  data: {
    variants: ProductVariant[];
  };
}

export interface ProductVariantResponse {
  status: string;
  message: string;
  data: {
    variant: ProductVariant;
  };
}

export interface ProductVariantPayload {
  sku: string;
  price: number;
  compare_at_price?: number;
  is_active: boolean;
  sort_order?: number;
  option_value_ids: string[];
  inventory: {
    quantity: number;
    low_stock_threshold: number;
  };
}

export interface ProductPayload {
  name: string;
  sku: string;
  short_description: string;
  description: string;
  price: number;
  compare_at_price?: number;
}

export const useProduct = () => {
  const api = useApi();

  const getProductPath = (storeId: string, productId: string) =>
    `/vendor/stores/${encodeURIComponent(storeId)}/products/${encodeURIComponent(productId)}`;
  const getProductImagesPath = (storeId: string, productId: string) =>
    `${getProductPath(storeId, productId)}/images`;

  const getVendorCategoryTree = async (): Promise<ProductCategoryTreeResponse> => {
    try {
      const response = await api.get<ProductCategoryTreeResponse>("/vendor/categories/tree");
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to fetch category tree",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const syncStoreProductCategories = async (
    storeId: string,
    productId: string,
    categoryIds: string[],
  ): Promise<ProductCategorySyncResponse> => {
    try {
      const response = await api.put<ProductCategorySyncResponse>(
        `${getProductPath(storeId, productId)}/categories`,
        { category_ids: categoryIds },
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to update product categories",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const getStoreProducts = async (
    storeId: string,
    params: { page?: number; per_page?: number } = {},
  ): Promise<ProductListResponse> => {
    try {
      const response = await api.get<{
        status: string;
        message: string;
        data: {
          products:
            | Product[]
            | {
                data: Product[];
                meta?: ProductPagination;
              };
        };
      }>(
        `/vendor/stores/${encodeURIComponent(storeId)}/products`,
        { params },
      );

      const productCollection = response.data.data?.products;
      if (Array.isArray(productCollection)) {
        return {
          ...response.data,
          data: { products: productCollection },
        };
      }

      if (!productCollection || !Array.isArray(productCollection.data)) {
        throw new Error('The products API returned an invalid product collection.');
      }

      return {
        ...response.data,
        data: {
          products: productCollection.data,
          pagination: productCollection.meta,
        },
      };
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch products",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const getStoreProduct = async (
    storeId: string,
    productId: string,
  ): Promise<ProductResponse> => {
    try {
      const response = await api.get<ProductResponse>(getProductPath(storeId, productId));
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to fetch product",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const getProductInventory = async (
    productId: string,
  ): Promise<ProductInventoryResponse> => {
    try {
      const response = await api.get<ProductInventoryResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/inventory`,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to fetch product inventory",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const createProductInventory = async (
    productId: string,
    payload: ProductInventoryPayload,
  ): Promise<ProductInventoryResponse> => {
    try {
      const response = await api.post<ProductInventoryResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/inventory`,
        payload,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to create product inventory",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const updateProductInventory = async (
    productId: string,
    payload: ProductStockChangePayload,
  ): Promise<ProductInventoryResponse> => {
    try {
      const response = await api.patch<ProductInventoryResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/inventory`,
        payload,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to update product inventory",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const postProductStockChange = async (
    productId: string,
    action: "add-stock" | "remove-stock" | "adjust-stock",
    payload: ProductStockChangePayload,
  ): Promise<ProductInventoryResponse> => {
    try {
      const response = await api.post<ProductInventoryResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/inventory/${action}`,
        payload,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || `Failed to ${action.replace("-", " ")} for product inventory`,
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const addProductStock = (productId: string, payload: ProductStockChangePayload) =>
    postProductStockChange(productId, "add-stock", payload);

  const removeProductStock = (productId: string, payload: ProductStockChangePayload) =>
    postProductStockChange(productId, "remove-stock", payload);

  const adjustProductStock = (productId: string, payload: ProductStockChangePayload) =>
    postProductStockChange(productId, "adjust-stock", payload);

  const postVariantStockChange = async (
    productId: string,
    variantId: string,
    action: "add-stock" | "remove-stock" | "adjust-stock",
    payload: ProductStockChangePayload,
  ): Promise<ProductInventoryResponse> => {
    try {
      const response = await api.post<ProductInventoryResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/inventory/${action}`,
        payload,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || `Failed to ${action.replace("-", " ")} for variant inventory`,
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const addVariantStock = (
    productId: string,
    variantId: string,
    payload: ProductStockChangePayload,
  ) => postVariantStockChange(productId, variantId, "add-stock", payload);

  const removeVariantStock = (
    productId: string,
    variantId: string,
    payload: ProductStockChangePayload,
  ) => postVariantStockChange(productId, variantId, "remove-stock", payload);

  const adjustVariantStock = async (
    productId: string,
    variantId: string,
    payload: ProductStockChangePayload,
  ): Promise<ProductInventoryResponse> => {
    try {
      const response = await api.patch<ProductInventoryResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/inventory/adjust-stock`,
        payload,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to adjust variant inventory",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const getVariantInventory = async (
    productId: string,
    variantId: string,
  ): Promise<ProductInventoryResponse> => {
    try {
      const response = await api.get<ProductInventoryResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/inventory`,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to fetch variant inventory",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const getProductInventoryMovements = async (
    productId: string,
  ): Promise<ProductInventoryMovementsResponse> => {
    try {
      const response = await api.get<ProductInventoryMovementsResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/inventory/movements`,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to fetch inventory movements",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const getVariantInventoryMovements = async (
    productId: string,
    variantId: string,
  ): Promise<ProductInventoryMovementsResponse> => {
    try {
      const response = await api.get<ProductInventoryMovementsResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/inventory/movements`,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to fetch variant inventory movements",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const getVendorInventories = async (
    params: { page?: number; per_page?: number } = {},
  ): Promise<VendorInventoryListResponse> => {
    try {
      const response = await api.get<VendorInventoryListResponse>("/vendor/inventories", { params });
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to fetch inventories",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const getVendorLowStockInventories = async (): Promise<VendorInventoryListResponse> => {
    try {
      const response = await api.get<VendorInventoryListResponse>("/vendor/inventories/low-stock");
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to fetch low-stock inventories",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const getVendorOutOfStockInventories = async (): Promise<VendorInventoryListResponse> => {
    try {
      const response = await api.get<VendorInventoryListResponse>("/vendor/inventories/out-of-stock");
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to fetch out-of-stock inventories",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const createStoreProduct = async (
    storeId: string,
    payload: ProductPayload,
  ): Promise<ProductResponse> => {
    try {
      const response = await api.post<ProductResponse>(
        `/vendor/stores/${encodeURIComponent(storeId)}/products`,
        payload,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to create product",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const updateStoreProduct = async (
    storeId: string,
    productId: string,
    payload: Partial<ProductPayload>,
  ): Promise<ProductResponse> => {
    try {
      const response = await api.patch<ProductResponse>(
        getProductPath(storeId, productId),
        payload,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to update product",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const deleteStoreProduct = async (
    storeId: string,
    productId: string,
  ): Promise<{ status: string; message: string; data: unknown }> => {
    try {
      const response = await api.delete<{ status: string; message: string; data: unknown }>(
        getProductPath(storeId, productId),
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to delete product",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const setStoreProductActive = async (
    storeId: string,
    productId: string,
    active: boolean,
  ): Promise<ProductResponse> => {
    try {
      const action = active ? "activate" : "deactivate";
      const response = await api.patch<ProductResponse>(
        `${getProductPath(storeId, productId)}/${action}`,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message:
          error.response?.data?.message ||
          `Failed to ${active ? "activate" : "deactivate"} product`,
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const getStoreProductImages = async (
    storeId: string,
    productId: string,
  ): Promise<ProductImagesResponse> => {
    try {
      const response = await api.get<ProductImagesResponse>(
        getProductImagesPath(storeId, productId),
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to fetch product images",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const getStoreProductVariants = async (
    productId: string,
  ): Promise<ProductVariantsResponse> => {
    try {
      const response = await api.get<ProductVariantsResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/variants`,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to fetch product variants",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const getStoreProductOptions = async (
    productId: string,
  ): Promise<ProductOptionsResponse> => {
    try {
      const response = await api.get<ProductOptionsResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/options`,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to fetch product options",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const createStoreProductOption = async (
    productId: string,
    payload: ProductOptionPayload,
  ): Promise<ProductOptionResponse> => {
    try {
      const response = await api.post<ProductOptionResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/options`,
        payload,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to create product option",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const updateStoreProductOption = async (
    productId: string,
    optionId: string,
    payload: Partial<ProductOptionPayload>,
  ): Promise<ProductOptionResponse> => {
    try {
      const response = await api.patch<ProductOptionResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/options/${encodeURIComponent(optionId)}`,
        payload,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to update product option",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const deleteStoreProductOption = async (
    productId: string,
    optionId: string,
  ): Promise<{ status: string; message: string; data: unknown }> => {
    try {
      const response = await api.delete<{ status: string; message: string; data: unknown }>(
        `/vendor/products/${encodeURIComponent(productId)}/options/${encodeURIComponent(optionId)}`,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to delete product option",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const getStoreProductOptionValues = async (
    productId: string,
    optionId: string,
  ): Promise<ProductOptionValuesResponse> => {
    try {
      const response = await api.get<ProductOptionValuesResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/options/${encodeURIComponent(optionId)}/values`,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to fetch option values",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const createStoreProductOptionValue = async (
    productId: string,
    optionId: string,
    payload: ProductOptionValuePayload,
  ): Promise<ProductOptionValueResponse> => {
    try {
      const response = await api.post<ProductOptionValueResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/options/${encodeURIComponent(optionId)}/values`,
        payload,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to create option value",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const updateStoreProductOptionValue = async (
    productId: string,
    optionId: string,
    valueId: string,
    payload: Partial<ProductOptionValuePayload>,
  ): Promise<ProductOptionValueResponse> => {
    try {
      const response = await api.patch<ProductOptionValueResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/options/${encodeURIComponent(optionId)}/values/${encodeURIComponent(valueId)}`,
        payload,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to update option value",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const deleteStoreProductOptionValue = async (
    productId: string,
    optionId: string,
    valueId: string,
  ): Promise<{ status: string; message: string; data: unknown }> => {
    try {
      const response = await api.delete<{ status: string; message: string; data: unknown }>(
        `/vendor/products/${encodeURIComponent(productId)}/options/${encodeURIComponent(optionId)}/values/${encodeURIComponent(valueId)}`,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to delete option value",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const createStoreProductVariant = async (
    productId: string,
    payload: ProductVariantPayload,
  ): Promise<ProductVariantResponse> => {
    try {
      const response = await api.post<ProductVariantResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/variants`,
        payload,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to create product variant",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const updateStoreProductVariant = async (
    productId: string,
    variantId: string,
    payload: Partial<ProductVariantPayload>,
  ): Promise<ProductVariantResponse> => {
    try {
      const response = await api.patch<ProductVariantResponse>(
        `/vendor/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
        payload,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to update product variant",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const deleteStoreProductVariant = async (
    productId: string,
    variantId: string,
  ): Promise<{ status: string; message: string; data: unknown }> => {
    try {
      const response = await api.delete<{ status: string; message: string; data: unknown }>(
        `/vendor/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}`,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to delete product variant",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const uploadStoreProductImage = async (
    storeId: string,
    productId: string,
    file: File,
  ): Promise<ProductImageResponse> => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await api.post<ProductImageResponse>(
        getProductImagesPath(storeId, productId),
        formData,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to upload product image",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const setStoreProductPrimaryImage = async (
    storeId: string,
    productId: string,
    imageId: string,
  ): Promise<ProductImageResponse> => {
    try {
      const response = await api.patch<ProductImageResponse>(
        `${getProductImagesPath(storeId, productId)}/${encodeURIComponent(imageId)}/primary`,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to set primary product image",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  const deleteStoreProductImage = async (
    storeId: string,
    productId: string,
    imageId: string,
  ): Promise<{ status: string; message: string; data: unknown }> => {
    try {
      const response = await api.delete<{ status: string; message: string; data: unknown }>(
        `${getProductImagesPath(storeId, productId)}/${encodeURIComponent(imageId)}`,
      );
      return response.data;
    } catch (error: any) {
      throw {
        message: error.response?.data?.message || "Failed to delete product image",
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }
  };

  return {
    getVendorCategoryTree,
    syncStoreProductCategories,
    getStoreProducts,
    getStoreProduct,
    getProductInventory,
    createProductInventory,
    updateProductInventory,
    addProductStock,
    removeProductStock,
    adjustProductStock,
    addVariantStock,
    removeVariantStock,
    adjustVariantStock,
    getVariantInventory,
    getProductInventoryMovements,
    getVariantInventoryMovements,
    getVendorInventories,
    getVendorLowStockInventories,
    getVendorOutOfStockInventories,
    createStoreProduct,
    updateStoreProduct,
    deleteStoreProduct,
    setStoreProductActive,
    getStoreProductVariants,
    getStoreProductOptions,
    createStoreProductOption,
    updateStoreProductOption,
    deleteStoreProductOption,
    getStoreProductOptionValues,
    createStoreProductOptionValue,
    updateStoreProductOptionValue,
    deleteStoreProductOptionValue,
    createStoreProductVariant,
    updateStoreProductVariant,
    deleteStoreProductVariant,
    getStoreProductImages,
    uploadStoreProductImage,
    setStoreProductPrimaryImage,
    deleteStoreProductImage,
  };
};

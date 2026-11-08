import type {
  ProductInventory,
  ProductVariant,
  ProductVariantsResponse,
  ProductInventoryResponse,
} from "~/composables/useProduct";

type SummaryApi = {
  getStoreProductVariants: (productId: string) => Promise<ProductVariantsResponse>;
  getProductInventory: (productId: string) => Promise<ProductInventoryResponse>;
};

export type ProductInventorySummaryState =
  | "tracked"
  | "partially-tracked"
  | "not-tracked"
  | "unavailable";

export interface ProductInventorySummary {
  variantCount: number | null;
  trackedVariantCount: number | null;
  totalQuantity: number | null;
  inventory: Pick<
    ProductInventory,
    "quantity" | "reserved_quantity" | "available_quantity"
  > | null;
  state: ProductInventorySummaryState;
  failed: boolean;
}

const isValidQuantity = (quantity: unknown): quantity is number =>
  typeof quantity === "number" && Number.isFinite(quantity) && quantity >= 0;

const isNotFound = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "status" in error &&
  error.status === 404;

export const getProductInventorySummary = async (
  productId: string,
  api: SummaryApi,
): Promise<ProductInventorySummary> => {
  let variants: ProductVariant[];
  try {
    const response = await api.getStoreProductVariants(productId);
    if (!Array.isArray(response.data?.variants)) {
      return {
        variantCount: null,
        trackedVariantCount: null,
        totalQuantity: null,
        inventory: null,
        state: "unavailable",
        failed: true,
      };
    }
    variants = response.data.variants;
  } catch {
    return {
      variantCount: null,
      trackedVariantCount: null,
      totalQuantity: null,
      inventory: null,
      state: "unavailable",
      failed: true,
    };
  }

  if (variants.length > 0) {
    const trackedQuantities = variants.flatMap((variant) => {
      const quantity = variant.inventory?.quantity;
      return isValidQuantity(quantity) ? [quantity] : [];
    });
    const trackedVariantCount = trackedQuantities.length;
    const allTracked = trackedVariantCount === variants.length;
    return {
      variantCount: variants.length,
      trackedVariantCount,
      totalQuantity: allTracked
        ? trackedQuantities.reduce((total, quantity) => total + quantity, 0)
        : null,
      inventory: null,
      state:
        trackedVariantCount === 0
          ? "not-tracked"
          : allTracked
            ? "tracked"
            : "partially-tracked",
      failed: false,
    };
  }

  try {
    const response = await api.getProductInventory(productId);
    const inventory = response.data?.inventory;
    if (!inventory || !isValidQuantity(inventory.quantity)) {
      return {
        variantCount: 0,
        trackedVariantCount: 0,
        totalQuantity: null,
        inventory: null,
        state: "unavailable",
        failed: true,
      };
    }
    return {
      variantCount: 0,
      trackedVariantCount: 0,
      totalQuantity: null,
      inventory,
      state: "tracked",
      failed: false,
    };
  } catch (error) {
    const notFound = isNotFound(error);
    return {
      variantCount: 0,
      trackedVariantCount: 0,
      totalQuantity: null,
      inventory: null,
      state: notFound ? "not-tracked" : "unavailable",
      failed: !notFound,
    };
  }
};

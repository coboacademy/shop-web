import { describe, expect, it, vi } from "vitest";
import type {
  ProductInventoryResponse,
  ProductVariantsResponse,
} from "~/composables/useProduct";
import { getProductInventorySummary } from "./productInventorySummary";

const variantsResponse = (variants: ProductVariantsResponse["data"]["variants"]) =>
  ({ data: { variants } }) as ProductVariantsResponse;

const inventoryResponse = (
  inventory: NonNullable<ProductInventoryResponse["data"]["inventory"]>,
) => ({ data: { inventory } }) as ProductInventoryResponse;

const variant = (
  id: string,
  inventory: ProductVariantsResponse["data"]["variants"][number]["inventory"],
) =>
  ({
    id,
    product_id: "product-1",
    sku: `SKU-${id}`,
    price: "10.00",
    compare_at_price: "12.00",
    is_active: true,
    sort_order: 0,
    option_values: [],
    inventory,
    created_at: "",
    updated_at: "",
  }) as ProductVariantsResponse["data"]["variants"][number];

const variantInventory = {
  id: "inventory-1",
  quantity: 8,
  reserved_quantity: 2,
  available_quantity: 6,
  low_stock_threshold: 1,
  is_low_stock: false,
  is_out_of_stock: false,
};

describe("product inventory summaries", () => {
  it("loads product inventory only after determining the product has no variants", async () => {
    const simpleInventory = {
      ...variantInventory,
      product_id: "product-1",
      variant_id: null,
      sku: "SIMPLE",
      created_at: "",
      updated_at: "",
      product: {},
    };
    const api = {
      getStoreProductVariants: vi.fn().mockResolvedValue(variantsResponse([])),
      getProductInventory: vi.fn().mockResolvedValue(inventoryResponse(simpleInventory)),
    };

    const summary = await getProductInventorySummary("product-1", api);

    expect(api.getProductInventory).toHaveBeenCalledOnce();
    expect(summary.inventory?.quantity).toBe(8);
    expect(summary.state).toBe("tracked");
    expect(summary.failed).toBe(false);
  });

  it("treats a missing simple-product inventory record as not tracked", async () => {
    const api = {
      getStoreProductVariants: vi.fn().mockResolvedValue(variantsResponse([])),
      getProductInventory: vi.fn().mockRejectedValue({ status: 404 }),
    };

    const summary = await getProductInventorySummary("product-1", api);

    expect(summary.state).toBe("not-tracked");
    expect(summary.failed).toBe(false);
  });

  it("sums variant quantities only when every variant has inventory", async () => {
    const api = {
      getStoreProductVariants: vi.fn().mockResolvedValue(
        variantsResponse([
          variant("variant-1", variantInventory),
          variant("variant-2", { ...variantInventory, id: "inventory-2", quantity: 12 }),
        ]),
      ),
      getProductInventory: vi.fn(),
    };

    const summary = await getProductInventorySummary("product-1", api);

    expect(api.getProductInventory).not.toHaveBeenCalled();
    expect(summary.variantCount).toBe(2);
    expect(summary.trackedVariantCount).toBe(2);
    expect(summary.totalQuantity).toBe(20);
    expect(summary.state).toBe("tracked");
    expect(summary.failed).toBe(false);
  });

  it("reports partial tracking without summing the tracked variant quantities", async () => {
    const api = {
      getStoreProductVariants: vi.fn().mockResolvedValue(
        variantsResponse([
          variant("variant-1", variantInventory),
          variant("variant-2", null),
          variant("variant-3", { ...variantInventory, id: "invalid", quantity: Number.NaN }),
        ]),
      ),
      getProductInventory: vi.fn(),
    };

    const summary = await getProductInventorySummary("product-1", api);

    expect(summary.variantCount).toBe(3);
    expect(summary.trackedVariantCount).toBe(1);
    expect(summary.totalQuantity).toBeNull();
    expect(summary.state).toBe("partially-tracked");
    expect(summary.failed).toBe(false);
    expect(api.getProductInventory).not.toHaveBeenCalled();
  });

  it("marks variant products with no tracked quantities as not tracked", async () => {
    const api = {
      getStoreProductVariants: vi.fn().mockResolvedValue(
        variantsResponse([variant("variant-1", null), variant("variant-2", null)]),
      ),
      getProductInventory: vi.fn(),
    };

    const summary = await getProductInventorySummary("product-1", api);

    expect(summary.trackedVariantCount).toBe(0);
    expect(summary.totalQuantity).toBeNull();
    expect(summary.state).toBe("not-tracked");
    expect(summary.failed).toBe(false);
    expect(api.getProductInventory).not.toHaveBeenCalled();
  });

  it("reports inventory API failures while keeping missing records distinct", async () => {
    const api = {
      getStoreProductVariants: vi.fn().mockResolvedValue(variantsResponse([])),
      getProductInventory: vi.fn().mockRejectedValue({ status: 503 }),
    };

    const summary = await getProductInventorySummary("product-1", api);

    expect(summary.state).toBe("unavailable");
    expect(summary.failed).toBe(true);
  });

  it("does not request product inventory when variant detection fails", async () => {
    const api = {
      getStoreProductVariants: vi.fn().mockRejectedValue({ status: 401 }),
      getProductInventory: vi.fn(),
    };

    const summary = await getProductInventorySummary("product-1", api);

    expect(api.getProductInventory).not.toHaveBeenCalled();
    expect(summary.state).toBe("unavailable");
    expect(summary.failed).toBe(true);
  });
});

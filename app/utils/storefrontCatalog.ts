import type { PublicProduct } from "~/composables/usePublicProducts";

type StorefrontCategoryProduct = Pick<PublicProduct, "categories">;
type StorefrontPricedProduct = Pick<
  PublicProduct,
  "price" | "compare_at_price"
>;

export const getStorefrontCategories = (
  products: readonly StorefrontCategoryProduct[],
) => {
  const categories = new Map<
    string,
    StorefrontCategoryProduct["categories"][number]
  >();

  for (const product of products) {
    for (const category of product.categories) {
      const id = String(category.id);
      if (!categories.has(id)) categories.set(id, category);
    }
  }

  return [...categories.values()].slice(0, 8);
};

export const isStorefrontSpecialOffer = (product: StorefrontPricedProduct) => {
  const currentPrice = Number(product.price);
  const comparePrice = Number(product.compare_at_price);

  return (
    product.compare_at_price !== null &&
    Number.isFinite(currentPrice) &&
    Number.isFinite(comparePrice) &&
    comparePrice > currentPrice
  );
};

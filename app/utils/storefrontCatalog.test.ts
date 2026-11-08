// Runtime validation coverage for storefront category and offer data.
import { describe, expect, it } from "vitest";
import {
  getStorefrontCategories,
  isStorefrontSpecialOffer,
} from "./storefrontCatalog";

describe("storefront catalog data", () => {
  it("derives unique category links from product category data", () => {
    const category = { id: 8, name: "Home", slug: "home" };

    expect(
      getStorefrontCategories([
        { categories: [category] },
        { categories: [category, { id: "9", name: "Books", slug: "books" }] },
      ]),
    ).toEqual([
      category,
      { id: "9", name: "Books", slug: "books" },
    ]);
  });

  it("limits category links to the first eight unique categories", () => {
    const products = Array.from({ length: 10 }, (_, id) => ({
      categories: [{ id, name: `Category ${id}`, slug: `category-${id}` }],
    }));

    expect(getStorefrontCategories(products)).toHaveLength(8);
  });

  it("identifies offers only when a valid compare-at price exceeds the current price", () => {
    expect(
      isStorefrontSpecialOffer({
        price: "15.00",
        compare_at_price: "20.00",
      }),
    ).toBe(true);
    expect(
      isStorefrontSpecialOffer({
        price: "20.00",
        compare_at_price: "15.00",
      }),
    ).toBe(false);
    expect(
      isStorefrontSpecialOffer({
        price: "15.00",
        compare_at_price: null,
      }),
    ).toBe(false);
    expect(
      isStorefrontSpecialOffer({
        price: "unknown",
        compare_at_price: "20.00",
      }),
    ).toBe(false);
  });
});

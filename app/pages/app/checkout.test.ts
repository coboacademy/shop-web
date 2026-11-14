import { readFileSync } from "node:fs";
import { compileScript, parse } from "@vue/compiler-sfc";
import { transformSync } from "esbuild";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Ref } from "vue";
import type {
  CheckoutSummary,
  CreatedOrder,
} from "~/composables/useCheckout";
import type { CreateUserPaymentResponse } from "~/composables/useUserPayment";

const checkoutSummary: CheckoutSummary = {
  items: [
    {
      id: 8,
      product_id: "product-1",
      variant_id: null,
      quantity: 1,
      unit_price: "25.00",
      line_total: "25.00",
      product: {
        id: "product-1",
        name: "Demo product",
        slug: "demo-product",
        sku: "DEMO-1",
        price: "25.00",
      },
      variant: null,
      created_at: "2026-11-13T00:00:00.000000Z",
      updated_at: "2026-11-13T00:00:00.000000Z",
    },
  ],
  shipping: null,
  subtotal: "25.00",
  shipping_fee: "0.00",
  discount: "0.00",
  total: "25.00",
};

const createdOrder: CreatedOrder = {
  id: 42,
  order_number: "COBO-12345678",
  status: "pending",
  payment_status: "unpaid",
  subtotal: "25.00",
  shipping_fee: "0.00",
  discount: "0.00",
  total: "25.00",
  shipping: {
    name: "Alex Example",
    phone: "+1-555-0100",
    country: "Example Country",
    province: "Example Province",
    city: "Example City",
    address: "123 Example Street",
    postal_code: null,
  },
  customer_note: null,
  items: [
    {
      id: 71,
      product_id: "product-1",
      variant_id: null,
      vendor_id: 3,
      store_id: 4,
      product_name: "Demo product",
      variant_name: null,
      sku: "DEMO-1",
      quantity: 1,
      unit_price: "25.00",
      subtotal: "25.00",
      total: "25.00",
    },
  ],
  created_at: "2026-11-13T00:00:00.000000Z",
  updated_at: "2026-11-13T00:00:00.000000Z",
};

const paymentResponse: CreateUserPaymentResponse = {
  status: "success",
  message: "Payment created successfully.",
  data: {
    payment: {
      id: 14,
      order_id: createdOrder.id,
      method: "online",
      status: "pending",
      amount: createdOrder.total,
      transaction_id: null,
      provider: "demo",
      paid_at: null,
      failed_at: null,
      failure_reason: null,
      created_at: "2026-11-13T00:00:00.000000Z",
    },
    payment_url: "https://shop.example.test/payments/demo/opaque-token",
  },
};

const checkoutResponse = {
  status: "success",
  message: "Checkout loaded.",
  data: { checkout: checkoutSummary },
};

const componentSource = readFileSync(
  new URL("./checkout.vue", import.meta.url),
  "utf8",
);

const compilePage = () => {
  const source = componentSource.replace(
    "</script>",
    "defineExpose({ form, validatedCheckout, completedOrder, onlineOrder, onlinePayment, paymentUrl, paymentPreparationError, errorMessage, submitting, loadCheckout, submitCheckout, retryOnlinePayment });\n</script>",
  );
  const { descriptor, errors } = parse(source, {
    filename: "checkout.vue",
  });
  if (errors.length) throw errors[0];

  const script = compileScript(descriptor, {
    id: "checkout-page-test",
    inlineTemplate: true,
  }).content;
  const compiled = transformSync(script, {
    format: "esm",
    loader: "ts",
  }).code;
  const declarations = [
    "const { ref, reactive, watch, onMounted } = vue;",
  ];
  const withoutImports = compiled.replace(
    /^import\s*\{([\s\S]*?)\}\s*from\s*["']([^"']+)["'];?\s*/gm,
    (_statement, bindings: string, sourceName: string) => {
      const importedBindings = bindings
        .split(",")
        .map((binding) => binding.trim())
        .filter(Boolean)
        .map((binding) => binding.replace(/\s+as\s+/, ": "))
        .join(", ");
      const moduleName =
        sourceName === "vue"
          ? "vue"
          : sourceName === "lucide-vue-next"
            ? "icons"
            : sourceName === "~/composables/useCheckout"
              ? "checkoutApi"
              : sourceName === "~/composables/useUserPayment"
                ? "paymentApi"
                : null;
      if (!moduleName) {
        throw new Error(`Unexpected checkout import: ${sourceName}`);
      }
      declarations.push(
        `const { ${importedBindings} } = ${moduleName};`,
      );
      return "";
    },
  );
  const componentCode = withoutImports
    .replace(/var stdin_default = /, "return ")
    .replace(/export\s*\{[\s\S]*?\};?\s*$/, "");
  const factory = new Function(
    "vue",
    "icons",
    "checkoutApi",
    "paymentApi",
    "useToast",
    "navigateTo",
    "definePageMeta",
    `${declarations.join("\n")}\n${componentCode}`,
  );

  return (
    checkoutApi: ReturnType<typeof createCheckoutApi>,
    paymentApi: ReturnType<typeof createPaymentApi>,
    toast: { success: ReturnType<typeof vi.fn> },
    navigate: ReturnType<typeof vi.fn>,
  ) => {
    const component = factory(
      { ...VueRuntime, onMounted: () => {} },
      new Proxy(
        {},
        {
          get: () => vi.fn(),
        },
      ),
      { useCheckout: () => checkoutApi },
      { useUserPayment: () => paymentApi },
      () => toast,
      navigate,
      vi.fn(),
    ) as {
      setup: (
        props: Record<string, unknown>,
        context: { expose: (value: CheckoutPageState) => void },
      ) => unknown;
    };
    const state = {} as CheckoutPageState;
    component.setup({}, { expose: (value) => Object.assign(state, value) });
    return state;
  };
};

import * as VueRuntime from "vue";

type CheckoutPageState = {
  form: Record<string, string>;
  validatedCheckout: Ref<CheckoutSummary | null>;
  completedOrder: Ref<CreatedOrder | null>;
  onlineOrder: Ref<CreatedOrder | null>;
  onlinePayment: Ref<{ status: string } | null>;
  paymentUrl: Ref<string | null>;
  paymentPreparationError: Ref<string>;
  errorMessage: Ref<string>;
  submitting: Ref<boolean>;
  loadCheckout: () => Promise<void>;
  submitCheckout: (mode?: "order" | "online") => Promise<void>;
  retryOnlinePayment: () => Promise<void>;
};

const createCheckoutApi = () => ({
  getCheckout: vi.fn().mockResolvedValue(checkoutResponse),
  validateCheckout: vi.fn().mockResolvedValue(checkoutResponse),
  createOrder: vi.fn().mockResolvedValue({
    status: "success",
    message: "Order created.",
    data: { order: createdOrder },
  }),
});

const createPaymentApi = () => ({
  createPayment: vi.fn().mockResolvedValue(paymentResponse),
});

const createPageHarness = (
  checkoutApi = createCheckoutApi(),
  paymentApi = createPaymentApi(),
  navigate = vi.fn().mockResolvedValue(undefined),
) => {
  const toast = { success: vi.fn() };
  const page = compilePage()(checkoutApi, paymentApi, toast, navigate);
  return { page, checkoutApi, paymentApi, navigate, toast };
};

const fillForm = (page: CheckoutPageState) => {
  page.form.shipping_name = "Alex Example";
  page.form.shipping_phone = "+1-555-0100";
  page.form.shipping_country = "Example Country";
  page.form.shipping_province = "Example Province";
  page.form.shipping_city = "Example City";
  page.form.shipping_address = "123 Example Street";
};

describe("checkout online payment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an order once and sends the exact created order ID and online method", async () => {
    const { page, checkoutApi, paymentApi } = createPageHarness();
    await page.loadCheckout();
    fillForm(page);
    page.validatedCheckout.value = checkoutSummary;

    await page.submitCheckout("online");

    expect(checkoutApi.createOrder).toHaveBeenCalledOnce();
    const orderPayload = checkoutApi.createOrder.mock.calls[0][0];
    expect(orderPayload).not.toHaveProperty("method");
    expect(orderPayload).not.toHaveProperty("provider");
    expect(orderPayload).not.toHaveProperty("amount");
    expect(paymentApi.createPayment).toHaveBeenCalledOnce();
    expect(paymentApi.createPayment).toHaveBeenCalledWith({
      order_id: 42,
      method: "online",
    });
    const paymentPayload = paymentApi.createPayment.mock.calls[0][0];
    expect(paymentPayload).not.toHaveProperty("provider");
    expect(paymentPayload).not.toHaveProperty("amount");
    expect(page.onlineOrder.value?.id).toBe(42);
  });

  it.each([
    ["unsafe scheme", "javascript:alert(1)"],
    ["missing URL", undefined],
  ])("rejects a %s", async (_label, paymentUrl) => {
    const paymentApi = createPaymentApi();
    paymentApi.createPayment.mockResolvedValue({
      ...paymentResponse,
      data: {
        ...paymentResponse.data,
        payment_url: paymentUrl,
      },
    });
    const { page, checkoutApi, navigate } = createPageHarness(
      createCheckoutApi(),
      paymentApi,
    );
    await page.loadCheckout();
    fillForm(page);
    page.validatedCheckout.value = checkoutSummary;

    await page.submitCheckout("online");

    expect(checkoutApi.createOrder).toHaveBeenCalledOnce();
    expect(page.onlineOrder.value?.id).toBe(42);
    expect(page.paymentPreparationError.value).toContain(
      "returned an invalid link",
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it.each([
    ["new attempt (HTTP 201)", "Payment created successfully."],
    ["reused attempt (HTTP 200)", "Active payment retrieved successfully."],
  ])("navigates to the returned payment URL for a %s response", async (_label, message) => {
    const { page, checkoutApi, paymentApi, navigate } = createPageHarness();
    paymentApi.createPayment.mockResolvedValue({
      ...paymentResponse,
      message,
    });
    await page.loadCheckout();
    fillForm(page);
    page.validatedCheckout.value = checkoutSummary;

    await page.submitCheckout("online");

    expect(checkoutApi.createOrder).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(
      "https://shop.example.test/payments/demo/opaque-token",
      { external: true },
    );
  });

  it("validates checkout before creating an online order", async () => {
    const { page, checkoutApi, paymentApi } = createPageHarness();
    await page.loadCheckout();
    fillForm(page);

    await page.submitCheckout("online");

    expect(checkoutApi.validateCheckout).toHaveBeenCalledOnce();
    expect(checkoutApi.validateCheckout).toHaveBeenCalledWith({
      shipping_name: "Alex Example",
      shipping_phone: "+1-555-0100",
      shipping_country: "Example Country",
      shipping_province: "Example Province",
      shipping_city: "Example City",
      shipping_address: "123 Example Street",
      shipping_postal_code: null,
    });
    expect(checkoutApi.createOrder).not.toHaveBeenCalled();
    expect(paymentApi.createPayment).not.toHaveBeenCalled();
  });

  it("does not create a payment when order creation fails", async () => {
    const checkoutApi = createCheckoutApi();
    checkoutApi.createOrder.mockRejectedValue({
      message: "Order validation failed.",
      errors: {},
      status: 422,
    });
    const { page, paymentApi } = createPageHarness(checkoutApi);
    await page.loadCheckout();
    fillForm(page);
    page.validatedCheckout.value = checkoutSummary;

    await page.submitCheckout("online");

    expect(checkoutApi.createOrder).toHaveBeenCalledOnce();
    expect(paymentApi.createPayment).not.toHaveBeenCalled();
    expect(page.onlineOrder.value).toBeNull();
    expect(page.errorMessage.value).toBe("Order validation failed.");
  });

  it("allows manual payment setup retry without creating another order", async () => {
    const { page, checkoutApi, paymentApi } = createPageHarness();
    paymentApi.createPayment
      .mockRejectedValueOnce({
        message: "Payment service unavailable.",
        errors: {},
        status: 503,
      })
      .mockResolvedValueOnce(paymentResponse);
    await page.loadCheckout();
    fillForm(page);
    page.validatedCheckout.value = checkoutSummary;

    await page.submitCheckout("online");

    expect(checkoutApi.createOrder).toHaveBeenCalledOnce();
    expect(paymentApi.createPayment).toHaveBeenCalledOnce();
    expect(page.onlineOrder.value?.id).toBe(42);
    expect(page.paymentPreparationError.value).toContain(
      "Order COBO-12345678 was created, but the payment link could not be prepared",
    );

    await page.retryOnlinePayment();

    expect(checkoutApi.createOrder).toHaveBeenCalledOnce();
    expect(paymentApi.createPayment).toHaveBeenCalledTimes(2);
    expect(paymentApi.createPayment).toHaveBeenLastCalledWith({
      order_id: 42,
      method: "online",
    });
    expect(page.paymentUrl.value).toBe(paymentResponse.data.payment_url);
  });

  it("prevents repeated online submissions from creating duplicate orders", async () => {
    let resolveOrder!: (response: {
      status: string;
      message: string;
      data: { order: CreatedOrder };
    }) => void;
    const checkoutApi = createCheckoutApi();
    checkoutApi.createOrder.mockReturnValue(
      new Promise((resolve) => {
        resolveOrder = resolve;
      }),
    );
    const { page, paymentApi } = createPageHarness(checkoutApi);
    await page.loadCheckout();
    fillForm(page);
    page.validatedCheckout.value = checkoutSummary;

    const firstSubmission = page.submitCheckout("online");
    await page.submitCheckout("online");

    expect(checkoutApi.createOrder).toHaveBeenCalledOnce();
    expect(paymentApi.createPayment).not.toHaveBeenCalled();

    resolveOrder({
      status: "success",
      message: "Order created.",
      data: { order: createdOrder },
    });
    await firstSubmission;
    expect(paymentApi.createPayment).toHaveBeenCalledOnce();
  });

  it("retries failed navigation without recreating the order or payment", async () => {
    const navigate = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(undefined);
    const { page, checkoutApi, paymentApi } = createPageHarness(
      createCheckoutApi(),
      createPaymentApi(),
      navigate,
    );
    await page.loadCheckout();
    fillForm(page);
    page.validatedCheckout.value = checkoutSummary;

    await page.submitCheckout("online");

    expect(page.paymentPreparationError.value).toContain(
      "could not open the link",
    );
    await page.retryOnlinePayment();

    expect(checkoutApi.createOrder).toHaveBeenCalledOnce();
    expect(paymentApi.createPayment).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(page.paymentPreparationError.value).toBe("");
  });

  it("keeps ordinary order creation unchanged and does not create a payment", async () => {
    const { page, checkoutApi, paymentApi, toast } = createPageHarness();
    await page.loadCheckout();
    fillForm(page);
    page.validatedCheckout.value = checkoutSummary;

    await page.submitCheckout();

    expect(checkoutApi.createOrder).toHaveBeenCalledOnce();
    expect(paymentApi.createPayment).not.toHaveBeenCalled();
    expect(page.completedOrder.value?.id).toBe(42);
    expect(page.onlineOrder.value).toBeNull();
    expect(toast.success).toHaveBeenCalledOnce();
    expect(componentSource).not.toContain("Cash on delivery");
    expect(componentSource).not.toContain("Bank transfer");
  });
});

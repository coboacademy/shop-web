import { readFileSync } from "node:fs";
import { compileScript, parse } from "@vue/compiler-sfc";
import { transformSync } from "esbuild";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Ref } from "vue";
import type { UserOrder, UserOrderListItem } from "~/composables/useUserOrder";

const unpaidOrder: UserOrderListItem = {
  id: 24,
  order_number: "COBO-20261113-ABC123",
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
  created_at: "2026-11-13T00:00:00.000000Z",
  updated_at: "2026-11-13T00:00:00.000000Z",
};

const orderDetail: UserOrder = {
  ...unpaidOrder,
  items: [],
};

const paymentResponse = {
  status: "success",
  message: "Payment created successfully.",
  data: {
    payment: { id: 16, order_id: unpaidOrder.id, method: "online" },
    payment_url: "https://shop.example.test/payments/demo/opaque-token",
  },
};

const componentSource = readFileSync(
  new URL("./orders.vue", import.meta.url),
  "utf8",
);

const compilePage = () => {
  const source = componentSource.replace(
    "</script>",
    "defineExpose({ orders, selectedOrder, paymentLoading, paymentErrors, paymentUrls, errorMessage, detailError, isOnlinePaymentRetryEligible, retryOnlinePayment, loadOrders, openOrder, refreshAfterHistoryRestore });\n</script>",
  );
  const { descriptor, errors } = parse(source, { filename: "orders.vue" });
  if (errors.length) throw errors[0];

  const script = compileScript(descriptor, {
    id: "orders-page-test",
    inlineTemplate: true,
  }).content;
  const compiled = transformSync(script, {
    format: "esm",
    loader: "ts",
  }).code;
  const declarations = [
    "const { ref, computed, watch, onMounted, onBeforeUnmount } = vue;",
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
            : sourceName === "~/composables/useUserOrder"
              ? "orderApi"
              : sourceName === "~/composables/useUserPayment"
                ? "paymentApi"
                : null;
      if (!moduleName) {
        throw new Error(`Unexpected orders import: ${sourceName}`);
      }
      declarations.push(`const { ${importedBindings} } = ${moduleName};`);
      return "";
    },
  );
  const componentCode = withoutImports
    .replace(/var stdin_default = /, "return ")
    .replace(/export\s*\{[\s\S]*?\};?\s*$/, "");
  const factory = new Function(
    "vue",
    "icons",
    "orderApi",
    "paymentApi",
    "useNotificationStore",
    "navigateTo",
    "definePageMeta",
    `${declarations.join("\n")}\n${componentCode}`,
  );

  return (
    orderApi: ReturnType<typeof createOrderApi>,
    paymentApi: ReturnType<typeof createPaymentApi>,
    notificationStore: { refreshNotifications: ReturnType<typeof vi.fn> },
    navigate: ReturnType<typeof vi.fn>,
  ) => {
    const component = factory(
      { ...VueRuntime, onMounted: () => {}, onBeforeUnmount: () => {} },
      new Proxy({}, { get: () => vi.fn() }),
      { useUserOrder: () => orderApi },
      { useUserPayment: () => paymentApi },
      () => notificationStore,
      navigate,
      vi.fn(),
    ) as {
      setup: (
        props: Record<string, unknown>,
        context: { expose: (value: OrdersPageState) => void },
      ) => unknown;
    };
    const state = {} as OrdersPageState;
    component.setup({}, { expose: (value) => Object.assign(state, value) });
    return state;
  };
};

import * as VueRuntime from "vue";

type OrdersPageState = {
  orders: Ref<UserOrderListItem[]>;
  selectedOrder: Ref<UserOrder | null>;
  paymentLoading: Ref<Record<number, boolean>>;
  paymentErrors: Ref<Record<number, string>>;
  paymentUrls: Ref<Record<number, string>>;
  errorMessage: Ref<string>;
  detailError: Ref<string>;
  isOnlinePaymentRetryEligible: (
    order: Pick<UserOrderListItem, "status" | "payment_status">,
  ) => boolean;
  retryOnlinePayment: (order: UserOrderListItem | UserOrder) => Promise<void>;
  loadOrders: () => Promise<void>;
  openOrder: (order: UserOrderListItem) => Promise<void>;
  refreshAfterHistoryRestore: (
    event: Pick<PageTransitionEvent, "persisted">,
  ) => Promise<void>;
};

const createOrderApi = () => ({
  getOrders: vi.fn().mockResolvedValue({ data: { orders: [unpaidOrder] } }),
  getOrder: vi.fn().mockResolvedValue({ data: { order: orderDetail } }),
});

const createPaymentApi = () => ({
  createPayment: vi.fn().mockResolvedValue(paymentResponse),
});

const createPageHarness = (
  orderApi = createOrderApi(),
  paymentApi = createPaymentApi(),
  navigate = vi.fn().mockResolvedValue(undefined),
  notificationStore = { refreshNotifications: vi.fn().mockResolvedValue(undefined) },
) => ({
  page: compilePage()(orderApi, paymentApi, notificationStore, navigate),
  orderApi,
  paymentApi,
  notificationStore,
  navigate,
});

describe("customer order online payment recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("offers Retry payment for eligible unpaid orders in the list and details", () => {
    const { page } = createPageHarness();

    expect(page.isOnlinePaymentRetryEligible(unpaidOrder)).toBe(true);
    expect(componentSource).toContain(
      'v-if="isOnlinePaymentRetryEligible(row)"',
    );
    expect(componentSource).toContain(
      'v-if="isOnlinePaymentRetryEligible(selectedOrder)"',
    );
    expect(componentSource).toContain("Retry payment");
  });

  it.each([
    ["paid order", { ...unpaidOrder, payment_status: "paid" }],
    ["cancelled order", { ...unpaidOrder, status: "cancelled" }],
    ["unknown payment status", { ...unpaidOrder, payment_status: "failed" }],
  ])("does not offer retry for a %s", (_label, order) => {
    const { page } = createPageHarness();

    expect(page.isOnlinePaymentRetryEligible(order)).toBe(false);
  });

  it("uses the existing order ID and only the online method", async () => {
    const { page, paymentApi, navigate } = createPageHarness();

    await page.retryOnlinePayment(unpaidOrder);

    expect(paymentApi.createPayment).toHaveBeenCalledOnce();
    expect(paymentApi.createPayment).toHaveBeenCalledWith({
      order_id: unpaidOrder.id,
      method: "online",
    });
    const payload = paymentApi.createPayment.mock.calls[0][0];
    expect(payload).not.toHaveProperty("provider");
    expect(payload).not.toHaveProperty("amount");
    expect(navigate).toHaveBeenCalledWith(
      paymentResponse.data.payment_url,
      { external: true },
    );
  });

  it.each([
    ["non-HTTP scheme", "javascript:alert(1)"],
    ["missing URL", undefined],
    ["blank URL", "  "],
  ])("does not navigate for a %s", async (_label, paymentUrl) => {
    const paymentApi = createPaymentApi();
    paymentApi.createPayment.mockResolvedValue({
      ...paymentResponse,
      data: { ...paymentResponse.data, payment_url: paymentUrl },
    });
    const { page, navigate } = createPageHarness(
      createOrderApi(),
      paymentApi,
    );

    await page.loadOrders();
    await page.retryOnlinePayment(unpaidOrder);

    expect(page.orders.value).toEqual([unpaidOrder]);
    expect(page.paymentErrors.value[unpaidOrder.id]).toContain(
      "invalid link",
    );
    expect(page.paymentUrls.value[unpaidOrder.id]).toBeUndefined();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("preserves the order and reports a recoverable payment setup failure", async () => {
    const paymentApi = createPaymentApi();
    paymentApi.createPayment.mockRejectedValue({
      message: "Payment service unavailable.",
      status: 503,
    });
    const { page } = createPageHarness(createOrderApi(), paymentApi);
    await page.loadOrders();

    await page.retryOnlinePayment(unpaidOrder);

    expect(page.orders.value).toEqual([unpaidOrder]);
    expect(page.paymentErrors.value[unpaidOrder.id]).toBe(
      "Payment service unavailable.",
    );
  });

  it("uses the existing login redirect when payment setup is unauthorized", async () => {
    const paymentApi = createPaymentApi();
    paymentApi.createPayment.mockRejectedValue({
      message: "Unauthenticated.",
      status: 401,
    });
    const navigate = vi.fn().mockResolvedValue(undefined);
    const { page } = createPageHarness(
      createOrderApi(),
      paymentApi,
      navigate,
    );

    await page.retryOnlinePayment(unpaidOrder);

    expect(navigate).toHaveBeenCalledWith({
      path: "/login",
      query: { redirect: "/app/orders" },
    });
  });

  it("prevents repeated clicks from sending duplicate payment requests", async () => {
    let resolvePayment!: (response: typeof paymentResponse) => void;
    const paymentApi = createPaymentApi();
    paymentApi.createPayment.mockReturnValue(
      new Promise((resolve) => {
        resolvePayment = resolve;
      }),
    );
    const { page } = createPageHarness(createOrderApi(), paymentApi);

    const firstRequest = page.retryOnlinePayment(unpaidOrder);
    await page.retryOnlinePayment(unpaidOrder);

    expect(paymentApi.createPayment).toHaveBeenCalledOnce();
    expect(page.paymentLoading.value[unpaidOrder.id]).toBe(true);
    resolvePayment(paymentResponse);
    await firstRequest;
    expect(page.paymentLoading.value[unpaidOrder.id]).toBe(false);
  });

  it("recovers from navigation failure using the cached URL", async () => {
    const navigate = vi
      .fn()
      .mockRejectedValueOnce(new Error("Navigation failed"))
      .mockResolvedValueOnce(undefined);
    const { page, paymentApi, orderApi } = createPageHarness(
      createOrderApi(),
      createPaymentApi(),
      navigate,
    );

    await page.retryOnlinePayment(unpaidOrder);
    expect(page.paymentErrors.value[unpaidOrder.id]).toContain(
      "could not be opened",
    );
    await page.retryOnlinePayment(unpaidOrder);

    expect(paymentApi.createPayment).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(orderApi).not.toHaveProperty("createOrder");
  });

  it("keeps existing order list and detail loading behavior", async () => {
    const { page, orderApi } = createPageHarness();

    await page.loadOrders();
    await page.openOrder(unpaidOrder);

    expect(orderApi.getOrders).toHaveBeenCalledWith(1);
    expect(orderApi.getOrder).toHaveBeenCalledWith(unpaidOrder.id);
    expect(page.orders.value).toEqual([unpaidOrder]);
    expect(page.selectedOrder.value).toEqual(orderDetail);
  });

  it("refreshes order list, open detail, and notification state after browser history restore", async () => {
    const updatedOrder: UserOrderListItem = {
      ...unpaidOrder,
      status: "confirmed",
      payment_status: "paid",
    };
    const updatedDetail: UserOrder = { ...updatedOrder, items: [] };
    const orderApi = createOrderApi();
    const { page, paymentApi, notificationStore } = createPageHarness(orderApi);
    await page.loadOrders();
    await page.openOrder(unpaidOrder);

    orderApi.getOrders.mockResolvedValue({ data: { orders: [updatedOrder] } });
    orderApi.getOrder.mockResolvedValue({ data: { order: updatedDetail } });
    await page.refreshAfterHistoryRestore({ persisted: true });

    expect(orderApi.getOrders).toHaveBeenCalledTimes(2);
    expect(orderApi.getOrder).toHaveBeenCalledTimes(2);
    expect(page.orders.value[0]).toMatchObject({
      status: "confirmed",
      payment_status: "paid",
    });
    expect(page.selectedOrder.value).toMatchObject({
      status: "confirmed",
      payment_status: "paid",
    });
    expect(componentSource).toContain("{{ formatLabel(row.payment_status) }}");
    expect(componentSource).toContain("{{ formatLabel(row.status) }}");
    expect(notificationStore.refreshNotifications).toHaveBeenCalledOnce();
    expect(paymentApi.createPayment).not.toHaveBeenCalled();
    expect(orderApi).not.toHaveProperty("createOrder");
  });

  it("does not refresh the customer page for a non-history pageshow event", async () => {
    const { page, orderApi, notificationStore } = createPageHarness();

    await page.refreshAfterHistoryRestore({ persisted: false });

    expect(orderApi.getOrders).not.toHaveBeenCalled();
    expect(notificationStore.refreshNotifications).not.toHaveBeenCalled();
  });

  it("displays expired orders using the backend cancellation and payment statuses", async () => {
    const cancelledOrder: UserOrderListItem = {
      ...unpaidOrder,
      status: "cancelled",
      payment_status: "pending",
    };
    const orderApi = createOrderApi();
    orderApi.getOrders.mockResolvedValue({ data: { orders: [cancelledOrder] } });
    const { page } = createPageHarness(orderApi);

    await page.loadOrders();

    expect(page.orders.value[0]).toMatchObject({
      status: "cancelled",
      payment_status: "pending",
    });
    expect(page.isOnlinePaymentRetryEligible(page.orders.value[0])).toBe(false);
    expect(componentSource).toContain("{{ formatLabel(row.payment_status) }}");
    expect(componentSource).toContain("{{ formatLabel(row.status) }}");
  });

  it("keeps the existing order API error state usable", async () => {
    const orderApi = createOrderApi();
    orderApi.getOrders.mockRejectedValue({
      message: "Orders are temporarily unavailable.",
      status: 503,
      errors: {},
    });
    const { page } = createPageHarness(orderApi);

    await page.loadOrders();

    expect(page.errorMessage.value).toBe("Orders are temporarily unavailable.");
    expect(page.orders.value).toEqual([]);
    expect(componentSource).toContain("@click=\"loadOrders()\"");
  });
});
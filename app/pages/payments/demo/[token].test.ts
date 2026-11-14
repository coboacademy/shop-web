import { readFileSync } from "node:fs";
import { createRenderer, defineComponent, h, nextTick } from "vue";
import { compileScript, parse } from "@vue/compiler-sfc";
import { transformSync } from "esbuild";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DemoPayment } from "~/composables/useUserPayment";

const demoPayment: DemoPayment = {
  order_reference: "COBO-12345678",
  amount: "25.00",
  status: "pending",
  expires_at: "2026-11-13T02:00:00.000000Z",
};

type TestNode = {
  type: string;
  props: Record<string, unknown>;
  children: TestNode[];
  text?: string;
  parent?: TestNode;
};

const componentSource = readFileSync(
  new URL("./[token].vue", import.meta.url),
  "utf8",
);

const compilePage = () => {
  const { descriptor, errors } = parse(componentSource, {
    filename: "[token].vue",
  });
  if (errors.length) throw errors[0];

  const script = compileScript(descriptor, {
    id: "demo-payment-page-test",
    inlineTemplate: true,
  }).content;
  const compiled = transformSync(script, {
    format: "esm",
    loader: "ts",
  }).code;
  const declarations = ["const { ref, computed, onMounted } = vue;"];
  const withoutImports = compiled.replace(
    /^import\s*\{([\s\S]*?)\}\s*from\s*["']([^"']+)["'];?\s*/gm,
    (_statement, bindings: string, source: string) => {
      const importedBindings = bindings
        .split(",")
        .map((binding) => binding.trim())
        .filter(Boolean)
        .map((binding) => binding.replace(/\s+as\s+/, ": "))
        .join(", ");
      const moduleName =
        source === "vue"
          ? "vue"
          : source === "lucide-vue-next"
            ? "icons"
            : source === "~/composables/useUserPayment"
              ? "paymentApi"
              : null;
      if (!moduleName) throw new Error(`Unexpected page import: ${source}`);
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
    "paymentApi",
    "useRoute",
    "definePageMeta",
    `${declarations.join("\n")}\n${componentCode}`,
  );

  return (
    paymentApi: ReturnType<typeof createPaymentApi>,
    route: { params: { token: string } },
    definePageMeta: (metadata: Record<string, unknown>) => void,
  ) =>
    factory(
      { createRenderer, defineComponent, h, nextTick, ...VueRuntime },
      iconStubs,
      { useUserPayment: () => paymentApi },
      () => route,
      definePageMeta,
    );
};

import * as VueRuntime from "vue";

const iconStub = defineComponent({
  setup: () => () => h("span"),
});
const iconStubs = {
  AlertCircle: iconStub,
  ArrowLeft: iconStub,
  CheckCircle2: iconStub,
  Clock3: iconStub,
  CreditCard: iconStub,
  ShieldCheck: iconStub,
};

const createPaymentApi = () => ({
  getDemoPayment: vi.fn(),
  succeedDemoPayment: vi.fn(),
  failDemoPayment: vi.fn(),
});

const createHost = () => ({
  type: "root",
  props: {},
  children: [],
}) as TestNode;

const createPageHarness = async (
  paymentApi = createPaymentApi(),
  route = { params: { token: "opaque-token" } },
) => {
  const pageMetadata: Record<string, unknown>[] = [];
  const page = compilePage()(
    paymentApi,
    route,
    (metadata) => pageMetadata.push(metadata),
  );

  const appButton = defineComponent({
    inheritAttrs: false,
    props: {
      loading: Boolean,
      disabled: Boolean,
      type: { type: String, default: "button" },
    },
    setup(props, { attrs, slots }) {
      return () =>
        h(
          "button",
          {
            ...attrs,
            type: props.type,
            disabled: props.disabled || props.loading,
          },
          slots.default?.(),
        );
    },
  });
  const appBadge = defineComponent({
    setup: (_props, { slots }) => () => h("span", {}, slots.default?.()),
  });
  const alertMessage = defineComponent({
    props: {
      title: String,
      message: String,
    },
    setup(props, { slots }) {
      return () =>
        h("div", {}, [
          props.title || "",
          props.message || "",
          ...(slots.default?.() || []),
        ]);
    },
  });
  const nuxtLink = defineComponent({
    props: { to: { type: [String, Object], default: "/" } },
    setup(props, { slots }) {
      return () =>
        h(
          "a",
          {
            href:
              typeof props.to === "string"
                ? props.to
                : JSON.stringify(props.to),
          },
          slots.default?.(),
        );
    },
  });

  const renderer = createRenderer<TestNode, TestNode>({
    createElement: (type) => ({ type, props: {}, children: [] }),
    createText: (text) => ({ type: "#text", props: {}, children: [], text }),
    createComment: (text) => ({ type: "#comment", props: {}, children: [], text }),
    setText: (node, text) => {
      node.text = text;
    },
    setElementText: (node, text) => {
      node.children = [{ type: "#text", props: {}, children: [], text }];
    },
    patchProp: (node, key, _previous, next) => {
      node.props[key] = next;
    },
    insert: (node, parent, anchor) => {
      if (node.parent) {
        const oldIndex = node.parent.children.indexOf(node);
        if (oldIndex >= 0) node.parent.children.splice(oldIndex, 1);
      }
      const index = anchor ? parent.children.indexOf(anchor) : -1;
      if (index >= 0) parent.children.splice(index, 0, node);
      else parent.children.push(node);
      node.parent = parent;
    },
    remove: (node) => {
      if (!node.parent) return;
      const index = node.parent.children.indexOf(node);
      if (index >= 0) node.parent.children.splice(index, 1);
      node.parent = undefined;
    },
    parentNode: (node) => node.parent || null,
    nextSibling: (node) => {
      if (!node.parent) return null;
      const index = node.parent.children.indexOf(node);
      return node.parent.children[index + 1] || null;
    },
  });
  const app = renderer.createApp(page);
  app.component("AppButton", appButton);
  app.component("AppBadge", appBadge);
  app.component("AlertMessage", alertMessage);
  app.component("NuxtLink", nuxtLink);

  const root = createHost();
  app.mount(root);
  await flushPromises();

  return { app, root, pageMetadata, paymentApi };
};

const flushPromises = async () => {
  await Promise.resolve();
  await nextTick();
  await Promise.resolve();
  await nextTick();
};

const allNodes = (root: TestNode): TestNode[] => [
  root,
  ...root.children.flatMap(allNodes),
];

const textContent = (node: TestNode): string =>
  `${node.text || ""}${node.children.map(textContent).join("")}`;

const findButton = (root: TestNode, label: string) =>
  allNodes(root).find(
    (node) => node.type === "button" && textContent(node).includes(label),
  );

const paymentResponse = (payment: DemoPayment) => ({
  status: "success",
  message: "Payment resolved successfully.",
  data: { payment },
});

const makeApiError = (status: number, message: string) => ({
  message,
  errors: {},
  status,
});

describe("public demo payment page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the public layout, resolves its route token, and does not redirect to login", async () => {
    const api = createPaymentApi();
    api.getDemoPayment.mockResolvedValue(paymentResponse(demoPayment));

    const { app, pageMetadata, paymentApi } = await createPageHarness(api);

    expect(pageMetadata).toEqual([
      { layout: "public", title: "Demo Payment" },
    ]);
    expect(pageMetadata[0]).not.toHaveProperty("middleware");
    expect(paymentApi.getDemoPayment).toHaveBeenCalledOnce();
    expect(paymentApi.getDemoPayment).toHaveBeenCalledWith("opaque-token");
    expect(paymentApi.succeedDemoPayment).not.toHaveBeenCalled();
    expect(paymentApi.failDemoPayment).not.toHaveBeenCalled();
    app.unmount();
  });

  it("shows pending payment details and both simulation actions", async () => {
    const api = createPaymentApi();
    api.getDemoPayment.mockResolvedValue(paymentResponse(demoPayment));
    const { app, root } = await createPageHarness(api);
    const content = textContent(root);

    expect(content).toContain("Demo Payment");
    expect(content).toContain("COBO-12345678");
    expect(content).toContain("25.00");
    expect(content).toContain("pending");
    expect(content).toContain("Expires");
    expect(content).toContain("2026");
    expect(findButton(root, "Simulate successful payment")).toBeTruthy();
    expect(findButton(root, "Simulate failed payment")).toBeTruthy();
    app.unmount();
  });

  it("calls the success action and renders its paid response", async () => {
    const api = createPaymentApi();
    api.getDemoPayment.mockResolvedValue(paymentResponse(demoPayment));
    api.succeedDemoPayment.mockResolvedValue(
      paymentResponse({ ...demoPayment, status: "paid" }),
    );
    const { app, root } = await createPageHarness(api);

    findButton(root, "Simulate successful payment")?.props.onClick?.();
    await flushPromises();

    expect(api.succeedDemoPayment).toHaveBeenCalledOnce();
    expect(api.succeedDemoPayment).toHaveBeenCalledWith("opaque-token");
    expect(textContent(root)).toContain("Demo payment successful");
    expect(textContent(root)).toContain("backend has confirmed");
    expect(allNodes(root).some(
      (node) => node.type === "a" && node.props.href === "/app/orders",
    )).toBe(true);
    app.unmount();
  });

  it("reloads the backend payment state when revisiting a completed demo URL", async () => {
    const paidPayment = { ...demoPayment, status: "paid" as const };
    const api = createPaymentApi();
    api.getDemoPayment
      .mockResolvedValueOnce(paymentResponse(demoPayment))
      .mockResolvedValueOnce(paymentResponse(paidPayment));

    const firstVisit = await createPageHarness(api);
    firstVisit.app.unmount();
    const revisit = await createPageHarness(api);

    expect(api.getDemoPayment).toHaveBeenCalledTimes(2);
    expect(api.getDemoPayment).toHaveBeenNthCalledWith(1, "opaque-token");
    expect(api.getDemoPayment).toHaveBeenNthCalledWith(2, "opaque-token");
    expect(api.succeedDemoPayment).not.toHaveBeenCalled();
    expect(api.failDemoPayment).not.toHaveBeenCalled();
    expect(textContent(revisit.root)).toContain("Demo payment successful");
    revisit.app.unmount();
  });

  it("calls the failure action and renders its failed response", async () => {
    const api = createPaymentApi();
    api.getDemoPayment.mockResolvedValue(paymentResponse(demoPayment));
    api.failDemoPayment.mockResolvedValue(
      paymentResponse({ ...demoPayment, status: "failed" }),
    );
    const { app, root } = await createPageHarness(api);

    findButton(root, "Simulate failed payment")?.props.onClick?.();
    await flushPromises();

    expect(api.failDemoPayment).toHaveBeenCalledOnce();
    expect(api.failDemoPayment).toHaveBeenCalledWith("opaque-token");
    expect(textContent(root)).toContain("This payment attempt failed");
    expect(textContent(root)).toContain("choose this same order");
    expect(allNodes(root).some(
      (node) => node.type === "a" && node.props.href === "/app/payments",
    )).toBe(true);
    app.unmount();
  });

  it("disables both actions while one submission is pending", async () => {
    let resolveAction!: (value: ReturnType<typeof paymentResponse>) => void;
    const api = createPaymentApi();
    api.getDemoPayment.mockResolvedValue(paymentResponse(demoPayment));
    api.succeedDemoPayment.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    const { app, root } = await createPageHarness(api);

    findButton(root, "Simulate successful payment")?.props.onClick?.();
    await nextTick();

    expect(findButton(root, "Simulate successful payment")?.props.disabled).toBe(true);
    expect(findButton(root, "Simulate failed payment")?.props.disabled).toBe(true);
    expect(api.failDemoPayment).not.toHaveBeenCalled();

    resolveAction(paymentResponse({ ...demoPayment, status: "paid" }));
    await flushPromises();
    app.unmount();
  });

  it("renders a successful action response without changing status optimistically", async () => {
    let resolveAction!: (value: ReturnType<typeof paymentResponse>) => void;
    const api = createPaymentApi();
    api.getDemoPayment.mockResolvedValue(paymentResponse(demoPayment));
    api.succeedDemoPayment.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    const { app, root } = await createPageHarness(api);

    findButton(root, "Simulate successful payment")?.props.onClick?.();
    await nextTick();
    expect(textContent(root)).toContain("pending");
    expect(textContent(root)).not.toContain("Demo payment successful");

    resolveAction(paymentResponse({ ...demoPayment, status: "paid" }));
    await flushPromises();
    expect(textContent(root)).toContain("Demo payment successful");
    app.unmount();
  });

  it("renders failed status only from the failure action response", async () => {
    let resolveAction!: (value: ReturnType<typeof paymentResponse>) => void;
    const api = createPaymentApi();
    api.getDemoPayment.mockResolvedValue(paymentResponse(demoPayment));
    api.failDemoPayment.mockReturnValue(
      new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    const { app, root } = await createPageHarness(api);

    findButton(root, "Simulate failed payment")?.props.onClick?.();
    await nextTick();
    expect(textContent(root)).toContain("pending");
    expect(textContent(root)).not.toContain("This payment attempt failed");

    resolveAction(paymentResponse({ ...demoPayment, status: "failed" }));
    await flushPromises();
    expect(textContent(root)).toContain("This payment attempt failed");
    app.unmount();
  });

  it("shows the same generic unavailable state for an unusable token", async () => {
    const api = createPaymentApi();
    api.getDemoPayment.mockRejectedValue(
      makeApiError(404, "Payment is unavailable."),
    );
    const { app, root } = await createPageHarness(api);

    expect(textContent(root)).toContain("Payment unavailable");
    expect(textContent(root)).toContain("may have expired or may no longer be valid");
    expect(textContent(root)).not.toContain("opaque-token");
    expect(findButton(root, "Simulate successful payment")).toBeFalsy();
    app.unmount();
  });

  it("shows unavailable when an action discovers that the payment is no longer usable", async () => {
    const api = createPaymentApi();
    api.getDemoPayment.mockResolvedValue(paymentResponse(demoPayment));
    api.failDemoPayment.mockRejectedValue(
      makeApiError(404, "Payment is unavailable."),
    );
    const { app, root } = await createPageHarness(api);

    findButton(root, "Simulate failed payment")?.props.onClick?.();
    await flushPromises();

    expect(textContent(root)).toContain("Payment unavailable");
    expect(textContent(root)).not.toContain("This payment attempt failed");
    expect(findButton(root, "Simulate failed payment")).toBeFalsy();
    app.unmount();
  });

  it("shows retryable network and rate-limit errors without resubmitting automatically", async () => {
    const api = createPaymentApi();
    api.getDemoPayment.mockRejectedValue(makeApiError(429, "Too many requests."));
    const { app, root } = await createPageHarness(api);

    expect(textContent(root)).toContain("Too many requests.");
    expect(api.getDemoPayment).toHaveBeenCalledOnce();
    expect(findButton(root, "Try again")).toBeTruthy();
    app.unmount();
  });

  it("keeps a failed action pending until a customer manually retries it", async () => {
    const api = createPaymentApi();
    api.getDemoPayment.mockResolvedValue(paymentResponse(demoPayment));
    api.failDemoPayment.mockRejectedValue(makeApiError(503, "Service unavailable."));
    const { app, root } = await createPageHarness(api);

    findButton(root, "Simulate failed payment")?.props.onClick?.();
    await flushPromises();

    expect(api.failDemoPayment).toHaveBeenCalledOnce();
    expect(textContent(root)).toContain("Service unavailable.");
    expect(textContent(root)).toContain("pending");
    expect(textContent(root)).not.toContain("This payment attempt failed");

    api.failDemoPayment.mockResolvedValue(
      paymentResponse({ ...demoPayment, status: "failed" }),
    );
    findButton(root, "Simulate failed payment")?.props.onClick?.();
    await flushPromises();

    expect(api.failDemoPayment).toHaveBeenCalledTimes(2);
    expect(textContent(root)).toContain("This payment attempt failed");
    app.unmount();
  });

  it("does not redirect to login when a public lookup reports an authentication error", async () => {
    const api = createPaymentApi();
    api.getDemoPayment.mockRejectedValue(makeApiError(401, "Unauthenticated."));
    const { app, root, pageMetadata } = await createPageHarness(api);

    expect(textContent(root)).toContain("Unauthenticated.");
    expect(pageMetadata[0]).not.toHaveProperty("middleware");
    app.unmount();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CreateUserPaymentResponse,
  DemoPayment,
  DemoPaymentResponse,
} from "./useUserPayment";
import { useUserPayment } from "./useUserPayment";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("./useApi", () => ({
  useApi: () => apiMock,
}));

const payment = {
  id: 16,
  order_id: 24,
  method: "online",
  status: "pending",
  amount: "25.00",
  transaction_id: null,
  provider: "demo",
  paid_at: null,
  failed_at: null,
  failure_reason: null,
  created_at: "2026-10-31T00:53:00.000000Z",
};

const demoPayment: DemoPayment = {
  order_reference: "COBO-12345678",
  amount: "25.00",
  status: "pending" as const,
  expires_at: "2026-11-13T02:00:00.000000Z",
};

describe("user payment API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a payment using only the order ID and selected method", async () => {
    const response = {
      status: "success",
      message: "Payment created successfully.",
      data: {
        payment,
        payment_url: "https://shop.example.test/payments/demo/opaque-token",
      },
    };
    apiMock.post.mockResolvedValue({ data: response });

    const result = await useUserPayment().createPayment({
      order_id: 24,
      method: "online",
    });

    expect(apiMock.post).toHaveBeenCalledOnce();
    expect(apiMock.post).toHaveBeenCalledWith("/payments", {
      order_id: 24,
      method: "online",
    });
    expect(apiMock.post.mock.calls[0][1]).not.toHaveProperty("provider");
    expect(apiMock.post.mock.calls[0][1]).not.toHaveProperty("amount");
    expect(result.data.payment).toEqual(payment);
    expect(result.data.payment_url).toBe(
      "https://shop.example.test/payments/demo/opaque-token",
    );
  });

  it.each([
    [201, "Payment created successfully."],
    [200, "Active payment retrieved successfully."],
  ])("returns payment URL for HTTP %i", async (httpStatus, message) => {
    const response = {
      status: "success",
      message,
      data: {
        payment,
        payment_url: "https://shop.example.test/payments/demo/reused-token",
      },
    };
    apiMock.post.mockResolvedValue({ status: httpStatus, data: response });

    const result = await useUserPayment().createPayment({
      order_id: 24,
      method: "online",
    });
    const typedResponse: CreateUserPaymentResponse = result;

    expect(typedResponse).toEqual(response);
    expect(typedResponse.data.payment_url).toBe(
      "https://shop.example.test/payments/demo/reused-token",
    );
  });

  it("preserves optional payment metadata without adding provider or amount", async () => {
    apiMock.post.mockResolvedValue({
      data: {
        status: "success",
        message: "Payment created successfully.",
        data: {
          payment,
          payment_url: "https://shop.example.test/payments/demo/opaque-token",
        },
      },
    });
    const metadata = { source: "checkout" };

    await useUserPayment().createPayment({
      order_id: 24,
      method: "online",
      metadata,
    });

    expect(apiMock.post).toHaveBeenCalledWith("/payments", {
      order_id: 24,
      method: "online",
      metadata,
    });
  });

  it("loads a public demo payment using only the encoded token path", async () => {
    const response = {
      status: "success",
      message: "Payment resolved successfully.",
      data: { payment: demoPayment },
    };
    apiMock.get.mockResolvedValue({ data: response });

    const result: DemoPaymentResponse =
      await useUserPayment().getDemoPayment("opaque token");

    expect(apiMock.get).toHaveBeenCalledOnce();
    expect(apiMock.get).toHaveBeenCalledWith("/payments/demo/opaque%20token");
    expect(result.data.payment).toEqual(demoPayment);
  });

  it("submits public success without a request body", async () => {
    const response = {
      status: "success",
      message: "Demo payment completed successfully.",
      data: { payment: { ...demoPayment, status: "paid" as const } },
    };
    apiMock.post.mockResolvedValue({ data: response });

    const result: DemoPaymentResponse =
      await useUserPayment().succeedDemoPayment("opaque-token");

    expect(apiMock.post).toHaveBeenCalledOnce();
    expect(apiMock.post).toHaveBeenCalledWith(
      "/payments/demo/opaque-token/success",
    );
    expect(result.data.payment).toEqual(response.data.payment);
  });

  it("submits public failure without a request body", async () => {
    const response = {
      status: "success",
      message: "Demo payment failed.",
      data: { payment: { ...demoPayment, status: "failed" as const } },
    };
    apiMock.post.mockResolvedValue({ data: response });

    const result: DemoPaymentResponse =
      await useUserPayment().failDemoPayment("opaque-token");

    expect(apiMock.post).toHaveBeenCalledOnce();
    expect(apiMock.post).toHaveBeenCalledWith(
      "/payments/demo/opaque-token/failure",
    );
    expect(result.data.payment).toEqual(response.data.payment);
  });

  it("loads an authenticated payment by payment ID", async () => {
    const response = {
      status: "success",
      message: "Payment retrieved successfully.",
      data: { payment },
    };
    apiMock.get.mockResolvedValue({ data: response });

    const result = await useUserPayment().getPayment(16);

    expect(apiMock.get).toHaveBeenCalledOnce();
    expect(apiMock.get).toHaveBeenCalledWith("/payments/16");
    expect(result).toEqual(response);
  });

  it("normalizes API errors using the existing payment error shape", async () => {
    const error = Object.assign(new Error("Request failed"), {
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          message: "Validation failed",
          errors: { order_id: ["The order ID is invalid."] },
        },
      },
    });
    apiMock.post.mockRejectedValue(error);

    await expect(
      useUserPayment().createPayment({
        order_id: 0,
        method: "online",
      }),
    ).rejects.toEqual({
      message: "Validation failed",
      errors: { order_id: ["The order ID is invalid."] },
      status: 422,
    });
  });

  it("uses the demo lookup fallback message for non-Axios errors", async () => {
    apiMock.get.mockRejectedValue(new Error("offline"));

    await expect(
      useUserPayment().getDemoPayment("opaque-token"),
    ).rejects.toEqual({
      message: "offline",
      errors: {},
      status: 500,
    });
  });
});

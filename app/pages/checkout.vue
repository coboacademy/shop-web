<template>
  <div class="min-h-screen bg-gray-50 py-12">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-800">Checkout</h1>
        <p class="text-gray-500 mt-2">Complete your order and enjoy your meal!</p>
      </div>

      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Left Column: Forms -->
        <div class="flex-1 space-y-6">
          <!-- Delivery Address Form -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span
                class="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs"
                >1</span
              >
              Delivery Address
            </h2>
            <form @submit.prevent="submitOrder" class="space-y-4">
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-700 font-medium mb-1">First Name *</label>
                  <input
                    v-model="address.firstName"
                    type="text"
                    required
                    class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label class="block text-gray-700 font-medium mb-1">Last Name *</label>
                  <input
                    v-model="address.lastName"
                    type="text"
                    required
                    class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label class="block text-gray-700 font-medium mb-1"
                  >Email Address *</label
                >
                <input
                  v-model="address.email"
                  type="email"
                  required
                  class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label class="block text-gray-700 font-medium mb-1">Phone Number *</label>
                <input
                  v-model="address.phone"
                  type="tel"
                  required
                  class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label class="block text-gray-700 font-medium mb-1"
                  >Street Address *</label
                >
                <input
                  v-model="address.street"
                  type="text"
                  required
                  class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div class="grid sm:grid-cols-3 gap-4">
                <div>
                  <label class="block text-gray-700 font-medium mb-1">City *</label>
                  <input
                    v-model="address.city"
                    type="text"
                    required
                    class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label class="block text-gray-700 font-medium mb-1">State *</label>
                  <input
                    v-model="address.state"
                    type="text"
                    required
                    class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label class="block text-gray-700 font-medium mb-1">ZIP Code *</label>
                  <input
                    v-model="address.zip"
                    type="text"
                    required
                    class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </form>
          </div>

          <!-- Payment Method -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span
                class="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs"
                >2</span
              >
              Payment Method
            </h2>
            <div class="space-y-3">
              <label
                class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-orange-50 transition"
              >
                <input
                  type="radio"
                  v-model="paymentMethod"
                  value="credit_card"
                  class="text-orange-500"
                />
                <span class="font-medium">💳 Credit / Debit Card</span>
              </label>
              <label
                class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-orange-50 transition"
              >
                <input
                  type="radio"
                  v-model="paymentMethod"
                  value="paypal"
                  class="text-orange-500"
                />
                <span class="font-medium">💰 PayPal</span>
              </label>
              <label
                class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-orange-50 transition"
              >
                <input
                  type="radio"
                  v-model="paymentMethod"
                  value="cash"
                  class="text-orange-500"
                />
                <span class="font-medium">💵 Cash on Delivery</span>
              </label>
            </div>

            <!-- Credit Card Fields (shown only if selected) -->
            <div v-if="paymentMethod === 'credit_card'" class="mt-4 space-y-3">
              <div>
                <label class="block text-gray-700 font-medium mb-1">Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  class="w-full px-4 py-2 rounded-lg border border-gray-200"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-gray-700 font-medium mb-1">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    class="w-full px-4 py-2 rounded-lg border border-gray-200"
                  />
                </div>
                <div>
                  <label class="block text-gray-700 font-medium mb-1">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    class="w-full px-4 py-2 rounded-lg border border-gray-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Additional Notes -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Order Notes (Optional)</h2>
            <textarea
              v-model="orderNotes"
              rows="3"
              placeholder="Any special instructions? (e.g., extra sauce, no onions, etc.)"
              class="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            ></textarea>
          </div>
        </div>

        <!-- Right Column: Order Summary -->
        <div class="lg:w-96">
          <div class="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
            <h2 class="text-xl font-bold text-gray-800 mb-4">Your Order</h2>

            <!-- Cart Items -->
            <div class="space-y-3 max-h-80 overflow-y-auto mb-4">
              <div
                v-for="item in cartStore.items"
                :key="item.id"
                class="flex gap-3 pb-3 border-b"
              >
                <img :src="item.image" class="w-16 h-16 rounded-lg object-cover" />
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-800">{{ item.name }}</h4>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-500">Qty: {{ item.quantity }}</span>
                    <span class="text-orange-600 font-bold"
                      >${{ (item.price * item.quantity).toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Price Breakdown -->
            <div class="space-y-2 pt-3 border-t">
              <div class="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>${{ deliveryFee.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>Tax (10%)</span>
                <span>${{ tax.toFixed(2) }}</span>
              </div>
              <div
                class="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t"
              >
                <span>Total</span>
                <span class="text-orange-600">${{ total.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Promo Code (Optional) -->
            <div class="mt-4">
              <div class="flex gap-2">
                <input
                  v-model="promoCode"
                  type="text"
                  placeholder="Promo code"
                  class="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
                <button
                  @click="applyPromo"
                  class="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition"
                >
                  Apply
                </button>
              </div>
              <p v-if="promoMessage" class="text-xs text-green-600 mt-1">
                {{ promoMessage }}
              </p>
            </div>

            <!-- Place Order Button -->
            <button
              @click="submitOrder"
              :disabled="isSubmitting || !isFormValid"
              class="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? "Placing Order..." : "Place Order" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <Transition name="modal">
      <div
        v-if="showSuccessModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      >
        <div
          class="bg-white rounded-2xl p-6 max-w-md mx-4 text-center animate-fade-in-up"
        >
          <div
            class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h3>
          <p class="text-gray-500 mb-4">
            Thank you for your order. We'll start preparing it right away.
          </p>
          <p class="text-sm text-gray-400 mb-6">Order #{{ orderNumber }}</p>
          <NuxtLink
            to="/"
            class="inline-block px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition"
          >
            Back to Home
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>

const cartStore = useCartStore()

// Address form
const address = ref({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  zip: "",
});

// Payment and notes
const paymentMethod = ref("cash");
const orderNotes = ref("");
const promoCode = ref("");
const promoMessage = ref("");
const isSubmitting = ref(false);
const showSuccessModal = ref(false);
const orderNumber = ref("");


// Use store getters
const subtotal = computed(() => cartStore.subtotal)
const deliveryFee = computed(() => cartStore.deliveryFee)
const tax = computed(() => cartStore.tax)
const total = computed(() => cartStore.total)

// Form validation
const isFormValid = computed(() => {
  return (
    address.value.firstName &&
    address.value.lastName &&
    address.value.email &&
    address.value.phone &&
    address.value.street &&
    address.value.city &&
    address.value.state &&
    address.value.zip &&
    cartStore.items.length > 0
  );
});

// Apply promo code (mock)
const applyPromo = () => {
  if (promoCode.value === "FOODIE10") {
    promoMessage.value = "10% discount applied!";
    // You can adjust total logic here if needed
  } else {
    promoMessage.value = "Invalid promo code";
  }
};

// Submit order
const submitOrder = async () => {
  if (!isFormValid.value) return
  isSubmitting.value = true
  // Simulate API
  await new Promise(resolve => setTimeout(resolve, 1500))
  orderNumber.value = 'ORD-' + Math.floor(Math.random() * 1000000)
  // Clear cart after successful order
  cartStore.clearCart()
  isSubmitting.value = false
  showSuccessModal.value = true
}

// SEO
useHead({
  title: "Checkout - Durian",
  meta: [
    {
      name: "description",
      content:
        "Complete your order securely. Review your cart, enter delivery details, and choose payment method.",
    },
  ],
});
</script>

<style scoped>
/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out forwards;
}
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>

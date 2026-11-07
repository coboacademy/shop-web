<script setup lang="ts">
import {
  ArrowLeft,
  Check,
  Heart,
  ImageOff,
  MessageCircle,
  PackageCheck,
  ShoppingCart,
  ShieldCheck,
  Star,
  Store,
} from "lucide-vue-next";
import {
  usePublicProducts,
  type PublicProduct,
  type PublicProductQuestion,
  type PublicProductReview,
  type PublicProductVariant,
} from "~/composables/usePublicProducts";
import { useCart, type CartApiError } from "~/composables/useCart";
import { useWishlist, type WishlistApiError } from "~/composables/useWishlist";

definePageMeta({
  layout: "public",
  title: "Product",
});

const route = useRoute();
const authStore = useAuthStore();
const toast = useToast();
const { addItem } = useCart();
const { addItem: addWishlistItem } = useWishlist();
const {
  getProduct,
  getProductReviews,
  getProductQuestions,
  createProductQuestion,
} = usePublicProducts();
const product = ref<PublicProduct | null>(null);
const reviews = ref<PublicProductReview[]>([]);
const questions = ref<PublicProductQuestion[]>([]);
const selectedImageIndex = ref(0);
const selectedValues = reactive<Record<string, string>>({});
const failedImageUrls = ref(new Set<string>());
const loading = ref(true);
const reviewsLoading = ref(false);
const questionsLoading = ref(false);
const errorMessage = ref("");
const reviewsError = ref("");
const questionsError = ref("");
const cartQuantity = ref(1);
const addingToCart = ref(false);
const cartError = ref("");
const addingToWishlist = ref(false);
const wishlistError = ref("");
const questionDraft = ref("");
const questionSubmitError = ref("");
const questionFieldError = ref("");
const submittingQuestion = ref(false);

const productId = computed(() => String(route.params.id || ""));
const images = computed(() => product.value?.images || []);
const activeVariants = computed(
  () => product.value?.variants?.filter((variant) => variant.is_active) || [],
);
const isCustomer = computed(
  () =>
    authStore.initialized &&
    authStore.isAuthenticated &&
    authStore.hasPermission("account.view") &&
    !authStore.hasPermission("dashboard.view") &&
    !authStore.hasRole("Vendor") &&
    !authStore.hasPermission("vendor.view"),
);
const requiresVariant = computed(
  () => Boolean(product.value?.options?.length || activeVariants.value.length),
);
const loginLink = computed(() => ({
  path: "/login",
  query: { redirect: `/products/${encodeURIComponent(productId.value)}` },
}));

const selectedVariant = computed<PublicProductVariant | null>(() => {
  if (!activeVariants.value.length) return null;
  const options = product.value?.options || [];
  if (!options.length) return activeVariants.value[0] || null;

  const allValuesSelected = options.every(
    (option) => Boolean(selectedValues[String(option.id)]),
  );
  if (!allValuesSelected) return null;

  return (
    activeVariants.value.find((variant) =>
      options.every((option) =>
        variant.option_values.some(
          (value) =>
            String(value.option_id) === String(option.id) &&
            String(value.id) === selectedValues[String(option.id)],
        ),
      ),
    ) || null
  );
});

const shownPrice = computed(
  () => selectedVariant.value?.price || product.value?.price || "0",
);
const shownComparePrice = computed(
  () =>
    selectedVariant.value?.compare_at_price ||
    product.value?.compare_at_price ||
    null,
);
const variantAvailability = computed(() => {
  const inventory = selectedVariant.value?.inventory;
  if (!inventory) return null;
  if (inventory.is_out_of_stock || inventory.available_quantity <= 0) {
    return "Currently unavailable";
  }
  return inventory.available_quantity === 1
    ? "1 available"
    : `${inventory.available_quantity} available`;
});

const getErrorMessage = (error: unknown, fallback: string) =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string"
    ? error.message
    : fallback;

const isCartApiError = (error: unknown): error is CartApiError =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string" &&
  "errors" in error &&
  typeof error.errors === "object" &&
  error.errors !== null &&
  "status" in error &&
  typeof error.status === "number";

const isWishlistApiError = (error: unknown): error is WishlistApiError =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string" &&
  "errors" in error &&
  typeof error.errors === "object" &&
  error.errors !== null &&
  "status" in error &&
  typeof error.status === "number";

const isQuestionApiError = (
  error: unknown,
): error is { message: string; errors: Record<string, string[]>; status: number } =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string" &&
  "errors" in error &&
  typeof error.errors === "object" &&
  error.errors !== null &&
  "status" in error &&
  typeof error.status === "number";

const formatPrice = (price: string | number | null | undefined) => {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "Price unavailable";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
};

const handleImageError = (url: string) => {
  failedImageUrls.value.add(url);
};

const chooseOptionValue = (optionId: number | string, valueId: number | string) => {
  selectedValues[String(optionId)] = String(valueId);
};

const addProductToCart = async () => {
  cartError.value = "";

  if (!product.value || !isCustomer.value) return;
  if (!Number.isInteger(cartQuantity.value) || cartQuantity.value < 1 || cartQuantity.value > 9999) {
    cartError.value = "Quantity must be between 1 and 9,999.";
    return;
  }
  if (requiresVariant.value && !selectedVariant.value) {
    cartError.value = "Select an available product option before adding it to your cart.";
    return;
  }
  if (
    selectedVariant.value?.inventory?.is_out_of_stock ||
    (selectedVariant.value?.inventory &&
      selectedVariant.value.inventory.available_quantity < cartQuantity.value)
  ) {
    cartError.value = "The selected quantity is not currently available.";
    return;
  }

  addingToCart.value = true;
  try {
    const response = await addItem({
      product_id: product.value.id,
      variant_id: selectedVariant.value?.id
        ? String(selectedVariant.value.id)
        : null,
      quantity: cartQuantity.value,
    });
    toast.success("Added to cart", response.message);
  } catch (error: unknown) {
    if (isCartApiError(error) && error.status === 401) {
      await navigateTo(loginLink.value);
      return;
    }

    const validationMessage = isCartApiError(error)
      ? error.errors.quantity?.[0] ||
        error.errors.variant_id?.[0] ||
        error.errors.product_id?.[0]
      : undefined;
    cartError.value =
      validationMessage ||
      getErrorMessage(error, "Could not add this product to your cart.");
    toast.error("Could not add to cart", cartError.value);
  } finally {
    addingToCart.value = false;
  }
};

const saveToWishlist = async () => {
  wishlistError.value = "";
  if (!product.value) return;
  if (!isCustomer.value) {
    await navigateTo(loginLink.value);
    return;
  }

  addingToWishlist.value = true;
  try {
    const response = await addWishlistItem(product.value.id);
    toast.success("Saved to wishlist", response.message);
  } catch (error: unknown) {
    if (isWishlistApiError(error) && error.status === 401) {
      await navigateTo(loginLink.value);
      return;
    }

    wishlistError.value = getErrorMessage(
      error,
      "Could not save this product to your wishlist.",
    );
    toast.error("Wishlist update failed", wishlistError.value);
  } finally {
    addingToWishlist.value = false;
  }
};

const submitProductQuestion = async () => {
  questionSubmitError.value = "";
  questionFieldError.value = "";
  const questionText = questionDraft.value.trim();

  if (!product.value || !isCustomer.value) return;
  if (!questionText) {
    questionFieldError.value = "Enter a question before submitting.";
    return;
  }
  if (questionText.length > 2000) {
    questionFieldError.value = "Questions must be 2,000 characters or fewer.";
    return;
  }

  submittingQuestion.value = true;
  try {
    const response = await createProductQuestion({
      product_id: product.value.id,
      question: questionText,
    });
    questions.value = [
      response.data.question,
      ...questions.value.filter((item) => item.id !== response.data.question.id),
    ];
    questionDraft.value = "";
    toast.success("Question submitted", response.message);
  } catch (error: unknown) {
    if (isQuestionApiError(error) && error.status === 401) {
      await navigateTo(loginLink.value);
      return;
    }

    questionFieldError.value = isQuestionApiError(error)
      ? error.errors.question?.[0] || ""
      : "";
    questionSubmitError.value = getErrorMessage(
      error,
      "Could not submit your question. Please try again.",
    );
    toast.error("Question not submitted", questionSubmitError.value);
  } finally {
    submittingQuestion.value = false;
  }
};

const loadReviews = async () => {
  reviewsLoading.value = true;
  reviewsError.value = "";
  try {
    const response = await getProductReviews(productId.value);
    reviews.value = response.data.reviews;
  } catch (error: unknown) {
    reviewsError.value = getErrorMessage(error, "Could not load reviews.");
  } finally {
    reviewsLoading.value = false;
  }
};

const loadQuestions = async () => {
  questionsLoading.value = true;
  questionsError.value = "";
  try {
    const response = await getProductQuestions(productId.value);
    questions.value = response.data.questions;
  } catch (error: unknown) {
    questionsError.value = getErrorMessage(error, "Could not load questions.");
  } finally {
    questionsLoading.value = false;
  }
};

const loadProduct = async () => {
  loading.value = true;
  errorMessage.value = "";
  product.value = null;
  reviews.value = [];
  questions.value = [];
  failedImageUrls.value.clear();
  Object.keys(selectedValues).forEach((key) => delete selectedValues[key]);

  try {
    const response = await getProduct(productId.value);
    product.value = response.data.product;
    selectedImageIndex.value = Math.max(
      0,
      images.value.findIndex((image) => image.is_primary),
    );

    const initialVariant = product.value.variants?.find(
      (variant) => variant.is_active,
    );
    for (const option of product.value.options || []) {
      const variantValue = initialVariant?.option_values.find(
        (value) => String(value.option_id) === String(option.id),
      );
      const initialValue = variantValue || option.values[0];
      if (initialValue) {
        selectedValues[String(option.id)] = String(initialValue.id);
      }
    }

    loading.value = false;
    await Promise.all([loadReviews(), loadQuestions()]);
  } catch (error: unknown) {
    errorMessage.value = getErrorMessage(
      error,
      "This product could not be found or is no longer available.",
    );
  } finally {
    loading.value = false;
  }
};

onMounted(loadProduct);

watch(productId, () => {
  if (import.meta.client) loadProduct();
});

useHead({
  title: computed(() =>
    product.value ? `${product.value.name} | Cobo Shop` : "Product | Cobo Shop",
  ),
});
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <NuxtLink
        to="/products"
        class="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft class="h-4 w-4" />
        Back to products
      </NuxtLink>

      <div v-if="loading" class="mt-6 grid animate-pulse gap-8 lg:grid-cols-2">
        <div class="aspect-square rounded-3xl bg-muted" />
        <div class="space-y-5 py-4">
          <div class="h-5 w-1/3 rounded bg-muted" />
          <div class="h-10 w-4/5 rounded bg-muted" />
          <div class="h-8 w-1/4 rounded bg-muted" />
          <div class="h-32 rounded bg-muted" />
        </div>
      </div>

      <section
        v-else-if="errorMessage"
        class="mx-auto mt-12 max-w-xl rounded-3xl border border-border bg-card px-6 py-14 text-center"
      >
        <ImageOff class="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 class="mt-4 text-2xl font-bold">Product unavailable</h1>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">{{ errorMessage }}</p>
        <NuxtLink
          to="/products"
          class="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Browse products
        </NuxtLink>
      </section>

      <template v-else-if="product">
        <div class="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-14">
          <section aria-label="Product images" class="min-w-0">
            <div class="relative aspect-square overflow-hidden rounded-3xl bg-muted">
              <img
                v-if="images[selectedImageIndex]?.url && !failedImageUrls.has(images[selectedImageIndex].url)"
                :src="images[selectedImageIndex].url"
                :alt="product.name"
                class="h-full w-full object-cover"
                @error="handleImageError(images[selectedImageIndex].url)"
              />
              <div v-else class="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <ImageOff class="h-9 w-9" />
                <span class="text-sm">
                  {{ images[selectedImageIndex]?.url ? "Image unavailable" : "No product image available" }}
                </span>
              </div>
              <div
                v-if="product.categories?.[0]"
                class="absolute left-4 top-4 rounded-full border border-border/70 bg-background/90 px-3 py-1.5 text-xs font-medium backdrop-blur"
              >
                {{ product.categories[0].name }}
              </div>
            </div>
            <div v-if="images.length > 1" class="mt-3 grid grid-cols-5 gap-3 sm:grid-cols-6">
              <button
                v-for="(image, index) in images"
                :key="image.id"
                type="button"
                :aria-label="`Show product image ${index + 1}`"
                :aria-pressed="selectedImageIndex === index"
                class="aspect-square overflow-hidden rounded-xl border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                :class="selectedImageIndex === index ? 'border-primary' : 'border-transparent hover:border-border'"
                @click="selectedImageIndex = index"
              >
                <img
                  v-if="!failedImageUrls.has(image.url)"
                  :src="image.url"
                  :alt="`${product.name} image ${index + 1}`"
                  class="h-full w-full object-cover"
                  loading="lazy"
                  @error="handleImageError(image.url)"
                />
                <span v-else class="flex h-full items-center justify-center bg-muted text-[10px] text-muted-foreground">
                  Unavailable
                </span>
              </button>
            </div>
          </section>

          <section class="lg:py-2">
            <div v-if="product.store" class="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Store class="h-4 w-4" />
              {{ product.store.name }}
            </div>
            <div v-else class="text-sm text-muted-foreground">Store product</div>

            <h1 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{{ product.name }}</h1>
            <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <a href="#reviews" class="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary">
                <Star class="h-4 w-4 fill-amber-400 text-amber-400" />
                {{ reviews.length }} {{ reviews.length === 1 ? "review" : "reviews" }}
              </a>
              <a href="#questions" class="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary">
                <MessageCircle class="h-4 w-4" />
                {{ questions.length }} {{ questions.length === 1 ? "question" : "questions" }}
              </a>
            </div>

            <div class="mt-6 flex items-baseline gap-3">
              <span class="text-3xl font-bold">{{ formatPrice(shownPrice) }}</span>
              <span
                v-if="shownComparePrice && Number(shownComparePrice) > Number(shownPrice)"
                class="text-base text-muted-foreground line-through"
              >
                {{ formatPrice(shownComparePrice) }}
              </span>
            </div>

            <div v-if="product.categories?.length" class="mt-5 flex flex-wrap gap-2">
              <span
                v-for="category in product.categories"
                :key="category.id"
                class="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {{ category.name }}
              </span>
            </div>

            <div v-if="product.description" class="mt-6 border-t border-border pt-5">
              <h2 class="text-sm font-semibold">About this product</h2>
              <p class="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {{ product.description }}
              </p>
            </div>

            <div v-if="product.options?.length" class="mt-6 space-y-5 border-t border-border pt-5">
              <fieldset v-for="option in product.options" :key="option.id">
                <legend class="text-sm font-semibold">
                  {{ option.name }}
                  <span class="ml-1 font-normal text-muted-foreground">
                    · {{ option.values.find((value) => String(value.id) === selectedValues[String(option.id)])?.value || "Choose an option" }}
                  </span>
                </legend>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button
                    v-for="value in option.values"
                    :key="value.id"
                    type="button"
                    :aria-pressed="selectedValues[String(option.id)] === String(value.id)"
                    class="min-w-12 rounded-xl border px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    :class="selectedValues[String(option.id)] === String(value.id) ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'"
                    @click="chooseOptionValue(option.id, value.id)"
                  >
                    {{ value.value }}
                  </button>
                </div>
              </fieldset>
              <p
                v-if="activeVariants.length && !selectedVariant"
                class="text-sm text-amber-700 dark:text-amber-300"
                role="status"
              >
                This option combination is not available.
              </p>
            </div>

            <div class="mt-6 flex flex-wrap items-center gap-2 text-sm">
              <template v-if="variantAvailability">
                <span
                  class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-medium"
                  :class="variantAvailability === 'Currently unavailable' ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'"
                >
                  <Check v-if="variantAvailability !== 'Currently unavailable'" class="h-4 w-4" />
                  <PackageCheck v-else class="h-4 w-4" />
                  {{ variantAvailability }}
                </span>
              </template>
              <span v-else class="inline-flex items-center gap-2 text-muted-foreground">
                <ShieldCheck class="h-4 w-4" />
                Product details provided by the store
              </span>
            </div>

            <div class="mt-7 rounded-2xl border border-border bg-card p-4">
              <p class="text-sm font-semibold">Sold by {{ product.store?.name || "our store" }}</p>
              <p class="mt-1 text-xs leading-5 text-muted-foreground">
                Product information and availability are supplied by the store.
              </p>
            </div>

            <div class="mt-5">
              <template v-if="isCustomer">
                <button
                  type="button"
                  class="mb-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-card-foreground transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:border-rose-800 dark:hover:bg-rose-950/30 dark:hover:text-rose-300"
                  :disabled="addingToWishlist"
                  @click="saveToWishlist"
                >
                  <Heart class="h-4 w-4" />
                  {{ addingToWishlist ? "Saving…" : "Save to wishlist" }}
                </button>
                <p v-if="wishlistError" class="mb-3 text-sm text-destructive" role="alert">
                  {{ wishlistError }}
                  <NuxtLink
                    to="/app/wishlist"
                    class="ml-1 font-semibold underline underline-offset-2"
                  >
                    View wishlist
                  </NuxtLink>
                </p>
                <div class="flex flex-col gap-3 sm:flex-row">
                  <label class="sr-only" for="product-quantity">Quantity</label>
                  <input
                    id="product-quantity"
                    v-model.number="cartQuantity"
                    type="number"
                    min="1"
                    max="9999"
                    step="1"
                    aria-label="Quantity"
                    class="h-12 w-24 rounded-xl border border-border bg-background px-3 text-center text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    class="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="addingToCart || (requiresVariant && !selectedVariant) || variantAvailability === 'Currently unavailable'"
                    @click="addProductToCart"
                  >
                    <ShoppingCart class="h-4 w-4" />
                    {{ addingToCart ? "Adding…" : "Add to cart" }}
                  </button>
                </div>
                <p v-if="cartError" class="mt-2 text-sm text-destructive" role="alert">
                  {{ cartError }}
                </p>
                <NuxtLink
                  to="/app/cart"
                  class="mt-3 inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  View cart
                </NuxtLink>
              </template>
              <NuxtLink
                v-else-if="!authStore.isAuthenticated"
                :to="loginLink"
                class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <ShoppingCart class="h-4 w-4" />
                Sign in to add to cart
              </NuxtLink>
              <p v-else class="rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                Cart purchases are available to signed-in customer accounts.
              </p>
            </div>
          </section>
        </div>

        <div class="mt-14 grid gap-12 border-t border-border pt-10 lg:grid-cols-2">
          <section id="reviews" class="scroll-mt-8">
            <div class="flex items-end justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Customer feedback</p>
                <h2 class="mt-2 text-2xl font-bold">Reviews</h2>
              </div>
              <span class="text-sm text-muted-foreground">{{ reviews.length }} shown</span>
            </div>
            <p v-if="reviewsError" class="mt-5 rounded-xl bg-destructive/5 p-4 text-sm text-destructive">
              {{ reviewsError }}
            </p>
            <div v-else-if="reviewsLoading" class="mt-5 text-sm text-muted-foreground">Loading reviews…</div>
            <div v-else-if="!reviews.length" class="mt-5 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No approved reviews yet.
            </div>
            <div v-else class="mt-5 divide-y divide-border rounded-2xl border border-border bg-card">
              <article v-for="review in reviews" :key="review.id" class="p-5">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="font-semibold">{{ review.customer.name }}</p>
                    <p class="mt-1 text-xs text-muted-foreground">{{ formatDate(review.created_at) }}</p>
                  </div>
                  <div class="flex items-center gap-0.5" :aria-label="`${review.rating} out of 5 stars`">
                    <Star
                      v-for="star in 5"
                      :key="star"
                      class="h-4 w-4"
                      :class="star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'"
                    />
                  </div>
                </div>
                <p v-if="review.comment" class="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {{ review.comment }}
                </p>
              </article>
            </div>
            <p v-if="reviews.length === 10" class="mt-3 text-xs text-muted-foreground">
              Showing the latest 10 reviews. Pagination metadata is not provided by the API.
            </p>
          </section>

          <section id="questions" class="scroll-mt-8">
            <div class="flex items-end justify-between gap-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Need to know more?</p>
                <h2 class="mt-2 text-2xl font-bold">Questions &amp; answers</h2>
              </div>
              <span class="text-sm text-muted-foreground">{{ questions.length }} shown</span>
            </div>
            <form
              v-if="isCustomer"
              class="mt-5 rounded-2xl border border-border bg-card p-5"
              @submit.prevent="submitProductQuestion"
            >
              <label for="product-question" class="block text-sm font-semibold">
                Ask about this product
              </label>
              <p class="mt-1 text-xs leading-5 text-muted-foreground">
                Your question will be shared with the store. Maximum 2,000 characters.
              </p>
              <textarea
                id="product-question"
                v-model="questionDraft"
                required
                maxlength="2000"
                rows="4"
                :aria-invalid="Boolean(questionFieldError)"
                aria-describedby="product-question-help"
                placeholder="What would you like to know?"
                class="mt-3 w-full resize-y rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-destructive"
                :disabled="submittingQuestion"
              />
              <div class="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p id="product-question-help" class="text-xs text-muted-foreground">
                  {{ questionDraft.length }}/2,000 characters
                </p>
                <button
                  type="submit"
                  class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  :disabled="submittingQuestion || !questionDraft.trim()"
                >
                  <MessageCircle class="h-4 w-4" />
                  {{ submittingQuestion ? "Submitting…" : "Submit question" }}
                </button>
              </div>
              <p v-if="questionFieldError" class="mt-2 text-sm text-destructive" role="alert">
                {{ questionFieldError }}
              </p>
              <p v-else-if="questionSubmitError" class="mt-2 text-sm text-destructive" role="alert">
                {{ questionSubmitError }}
              </p>
            </form>
            <div
              v-else-if="!authStore.isAuthenticated"
              class="mt-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p class="text-sm font-semibold">Have a question about this product?</p>
                <p class="mt-1 text-xs text-muted-foreground">
                  Sign in with a customer account to ask the store.
                </p>
              </div>
              <NuxtLink
                :to="loginLink"
                class="inline-flex h-10 shrink-0 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold transition hover:bg-muted"
              >
                Sign in to ask
              </NuxtLink>
            </div>
            <p v-if="questionsError" class="mt-5 rounded-xl bg-destructive/5 p-4 text-sm text-destructive">
              {{ questionsError }}
            </p>
            <div v-else-if="questionsLoading" class="mt-5 text-sm text-muted-foreground">Loading questions…</div>
            <div v-else-if="!questions.length" class="mt-5 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No questions yet.
            </div>
            <div v-else class="mt-5 space-y-3">
              <article
                v-for="question in questions"
                :key="question.id"
                class="rounded-2xl border border-border bg-card p-5"
              >
                <div class="flex items-start justify-between gap-4">
                  <p class="text-sm font-semibold leading-6">{{ question.question }}</p>
                  <span class="shrink-0 text-xs text-muted-foreground">{{ formatDate(question.created_at) }}</span>
                </div>
                <p class="mt-2 text-xs text-muted-foreground">Asked by {{ question.customer.name }}</p>
                <div v-if="question.answer" class="mt-4 rounded-xl bg-muted/60 p-4">
                  <p class="text-xs font-semibold text-primary">
                    {{ question.answered_by?.name || "Store response" }}
                  </p>
                  <p class="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{{ question.answer }}</p>
                </div>
                <p v-else class="mt-4 text-sm italic text-muted-foreground">Waiting for a store response.</p>
              </article>
            </div>
            <p v-if="questions.length === 10" class="mt-3 text-xs text-muted-foreground">
              Showing the latest 10 questions. Pagination metadata is not provided by the API.
            </p>
          </section>
        </div>
      </template>
    </div>
  </div>
</template>

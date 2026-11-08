<script setup lang="ts">
import {
  ArrowUpRight,
  Heart,
  ImageOff,
  Store,
} from "lucide-vue-next";
import type { PublicProduct } from "~/composables/usePublicProducts";
import { isStorefrontSpecialOffer } from "~/utils/storefrontCatalog";

const props = defineProps<{
  product: PublicProduct;
  wishlisted?: boolean;
  wishlistPending?: boolean;
}>();
const product = toRef(props, "product");

const emit = defineEmits<{
  wishlist: [product: PublicProduct];
}>();

const failedImageUrls = ref(new Set<string>());

const imageUrl = computed(() => {
  const url =
    product.value.images.find((image) => image.is_primary)?.url ||
    product.value.images[0]?.url ||
    "";
  return failedImageUrls.value.has(url) ? "" : url;
});

const handleImageError = (url: string) => {
  failedImageUrls.value = new Set(failedImageUrls.value).add(url);
};

const formatPrice = (price: string | null) => {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return "Price unavailable";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

</script>

<template>
  <article
    class="group/card flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm shadow-slate-900/[0.03] transition duration-300 ease-out motion-safe:hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-900/[0.06] motion-reduce:transition-none motion-reduce:hover:transform-none"
  >
    <div class="relative aspect-[4/3] overflow-hidden bg-[#F1F5F9]">
      <NuxtLink
        :to="`/products/${encodeURIComponent(product.id)}`"
        :aria-label="`View ${product.name}`"
        class="group/image block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2563EB]"
      >
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="product.name"
          class="h-full w-full object-cover transition duration-300 group-hover/image:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover/image:transform-none"
          loading="lazy"
          decoding="async"
          @error="handleImageError(imageUrl)"
        />
        <div
          v-else
          class="flex h-full flex-col items-center justify-center gap-2 text-sm text-[#64748B]"
        >
          <ImageOff class="h-7 w-7" aria-hidden="true" />
          <span>Image unavailable</span>
        </div>
        <span
          class="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-[#0F172A] shadow-md transition duration-200 group-hover/image:bg-[#2563EB] group-hover/image:text-white group-focus-visible/image:bg-[#2563EB] group-focus-visible/image:text-white sm:translate-y-1 sm:opacity-0 sm:group-hover/image:translate-y-0 sm:group-hover/image:opacity-100 sm:group-focus-visible/image:translate-y-0 sm:group-focus-visible/image:opacity-100 motion-reduce:transition-none"
        >
          View product
          <ArrowUpRight class="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </NuxtLink>

      <span
        v-if="isStorefrontSpecialOffer(product)"
        class="pointer-events-none absolute left-3 top-3 rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-bold text-[#1D4ED8]"
      >
        Special price
      </span>
      <button
        type="button"
        class="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-[#334155] shadow-sm transition-colors hover:bg-blue-50 hover:text-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
        :aria-label="
          wishlisted === undefined
            ? `Update ${product.name} wishlist status`
            : wishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
        "
        :aria-pressed="wishlisted"
        :disabled="wishlistPending"
        :aria-busy="wishlistPending || undefined"
        @click.stop="emit('wishlist', product)"
      >
        <Heart
          class="h-4 w-4"
          :class="wishlisted ? 'fill-rose-500 text-rose-500' : ''"
          aria-hidden="true"
        />
      </button>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <p v-if="product.store" class="flex items-center gap-1.5 text-xs font-medium text-[#64748B] transition-colors group-hover/card:text-[#475569]">
        <Store class="h-3.5 w-3.5" aria-hidden="true" />
        <span class="truncate">{{ product.store.name }}</span>
      </p>
      <h3 class="mt-2 line-clamp-2 min-h-12 text-sm font-semibold leading-6 text-[#0F172A]">
        <NuxtLink
          :to="`/products/${encodeURIComponent(product.id)}`"
          class="rounded-sm transition-colors group-hover/card:text-[#2563EB] hover:text-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] motion-reduce:transition-none"
        >
          {{ product.name }}
        </NuxtLink>
      </h3>
      <p
        v-if="product.categories[0]"
        class="mt-1 truncate text-xs text-[#64748B]"
      >
        {{ product.categories[0].name }}
      </p>

      <div class="mt-auto flex items-end justify-between gap-3 pt-4">
        <div>
          <p class="font-bold text-[#0F172A]">{{ formatPrice(product.price) }}</p>
          <p
            v-if="isStorefrontSpecialOffer(product)"
            class="text-xs text-[#64748B] line-through"
          >
            {{ formatPrice(product.compare_at_price) }}
          </p>
        </div>
        <NuxtLink
          :to="`/products/${encodeURIComponent(product.id)}`"
          :aria-label="`View details for ${product.name}`"
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB] transition-colors hover:bg-[#2563EB] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          <ArrowUpRight class="h-4 w-4" aria-hidden="true" />
        </NuxtLink>
      </div>
    </div>
  </article>
</template>

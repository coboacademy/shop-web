<script setup lang="ts">
import { ChevronLeft, ChevronRight, MoreHorizontal, Rows3 } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    currentPage: number;
    lastPage: number;
    total: number;
    perPage?: number;
    loading?: boolean;
    label?: string;
  }>(),
  {
    perPage: 10,
    loading: false,
    label: "datasets",
  }
);

const emit = defineEmits<{
  (e: "previous"): void;
  (e: "next"): void;
  (e: "page", page: number): void;
}>();

const safeCurrentPage = computed(() => {
  return Math.max(Number(props.currentPage || 1), 1);
});

const safeLastPage = computed(() => {
  return Math.max(Number(props.lastPage || 1), 1);
});

const safeTotal = computed(() => {
  return Math.max(Number(props.total || 0), 0);
});

const safePerPage = computed(() => {
  return Math.max(Number(props.perPage || 10), 1);
});

const fromItem = computed(() => {
  if (safeTotal.value === 0) return 0;

  return (safeCurrentPage.value - 1) * safePerPage.value + 1;
});

const toItem = computed(() => {
  return Math.min(safeCurrentPage.value * safePerPage.value, safeTotal.value);
});

const canGoPrevious = computed(() => {
  return safeCurrentPage.value > 1 && !props.loading;
});

const canGoNext = computed(() => {
  return safeCurrentPage.value < safeLastPage.value && !props.loading;
});

const visiblePages = computed<(number | "...")[]>(() => {
  const current = safeCurrentPage.value;
  const last = safeLastPage.value;

  if (last <= 7) {
    return Array.from({ length: last }, (_, index) => index + 1);
  }

  const pages: (number | "...")[] = [];

  pages.push(1);

  if (current > 4) {
    pages.push("...");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);

  for (let page = start; page <= end; page++) {
    pages.push(page);
  }

  if (current < last - 3) {
    pages.push("...");
  }

  pages.push(last);

  return pages;
});

const handlePrevious = () => {
  if (!canGoPrevious.value) return;

  emit("previous");
};

const handleNext = () => {
  if (!canGoNext.value) return;

  emit("next");
};

const handlePage = (page: number | "...") => {
  if (page === "...") return;
  if (page === safeCurrentPage.value) return;
  if (props.loading) return;

  emit("page", page);
};
</script>

<template>
  <div
    class="rounded-3xl border border-border bg-card px-4 py-4 text-card-foreground shadow-sm"
  >
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex items-center gap-3">
        <AppBadge variant="default" shape="square" size="md">
          <Rows3 class="h-5 w-5" />
        </AppBadge>

        <div>
          <p class="text-sm font-bold text-card-foreground">
            Showing {{ fromItem }} to {{ toItem }} of {{ safeTotal }} {{ label }}
          </p>

          <p class="mt-0.5 text-xs font-medium text-muted-foreground">
            Page {{ safeCurrentPage }} of {{ safeLastPage }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-card-foreground disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canGoPrevious"
          aria-label="Previous page"
          @click="handlePrevious"
        >
          <ChevronLeft class="h-4 w-4" />
        </button>

        <template
          v-for="(pageNumber, index) in visiblePages"
          :key="`${pageNumber}-${index}`"
        >
          <button
            v-if="pageNumber !== '...'"
            type="button"
            class="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50"
            :class="
              pageNumber === safeCurrentPage
                ? 'border-foreground bg-foreground text-background shadow-sm'
                : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-card-foreground'
            "
            :disabled="loading"
            @click="handlePage(pageNumber)"
          >
            {{ pageNumber }}
          </button>

          <span
            v-else
            class="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground"
          >
            <MoreHorizontal class="h-4 w-4" />
          </span>
        </template>

        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-card-foreground disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canGoNext"
          aria-label="Next page"
          @click="handleNext"
        >
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>

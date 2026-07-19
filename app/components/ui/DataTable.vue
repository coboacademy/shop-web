<script setup lang="ts">
export interface DataTableColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  width?: string;
}

const props = withDefaults(
  defineProps<{
    columns?: DataTableColumn[];
    rows?: Record<string, any>[];
    loading?: boolean;
    emptyTitle?: string;
    emptyMessage?: string;
    stickyHeader?: boolean;
    hoverable?: boolean;
    clickable?: boolean;
  }>(),
  {
    columns: () => [],
    rows: () => [],
    loading: false,
    emptyTitle: "No data found",
    emptyMessage: "There are no records to display.",
    stickyHeader: false,
    hoverable: true,
    clickable: false,
  }
);

const emit = defineEmits<{
  (e: "rowDragstart", index: number): void;
  (e: "rowDragover", event: DragEvent): void;
  (e: "rowDrop", index: number): void;
  (e: "rowClick", row: Record<string, any>): void;
}>();

const slots = useSlots();

const safeColumns = computed(() => {
  return Array.isArray(props.columns) ? props.columns : [];
});

const safeRows = computed(() => {
  return Array.isArray(props.rows) ? props.rows : [];
});

const hasRows = computed(() => {
  return safeRows.value.length > 0;
});

const alignmentClass = (align?: string) => {
  const alignments: Record<string, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return alignments[align || "left"];
};

const skeletonWidthClass = (align?: string) => {
  if (align === "right") return "ml-auto w-20";
  if (align === "center") return "mx-auto w-24";

  return "w-32";
};

const isDraggable = computed(() => Boolean(slots["cell-drag"]));

const skeletonRows = computed(() => {
  return Array.from({ length: 6 });
});

const handleRowClick = (row: Record<string, any>, event: MouseEvent) => {
  if (!props.clickable) return;

  const target = event.target as HTMLElement | null;

  if (
    target?.closest("button") ||
    target?.closest("a") ||
    target?.closest("input") ||
    target?.closest("select") ||
    target?.closest("textarea") ||
    target?.closest('[data-ignore-row-click="true"]')
  ) {
    return;
  }

  emit("rowClick", row);
};
</script>

<template>
  <div
    class="local-motion-fade-up overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm"
  >
    <!-- Loading shine bar -->
    <div v-if="loading" class="h-1 w-full overflow-hidden bg-muted">
      <div
        class="h-full w-1/3 animate-table-loading bg-blue-600/80 dark:bg-blue-400/80"
      />
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full">
        <thead
          :class="[
            'border-b border-border bg-muted/70 backdrop-blur',
            stickyHeader ? 'sticky top-0 z-10' : '',
          ]"
        >
          <tr>
            <th
              v-for="column in safeColumns"
              :key="column.key"
              :class="[
                'whitespace-nowrap px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground',
                alignmentClass(column.align),
              ]"
              :style="{ width: column.width }"
            >
              <slot :name="`head-${column.key}`" :column="column">
                {{ column.label }}
              </slot>
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- Loading rows -->
          <template v-if="loading">
            <tr
              v-for="(_, rowIndex) in skeletonRows"
              :key="`loading-${rowIndex}`"
              class="local-motion-row border-b border-border last:border-b-0"
              :style="{ animationDelay: `${rowIndex * 35}ms` }"
            >
              <td
                v-for="column in safeColumns"
                :key="`loading-${rowIndex}-${column.key}`"
                class="px-6 py-4"
              >
                <div
                  :class="[
                    'h-4 animate-pulse rounded-full bg-muted',
                    skeletonWidthClass(column.align),
                  ]"
                />
              </td>
            </tr>
          </template>

          <!-- Empty state -->
          <tr v-else-if="!hasRows">
            <td :colspan="Math.max(safeColumns.length, 1)" class="px-6 py-12">
              <EmptyState :title="emptyTitle" :message="emptyMessage" />
            </td>
          </tr>

          <!-- Data rows -->
          <tr
            v-for="(row, rowIndex) in safeRows"
            v-else
            :key="row?.id || rowIndex"
            :style="{ animationDelay: `${rowIndex * 25}ms` }"
            :draggable="isDraggable"
            :class="[
              'local-motion-row group border-b border-border local-transition-smooth last:border-b-0',
              hoverable ? 'hover:bg-muted/70' : '',
              clickable ? 'cursor-pointer' : '',
              isDraggable ? 'cursor-grab active:cursor-grabbing' : '',
            ]"
            @click="handleRowClick(row, $event)"
            @dragstart="emit('rowDragstart', rowIndex)"
            @dragover.prevent="emit('rowDragover', $event)"
            @drop="emit('rowDrop', rowIndex)"
          >
            <td
              v-for="column in safeColumns"
              :key="column.key"
              :class="[
                'whitespace-nowrap px-6 py-4 text-sm text-muted-foreground',
                alignmentClass(column.align),
              ]"
            >
              <slot
                :name="`cell-${column.key}`"
                :row="row"
                :value="row?.[column.key]"
                :index="rowIndex"
              >
                <span
                  v-if="
                    row?.[column.key] !== null &&
                    row?.[column.key] !== undefined &&
                    row?.[column.key] !== ''
                  "
                  class="font-semibold text-card-foreground"
                >
                  {{ row[column.key] }}
                </span>

                <span v-else class="text-muted-foreground/60"> — </span>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="border-t border-border bg-muted/60 px-6 py-4">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
@keyframes table-loading {
  0% {
    transform: translateX(-120%);
  }

  100% {
    transform: translateX(320%);
  }
}

.animate-table-loading {
  animation: table-loading 1.1s ease-in-out infinite;
}

.local-transition-smooth {
  transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
    background-color 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
    color 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.local-motion-fade-up {
  animation: local-motion-fade-up 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@keyframes local-motion-fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.local-motion-row {
  animation: local-motion-row-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@keyframes local-motion-row-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
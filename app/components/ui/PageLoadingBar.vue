<script setup lang="ts">
const loadingStore = useLoadingStore();
</script>

<template>
  <Teleport to="body">
    <Transition name="loading-bar">
      <div
        v-if="loadingStore.routeLoading"
        class="fixed left-0 top-0 z-[99999] h-1 w-full bg-transparent"
      >
        <div
          class="h-full rounded-r-full bg-blue-600 shadow-lg shadow-blue-500/40 transition-all duration-200 dark:bg-blue-400 dark:shadow-blue-400/30"
          :style="{ width: `${loadingStore.progress}%` }"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.loading-bar-enter-active,
.loading-bar-leave-active {
  transition: opacity 0.2s ease;
}

.loading-bar-enter-from,
.loading-bar-leave-to {
  opacity: 0;
}
</style>

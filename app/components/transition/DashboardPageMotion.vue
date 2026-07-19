<script setup lang="ts">
const route = useRoute();
</script>

<template>
  <Transition name="dashboard-page" mode="out-in" appear>
    <div :key="route.path" class="dashboard-page-motion">
      <slot />
    </div>
  </Transition>
</template>

<style scoped>
.dashboard-page-motion {
  min-height: 100%;
}

.dashboard-page-enter-active {
  transition: opacity 220ms ease, transform 220ms ease, filter 220ms ease;
}

.dashboard-page-leave-active {
  transition: opacity 140ms ease, transform 140ms ease, filter 140ms ease;
}

.dashboard-page-enter-from {
  opacity: 0;
  transform: translateY(14px) scale(0.992);
  filter: blur(5px);
}

.dashboard-page-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.995);
  filter: blur(3px);
}
</style>

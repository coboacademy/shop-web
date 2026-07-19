<script setup lang="ts">
withDefaults(
  defineProps<{
    delay?: number;
  }>(),
  {
    delay: 0,
  }
);
</script>

<template>
  <div class="motion-card" :style="{ animationDelay: `${delay}ms` }">
    <slot />
  </div>
</template>

<style scoped>
.motion-card {
  animation: motion-card-in 260ms ease both;
}

@keyframes motion-card-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.985);
    filter: blur(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}
</style>

<script setup lang="ts">
const route = useRoute();
const productId = computed(() => String(route.params.id ?? ""));

definePageMeta({
  layout: 'public',
})

useHead({
  title: computed(() => `Product ${productId.value}`),
})
</script>

<template>
  <div class="p-6">Product detail placeholder for ID: {{ productId }}</div>
</template>

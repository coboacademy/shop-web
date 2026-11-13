<script setup lang="ts">
definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Notifications",
});
</script>

<template>
  <NotificationInbox audience="vendor" />
</template>

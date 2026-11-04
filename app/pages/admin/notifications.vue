<script setup lang="ts">
definePageMeta({
  layout: "admin",
  middleware: ["auth", "permission"],
  permission: "dashboard.view",
  title: "Notifications",
});
</script>

<template>
  <NotificationInbox audience="admin" />
</template>

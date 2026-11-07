<script setup lang="ts">
definePageMeta({
  layout: "user",
  middleware: ["auth", "permission"],
  permission: "account.view",
  title: "Notifications",
});
</script>

<template>
  <NotificationInbox audience="customer" />
</template>

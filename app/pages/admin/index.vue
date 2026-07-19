<script setup lang="ts">
definePageMeta({
  middleware: ["auth", "permission"],
  permission: "dashboard.view",
});

await navigateTo("/admin/dashboard");
</script>

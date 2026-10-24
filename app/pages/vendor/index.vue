<script setup lang="ts">
definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Vendor Dashboard",
});

await navigateTo("/vendor/dashboard");
</script>

<script setup lang="ts">
import type { CountryItem, CountryPayload } from "~/composables/useCountry";
import { Languages, MapPin, Pencil, Plus, RefreshCcw, Trash2 } from "lucide-vue-next";
import { useCountryManagementStore } from "~/stores/inventory/countryStore";

definePageMeta({
  layout: "dashboard",
  middleware: ["auth", "permission"],
  permission: "country.view",
  title: "Countries",
});

const { createCountry, updateCountry, deleteCountry } = useCountry();

const countryStore = useCountryManagementStore();
const authStore = useAuthStore();
const toast = useToast();
const notificationStore = useNotificationStore();

const search = ref("");
const page = ref(1);
const perPage = ref(10);

const saving = ref(false);
const deleting = ref(false);
const pageErrorMessage = ref("");

const modalOpen = ref(false);
const selectedCountry = ref<CountryItem | null>(null);

const confirmOpen = ref(false);
const confirmCountry = ref<CountryItem | null>(null);

const form = reactive<CountryPayload>({
  country_code: "",
  country_name: "",
  capital: "",
  currency: "",
  language: "",
});

const formErrors = reactive<Record<string, string>>({
  country_code: "",
  country_name: "",
  capital: "",
  currency: "",
  language: "",
});

const countryRows = computed(() => {
  return Array.isArray(countryStore.countries) ? countryStore.countries : [];
});

const countryCount = computed(() => countryRows.value.length);

const currentPage = computed(() => countryStore.currentPage ?? 1);
const lastPage = computed(() => countryStore.lastPage ?? 1);
const totalItems = computed(() => countryStore.totalItems ?? 0);
const totalCountries = computed(() => countryStore.totalCountries ?? 0);

const loading = computed(() => countryStore.loading);
const refreshing = computed(() => countryStore.refreshing);
const errorMessage = computed(() => countryStore.errorMessage || pageErrorMessage.value);

const canCreateCountry = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("country.create")
    : false;
});

const canUpdateCountry = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("country.update")
    : false;
});

const canDeleteCountry = computed(() => {
  return typeof authStore.hasPermission === "function"
    ? authStore.hasPermission("country.delete")
    : false;
});

const columns = [
  { key: "country", label: "Country" },
  { key: "country_code", label: "Code" },
  { key: "capital", label: "Capital" },
  { key: "currency", label: "Currency" },
  { key: "language", label: "Language" },
  { key: "created_at", label: "Created" },
  { key: "actions", label: "Actions", align: "right" as const },
];

const fetchCountries = async (
  options: {
    force?: boolean;
    silent?: boolean;
  } = {}
) => {
  pageErrorMessage.value = "";

  await countryStore.fetchCountries(
    {
      search: search.value || undefined,
      page: page.value,
      per_page: perPage.value,
    },
    options
  );

  if (countryStore.errorMessage) {
    toast.error("Failed to load countries", countryStore.errorMessage);
  }
};

const handleRefresh = async () => {
  await fetchCountries({
    force: true,
    silent: true,
  });
};

const resetFormErrors = () => {
  formErrors.country_code = "";
  formErrors.country_name = "";
  formErrors.capital = "";
  formErrors.currency = "";
  formErrors.language = "";
};

const resetForm = () => {
  form.country_code = "";
  form.country_name = "";
  form.capital = "";
  form.currency = "";
  form.language = "";
  resetFormErrors();
};

const openCreate = () => {
  selectedCountry.value = null;
  resetForm();
  modalOpen.value = true;
};

const openEdit = (country: CountryItem) => {
  selectedCountry.value = country;

  form.country_code = country.country_code;
  form.country_name = country.country_name;
  form.capital = country.capital;
  form.currency = country.currency;
  form.language = country.language;

  resetFormErrors();
  modalOpen.value = true;
};

const closeModal = () => {
  if (saving.value) return;

  modalOpen.value = false;
  selectedCountry.value = null;
  resetForm();
};

const saveCountry = async () => {
  saving.value = true;
  pageErrorMessage.value = "";
  resetFormErrors();

  try {
    const payload: CountryPayload = {
      country_code: form.country_code.trim().toUpperCase(),
      country_name: form.country_name.trim(),
      capital: form.capital.trim(),
      currency: form.currency.trim(),
      language: form.language.trim(),
    };

    if (selectedCountry.value) {
      await updateCountry(selectedCountry.value.id, payload);

      toast.success("Country updated", "Country information was updated successfully.");
    } else {
      await createCountry(payload);

      toast.success("Country created", "New country was created successfully.");
    }

    closeModal();

    await countryStore.invalidateAndRefresh();
    await notificationStore.refreshNotifications();
  } catch (error: any) {
    pageErrorMessage.value =
      error.response?.data?.message || error.message || "Failed to save country";

    toast.error("Save failed", pageErrorMessage.value);

    const errors = error.response?.data?.errors || error.errors;

    if (errors) {
      formErrors.country_code = errors.country_code?.[0] || errors.CountryCode?.[0] || "";
      formErrors.country_name = errors.country_name?.[0] || errors.CountryName?.[0] || "";
      formErrors.capital = errors.capital?.[0] || errors.Capital?.[0] || "";
      formErrors.currency = errors.currency?.[0] || errors.Currency?.[0] || "";
      formErrors.language = errors.language?.[0] || errors.Language?.[0] || "";
    }
  } finally {
    saving.value = false;
  }
};

const openDelete = (country: CountryItem) => {
  confirmCountry.value = country;
  confirmOpen.value = true;
};

const closeDelete = () => {
  if (deleting.value) return;

  confirmOpen.value = false;
  confirmCountry.value = null;
};

const confirmDelete = async () => {
  if (!confirmCountry.value) return;

  deleting.value = true;
  pageErrorMessage.value = "";

  try {
    await deleteCountry(confirmCountry.value.id);

    toast.success(
      "Country deleted",
      `${confirmCountry.value.country_name} was deleted successfully.`
    );

    closeDelete();

    await countryStore.invalidateAndRefresh();
    await notificationStore.refreshNotifications();
  } catch (error: any) {
    pageErrorMessage.value =
      error.response?.data?.message || error.message || "Failed to delete country";

    toast.error("Delete failed", pageErrorMessage.value);
  } finally {
    deleting.value = false;
  }
};

const handleCountryAction = (country: CountryItem, action: string) => {
  if (action === "edit") {
    openEdit(country);
    return;
  }

  if (action === "delete") {
    openDelete(country);
  }
};

const resetFilters = async () => {
  search.value = "";
  page.value = 1;

  await fetchCountries();
};

const goPrevious = async () => {
  if (page.value <= 1) return;

  page.value--;
  await fetchCountries();
};

const goNext = async () => {
  if (page.value >= lastPage.value) return;

  page.value++;
  await fetchCountries();
};

const goToPage = async (targetPage: number) => {
  if (targetPage < 1) return;
  if (targetPage > lastPage.value) return;

  page.value = targetPage;
  await fetchCountries();
};

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(search, () => {
  page.value = 1;

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(async () => {
    await fetchCountries();
  }, 400);
});

onMounted(async () => {
  await fetchCountries({
    silent: countryStore.hasData,
  });
});

onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Countries Management"
      subtitle="Manage country code, name, capital, currency, and language records."
    >
      <template #actions>
        <AppButton variant="secondary" :loading="refreshing" @click="handleRefresh">
          <RefreshCcw class="h-4 w-4" />
          Refresh
        </AppButton>

        <AppButton v-if="canCreateCountry" @click="openCreate">
          <Plus class="h-4 w-4" />
          Add Country
        </AppButton>
      </template>
    </PageHeader>

    <AlertMessage
      v-if="errorMessage"
      type="error"
      title="Unable to load countries"
      :message="errorMessage"
    />

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Total Countries"
        :value="totalCountries"
        subtitle="All country records"
        tone="info"
      >
        <template #badge>
          <AppBadge variant="info" shape="square" size="md">
            <MenuIcon
              name="countries"
              label="Countries"
              route="/countries"
              group="Inventory"
            />
          </AppBadge>
        </template>
      </StatsCard>
    </div>

    <FilterBar
      title="Filters"
      subtitle="Search countries by code, name, capital, currency, or language."
    >
      <AppInput
        v-model="search"
        label="Search"
        placeholder="Search Cambodia, KHM, Phnom Penh..."
      />

      <template #actions>
        <AppButton variant="secondary" @click="resetFilters"> Reset </AppButton>
      </template>
    </FilterBar>

    <DataTable
      :columns="columns"
      :rows="countryRows"
      :loading="loading && countryCount === 0"
      empty-title="No countries found"
      empty-message="Create your first country record."
    >
      <template #cell-country="{ row }">
        <div class="flex items-center gap-3">
          <AppBadge variant="info" shape="square" size="md">
            <MenuIcon
              :name="'countries'"
              :label="row.country_name"
              :route="'/countries'"
              group="Inventory"
            />
          </AppBadge>

          <div class="min-w-0">
            <p class="truncate text-sm font-bold text-card-foreground">
              {{ row.country_name }}
            </p>

            <p class="mt-1 text-xs text-muted-foreground">
              {{ row.country_code }}
            </p>
          </div>
        </div>
      </template>

      <template #cell-country_code="{ row }">
        <code
          class="rounded-lg border border-border bg-muted px-2 py-1 text-xs font-semibold text-card-foreground"
        >
          {{ row.country_code }}
        </code>
      </template>

      <template #cell-capital="{ row }">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin class="h-4 w-4" />
          {{ row.capital || "-" }}
        </div>
      </template>

      <template #cell-currency="{ row }">
        <AppBadge variant="success">
          {{ row.currency || "-" }}
        </AppBadge>
      </template>

      <template #cell-language="{ row }">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <Languages class="h-4 w-4" />
          {{ row.language || "-" }}
        </div>
      </template>

      <template #cell-created_at="{ row }">
        <span class="text-sm text-muted-foreground">
          {{ row.created_at || "—" }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <AppDropdown
          width="w-64"
          :items="[
            {
              label: 'Edit Country',
              value: 'edit',
              icon: Pencil,
              visible: canUpdateCountry,
              description: 'Update country information',
            },
            {
              label: 'Delete Country',
              value: 'delete',
              icon: Trash2,
              variant: 'danger',
              visible: canDeleteCountry,
              description: 'Remove this country',
            },
          ]"
          @select="handleCountryAction(row, $event)"
        />
      </template>
    </DataTable>

    <TablePagination
      :current-page="currentPage"
      :last-page="lastPage"
      :total="totalItems"
      :per-page="perPage"
      :loading="loading && countryCount === 0"
      @previous="goPrevious"
      @next="goNext"
      @page="goToPage"
      label="countries"
    />

    <AppModal
      :open="modalOpen"
      :title="selectedCountry ? 'Edit Country' : 'Create Country'"
      :subtitle="
        selectedCountry ? 'Update country information.' : 'Create a new country record.'
      "
      size="md"
      @close="closeModal"
    >
      <template #icon>
        <MenuIcon
          name="countries"
          label="Countries"
          route="/countries"
          group="Inventory"
        />
      </template>

      <form class="space-y-5" @submit.prevent="saveCountry">
        <div class="grid gap-5 md:grid-cols-2">
          <AppInput
            v-model="form.country_code"
            label="Country Code"
            placeholder="KHM"
            :error="formErrors.country_code"
          />

          <AppInput
            v-model="form.country_name"
            label="Country Name"
            placeholder="Cambodia"
            :error="formErrors.country_name"
          />

          <AppInput
            v-model="form.capital"
            label="Capital"
            placeholder="Phnom Penh"
            :error="formErrors.capital"
          />

          <AppInput
            v-model="form.currency"
            label="Currency"
            placeholder="KHR"
            :error="formErrors.currency"
          />

          <AppInput
            v-model="form.language"
            label="Language"
            placeholder="Khmer"
            :error="formErrors.language"
          />
        </div>

        <AlertMessage type="info" title="Recommended format">
          Use ISO-like country code, for example <strong>KHM</strong>, country name
          <strong>Cambodia</strong>, currency <strong>KHR</strong>, and language
          <strong>Khmer</strong>.
        </AlertMessage>

        <div class="flex justify-end gap-3 border-t border-border pt-5">
          <AppButton
            type="button"
            variant="secondary"
            :disabled="saving"
            @click="closeModal"
          >
            Cancel
          </AppButton>

          <AppButton type="submit" variant="primary" :loading="saving">
            {{ selectedCountry ? "Update Country" : "Create Country" }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <ConfirmDialog
      :open="confirmOpen"
      title="Delete Country"
      :message="`Are you sure you want to delete ${
        confirmCountry?.country_name || 'this country'
      }? This action cannot be undone.`"
      confirm-label="Delete Country"
      variant="danger"
      :loading="deleting"
      @close="closeDelete"
      @confirm="confirmDelete"
    />

    <AppRefreshingIndicator :show="refreshing" />
  </div>
</template>

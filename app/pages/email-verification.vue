<script setup lang="ts">
definePageMeta({
  layout: "auth",
  middleware: "auth",
  title: "Email Verification",
});

const { verifyEmailOtp, resendEmailOtp } = useEmailOtp();
const authStore = useAuthStore();
const toast = useToast();
const resendCooldown = useCooldown(60);

const loading = ref(false);
const resending = ref(false);
const message = ref("");
const errorMessage = ref("");

const form = reactive({
  otp: "",
});

const errors = reactive<Record<string, string>>({
  otp: "",
});

watch(
  () => form.otp,
  (value) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 6);

    if (cleaned !== value) {
      form.otp = cleaned;
    }
  }
);

const resetMessages = () => {
  message.value = "";
  errorMessage.value = "";
  errors.otp = "";
};

const handleVerify = async () => {
  loading.value = true;
  resetMessages();

  try {
    const response = await verifyEmailOtp(form.otp);

    message.value = response.message;
    toast.success("Email verified", response.message);

    await authStore.fetchUser();

    await navigateTo(authStore.redirectPath());
  } catch (error: any) {
    errorMessage.value = error.message || "Failed to verify OTP";
    toast.error("Verification failed", errorMessage.value);

    if (error.errors) {
      errors.otp = error.errors.otp?.[0] || "";
    }
  } finally {
    loading.value = false;
  }
};

const handleResend = async () => {
  if (resendCooldown.isCoolingDown.value) return;

  resending.value = true;
  resetMessages();
  form.otp = "";

  try {
    const response = await resendEmailOtp();

    message.value = response.message;
    toast.success("OTP sent", response.message);

    resendCooldown.start();
  } catch (error: any) {
    errorMessage.value = error.message || "Failed to resend OTP";
    toast.error("Resend failed", errorMessage.value);
  } finally {
    resending.value = false;
  }
};
</script>

<template>
  <AuthCard
    title="Verify your email"
    subtitle="Enter the 6-digit OTP code sent to your email address."
  >
    <AlertMessage v-if="message" class="mb-5" type="success" :message="message" />

    <AlertMessage v-if="errorMessage" class="mb-5" type="error" :message="errorMessage" />

    <form class="space-y-5" @submit.prevent="handleVerify">
      <AlertMessage class="mb-6" type="info" title="Verification code sent">
        Enter the code sent to
        <strong>{{ authStore.user?.email }}</strong
        >.
      </AlertMessage>

      <AuthInput
        v-model="form.otp"
        label="OTP Code"
        type="text"
        placeholder="Enter 6-digit OTP"
        :error="errors.otp"
        required
      />

      <AuthButton label="Verify Email" :loading="loading" variant="primary" />

      <AppButton
        type="button"
        variant="secondary"
        :disabled="resending || resendCooldown.isCoolingDown.value"
        class="w-full"
        @click="handleResend"
      >
        <RefreshCcw class="mr-2 h-5 w-5" :class="resending ? 'animate-spin' : ''" />

        {{
          resendCooldown.isCoolingDown.value
            ? `Resend OTP in ${resendCooldown.secondsLeft.value}s`
            : resending
            ? "Sending OTP..."
            : "Resend OTP"
        }}
      </AppButton>
    </form>

    <div class="mt-6 text-center text-sm text-slate-600">
      Already verified?
      <button
        class="font-semibold text-blue-600 hover:text-blue-700"
        @click="
            authStore
            .fetchUser()
            .then(() =>
              authStore.user?.is_email_verified ? navigateTo(authStore.redirectPath()) : null
            )
        "
      >
        Continue
      </button>
    </div>
  </AuthCard>
</template>

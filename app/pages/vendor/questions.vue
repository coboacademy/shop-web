<script setup lang="ts">
import {
  Check,
  CircleHelp,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
} from "lucide-vue-next";
import {
  useVendorQuestions,
  type VendorProductQuestion,
  type VendorQuestionApiError,
  type VendorQuestionPagination,
} from "~/composables/useVendorQuestions";

definePageMeta({
  layout: "vendor",
  middleware: ["auth", "permission"],
  permission: "vendor.view",
  title: "Product Q&A",
});

const { getQuestions, answerQuestion } = useVendorQuestions();
const toast = useToast();

const questions = ref<VendorProductQuestion[]>([]);
const pagination = ref<VendorQuestionPagination | null>(null);
const search = ref("");
const answerFilter = ref<"all" | "unanswered" | "answered">("all");
const loadingQuestions = ref(true);
const savingQuestionId = ref<number | null>(null);
const questionError = ref("");
const answerErrors = ref<Record<number, string>>({});
const answers = reactive<Record<number, string>>({});

const filteredQuestions = computed(() => {
  const query = search.value.trim().toLowerCase();

  return questions.value.filter((question) => {
    const isAnswered = Boolean(question.answer);
    const matchesAnswer =
      answerFilter.value === "all" ||
      (answerFilter.value === "answered" && isAnswered) ||
      (answerFilter.value === "unanswered" && !isAnswered);
    const matchesSearch =
      !query ||
      question.question.toLowerCase().includes(query) ||
      question.customer.name.toLowerCase().includes(query) ||
      question.product_id.toLowerCase().includes(query);

    return matchesAnswer && matchesSearch;
  });
});

const questionCounts = computed(() => ({
  total: questions.value.length,
  answered: questions.value.filter((question) => Boolean(question.answer)).length,
  unanswered: questions.value.filter((question) => !question.answer).length,
}));

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return fallback;
};

const isVendorQuestionApiError = (
  error: unknown,
): error is VendorQuestionApiError =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof error.message === "string" &&
  "errors" in error &&
  typeof error.errors === "object" &&
  error.errors !== null;

const formatDate = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const loadQuestions = async (requestedPage = 1) => {
  loadingQuestions.value = true;
  questionError.value = "";

  try {
    const response = await getQuestions(requestedPage);
    const result = response.data.questions;
    questions.value = result.data;
    pagination.value = result.meta;

    for (const question of result.data) {
      answers[question.id] = question.answer || "";
      delete answerErrors.value[question.id];
    }
  } catch (error: unknown) {
    questionError.value = getErrorMessage(
      error,
      "Could not load vendor questions.",
    );
  } finally {
    loadingQuestions.value = false;
  }
};

const submitAnswer = async (question: VendorProductQuestion) => {
  const answer = (answers[question.id] || "").trim();
  answerErrors.value[question.id] = "";

  if (!answer) {
    answerErrors.value[question.id] = "Enter an answer before submitting.";
    return;
  }
  if (answer.length > 2000) {
    answerErrors.value[question.id] = "Answers must be 2,000 characters or fewer.";
    return;
  }

  savingQuestionId.value = question.id;
  try {
    const response = await answerQuestion(question.id, answer);
    const index = questions.value.findIndex((item) => item.id === question.id);
    if (index >= 0) questions.value[index] = response.data.question;
    answers[question.id] = response.data.question.answer || "";
    toast.success("Answer saved", response.message);
  } catch (error: unknown) {
    const message = isVendorQuestionApiError(error)
      ? error.errors.answer?.[0] || error.message
      : getErrorMessage(error, "Could not save your answer.");
    answerErrors.value[question.id] = message;
    toast.error("Answer failed", message);
  } finally {
    savingQuestionId.value = null;
  }
};

const changePage = async (nextPage: number) => {
  const lastPage = pagination.value?.last_page || 1;
  if (nextPage < 1 || nextPage > lastPage || loadingQuestions.value) return;
  await loadQuestions(nextPage);
};

onMounted(() => loadQuestions());
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Product Q&A"
      subtitle="Respond to customer questions about products in your stores."
    >
      <template #actions>
        <AppButton
          variant="secondary"
          :loading="loadingQuestions"
          :disabled="loadingQuestions"
          @click="loadQuestions(pagination?.current_page || 1)"
        >
          <RefreshCw class="h-4 w-4" />
          Refresh
        </AppButton>
      </template>
    </PageHeader>

    <section class="grid gap-4 sm:grid-cols-3" aria-label="Questions on this page">
      <StatsCard
        title="Questions loaded"
        :value="questionCounts.total"
        :subtitle="`${pagination?.total || 0} total questions`"
        tone="info"
      >
        <template #badge>
          <AppBadge variant="info" shape="square" size="md"><CircleHelp class="h-5 w-5" /></AppBadge>
        </template>
      </StatsCard>
      <StatsCard title="Unanswered" :value="questionCounts.unanswered" subtitle="On this page" tone="warning">
        <template #badge>
          <AppBadge variant="warning" shape="square" size="md"><MessageCircle class="h-5 w-5" /></AppBadge>
        </template>
      </StatsCard>
      <StatsCard title="Answered" :value="questionCounts.answered" subtitle="On this page" tone="success">
        <template #badge>
          <AppBadge variant="success" shape="square" size="md"><Check class="h-5 w-5" /></AppBadge>
        </template>
      </StatsCard>
    </section>

    <FilterBar
      title="Vendor questions"
      subtitle="Search and filter the questions returned for your vendor account."
      columns="2"
    >
      <AppInput v-model="search" label="Search" placeholder="Search question, customer, or product ID">
        <template #icon><Search class="h-5 w-5" /></template>
      </AppInput>
      <div>
        <label for="vendor-question-status" class="mb-2 block text-sm font-medium text-card-foreground">Answer status</label>
        <select
          id="vendor-question-status"
          v-model="answerFilter"
          class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-card-foreground focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 dark:focus:ring-sky-950"
        >
          <option value="all">All questions</option>
          <option value="unanswered">Unanswered</option>
          <option value="answered">Answered</option>
        </select>
      </div>
    </FilterBar>

    <AlertMessage v-if="questionError" type="error" :message="questionError">
      <AppButton
        variant="secondary"
        size="sm"
        :disabled="loadingQuestions"
        @click="loadQuestions(pagination?.current_page || 1)"
      >
        Retry
      </AppButton>
    </AlertMessage>

    <div v-if="loadingQuestions" class="space-y-4">
      <div v-for="index in 3" :key="index" class="h-48 animate-pulse rounded-3xl bg-muted" />
    </div>
    <EmptyState
      v-else-if="!questionError && !questions.length"
      title="No questions yet"
      message="Customer questions about your products will appear here."
    />
    <div
      v-else-if="!questionError && !filteredQuestions.length"
      class="rounded-3xl border border-border bg-card px-6 py-12 text-center"
    >
      <MessageCircle class="mx-auto h-8 w-8 text-muted-foreground" />
      <h2 class="mt-3 font-semibold text-card-foreground">No matching questions</h2>
      <p class="mt-1 text-sm text-muted-foreground">Try a different search or answer-status filter.</p>
    </div>
    <section v-else-if="!questionError" class="space-y-4" aria-label="Vendor questions">
      <article
        v-for="question in filteredQuestions"
        :key="question.id"
        class="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-semibold text-card-foreground">{{ question.customer.name }}</span>
              <AppBadge :variant="question.answer ? 'success' : 'warning'">
                {{ question.answer ? "Answered" : "Needs answer" }}
              </AppBadge>
            </div>
            <p class="mt-1 text-xs text-muted-foreground">
              Asked {{ formatDate(question.created_at) }}
              <span class="ml-2">Product {{ question.product_id }}</span>
            </p>
          </div>
          <span class="text-xs text-muted-foreground">Question #{{ question.id }}</span>
        </div>

        <div class="mt-4 rounded-2xl bg-muted/40 p-4">
          <p class="whitespace-pre-wrap text-sm leading-6 text-card-foreground">{{ question.question }}</p>
        </div>

        <form class="mt-4 space-y-3" @submit.prevent="submitAnswer(question)">
          <AppTextarea
            v-model="answers[question.id]"
            :label="question.answer ? 'Your answer (editable)' : 'Your answer'"
            :placeholder="question.answer ? 'Update your answer' : 'Write a helpful response'"
            :maxlength="2000"
            :error="answerErrors[question.id]"
            :rows="4"
            required
          />
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-xs text-muted-foreground">
              {{ (answers[question.id] || "").length }} / 2,000 characters
              <span v-if="question.answered_by">
                · Answered by {{ question.answered_by.name }}
                <span v-if="question.answered_at"> on {{ formatDate(question.answered_at) }}</span>
              </span>
            </p>
            <AppButton
              type="submit"
              variant="primary"
              :loading="savingQuestionId === question.id"
              :disabled="savingQuestionId !== null"
            >
              <Send class="h-4 w-4" />
              {{ question.answer ? "Update answer" : "Submit answer" }}
            </AppButton>
          </div>
        </form>
      </article>
    </section>

    <div
      v-if="!loadingQuestions && !questionError && pagination && pagination.last_page > 1"
      class="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
    >
      <AppButton
        variant="secondary"
        size="sm"
        :disabled="pagination.current_page <= 1"
        @click="changePage(pagination.current_page - 1)"
      >
        Previous
      </AppButton>
      <span class="text-sm text-muted-foreground">
        <template v-if="pagination.from !== null && pagination.to !== null">
          {{ pagination.from }}–{{ pagination.to }} of {{ pagination.total }}
        </template>
        · Page {{ pagination.current_page }} of {{ pagination.last_page }}
      </span>
      <AppButton
        variant="secondary"
        size="sm"
        :disabled="pagination.current_page >= pagination.last_page"
        @click="changePage(pagination.current_page + 1)"
      >
        Next
      </AppButton>
    </div>
  </div>
</template>

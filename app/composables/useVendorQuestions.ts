import { isAxiosError } from "axios";

export interface VendorProductQuestion {
  id: number;
  product_id: string;
  question: string;
  answer: string | null;
  customer: {
    id: number;
    name: string;
  };
  answered_by: {
    id: number;
    name: string;
  } | null;
  answered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorQuestionPagination {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface VendorQuestionListResponse {
  status: string;
  message: string;
  data: {
    questions: {
      data: VendorProductQuestion[];
      links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
      };
      meta: VendorQuestionPagination;
    };
  };
}

export interface AnswerProductQuestionResponse {
  status: string;
  message: string;
  data: {
    question: VendorProductQuestion;
  };
}

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export interface VendorQuestionApiError {
  message: string;
  errors: Record<string, string[]>;
  status: number;
}

export const useVendorQuestions = () => {
  const api = useApi();

  const normalizeError = (
    error: unknown,
    fallback: string,
  ): VendorQuestionApiError => {
    if (isAxiosError<ApiErrorResponse>(error)) {
      return {
        message: error.response?.data?.message || fallback,
        errors: error.response?.data?.errors || {},
        status: error.response?.status || 500,
      };
    }

    return {
      message: error instanceof Error ? error.message : fallback,
      errors: {},
      status: 500,
    };
  };

  const getQuestions = async (
    page = 1,
  ): Promise<VendorQuestionListResponse> => {
    try {
      const response = await api.get<VendorQuestionListResponse>(
        "/vendor/questions",
        { params: { page, per_page: 20 } },
      );
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to fetch vendor questions");
    }
  };

  const answerQuestion = async (
    questionId: number,
    answer: string,
  ): Promise<AnswerProductQuestionResponse> => {
    try {
      const response = await api.patch<AnswerProductQuestionResponse>(
        `/vendor/questions/${questionId}/answer`,
        { answer },
      );
      return response.data;
    } catch (error: unknown) {
      throw normalizeError(error, "Failed to submit your answer");
    }
  };

  return {
    getQuestions,
    answerQuestion,
  };
};

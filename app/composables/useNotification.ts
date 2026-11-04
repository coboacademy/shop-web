import axios from "axios";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  action_url?: string | null;
  data?: Record<string, any> | null;
  read: boolean;
  read_at: string | null;
  created_at: string | null;
  created_at_raw: string | null;
}

export interface NotificationPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface NotificationApiResponseBase {
  status: string;
  message: string;
}

export interface NotificationListResponse extends NotificationApiResponseBase {
  data: {
    notifications: NotificationItem[];
    pagination: NotificationPagination;
    unread_count: number;
  };
}

export interface NotificationReadResponse extends NotificationApiResponseBase {
  data: {
    notification: NotificationItem;
    unread_count: number;
  };
}

export interface NotificationCountResponse extends NotificationApiResponseBase {
  data: {
    unread_count: number;
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNotificationType = (value: unknown): value is NotificationType =>
  value === "info" || value === "success" || value === "warning" || value === "error";

const isNotificationItem = (value: unknown): value is NotificationItem => {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "number" &&
    Number.isInteger(value.id) &&
    typeof value.title === "string" &&
    typeof value.message === "string" &&
    isNotificationType(value.type) &&
    typeof value.read === "boolean" &&
    (typeof value.created_at === "string" || value.created_at === null) &&
    (value.action_url === undefined ||
      typeof value.action_url === "string" ||
      value.action_url === null) &&
    (value.data === undefined || isRecord(value.data) || value.data === null) &&
    (typeof value.read_at === "string" || value.read_at === null) &&
    (typeof value.created_at_raw === "string" || value.created_at_raw === null)
  );
};

const isPagination = (value: unknown): value is NotificationPagination => {
  if (!isRecord(value)) return false;

  return (
    typeof value.current_page === "number" &&
    typeof value.last_page === "number" &&
    typeof value.per_page === "number" &&
    typeof value.total === "number"
  );
};

const isListResponse = (value: unknown): value is NotificationListResponse => {
  if (
    !isRecord(value) ||
    value.status !== "success" ||
    typeof value.message !== "string" ||
    !isRecord(value.data) ||
    !Array.isArray(value.data.notifications) ||
    !value.data.notifications.every(isNotificationItem) ||
    !isPagination(value.data.pagination) ||
    typeof value.data.unread_count !== "number"
  ) {
    return false;
  }

  return true;
};

const isReadResponse = (value: unknown): value is NotificationReadResponse => {
  if (
    !isRecord(value) ||
    value.status !== "success" ||
    typeof value.message !== "string" ||
    !isRecord(value.data) ||
    !isNotificationItem(value.data.notification) ||
    typeof value.data.unread_count !== "number"
  ) {
    return false;
  }

  return true;
};

const isCountResponse = (value: unknown): value is NotificationCountResponse => {
  if (
    !isRecord(value) ||
    value.status !== "success" ||
    typeof value.message !== "string" ||
    !isRecord(value.data) ||
    typeof value.data.unread_count !== "number"
  ) {
    return false;
  }

  return true;
};

const handleError = (error: unknown, fallback: string): never => {
  const axiosError = axios.isAxiosError(error) ? error : null;
  const responseData = isRecord(axiosError?.response?.data)
    ? axiosError.response.data
    : null;
  const errors = isRecord(responseData?.errors)
    ? responseData.errors
    : {};
  const apiError = Object.assign(
    new Error(
      typeof responseData?.message === "string" ? responseData.message : fallback,
    ),
    {
      errors,
      status: axiosError?.response?.status || 500,
    },
  );

  throw apiError;
};

const parseResponse = <T>(
  value: unknown,
  isResponse: (candidate: unknown) => candidate is T,
  message: string,
): T => {
  if (!isResponse(value)) throw new Error(message);
  return value;
};

export const useNotification = () => {
  const api = useApi();

  const getNotifications = async (params?: {
    page?: number;
    per_page?: number;
    read?: "read" | "unread";
  }): Promise<NotificationListResponse> => {
    const response = await api
      .get<unknown>("/notifications", { params })
      .catch((error: unknown) => handleError(error, "Failed to fetch notifications"));
    return parseResponse(
      response.data,
      isListResponse,
      "The notifications API returned an invalid list response.",
    );
  };

  const markNotificationAsRead = async (
    id: number,
  ): Promise<NotificationReadResponse> => {
    const response = await api
      .patch<unknown>(`/notifications/${id}/read`)
      .catch((error: unknown) =>
        handleError(error, "Failed to mark notification as read"),
      );
    return parseResponse(
      response.data,
      isReadResponse,
      "The notifications API returned an invalid read response.",
    );
  };

  const markAllNotificationsAsRead =
    async (): Promise<NotificationCountResponse> => {
      const response = await api
        .patch<unknown>("/notifications/read-all")
        .catch((error: unknown) =>
          handleError(error, "Failed to mark all notifications as read"),
        );
      return parseResponse(
        response.data,
        isCountResponse,
        "The notifications API returned an invalid unread-count response.",
      );
    };

  const clearNotifications = async (): Promise<NotificationCountResponse> => {
    const response = await api
      .delete<unknown>("/notifications/clear")
      .catch((error: unknown) => handleError(error, "Failed to clear notifications"));
    return parseResponse(
      response.data,
      isCountResponse,
      "The notifications API returned an invalid clear response.",
    );
  };

  return {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
  };
};

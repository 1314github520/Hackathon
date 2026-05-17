import { apiRequest } from "@/lib/api/client";
import type {
  AdminAircraftItem,
  Aircraft,
  AircraftDetail,
  AuditLog,
  DashboardSummary,
  EventItem,
  FavoriteItem,
  HistoryItem,
  LoginPayload,
  PersonItem,
  ReviewQueueItem,
  ReviewResult,
  SearchItem,
  SessionPayload,
  UploadMediaResult,
  ValidationResult,
} from "@/types/api";

export const api = {
  health: () => apiRequest<{ status: string }>("/health"),
  listAircraft: (params?: { keyword?: string; type?: string }) =>
    apiRequest<Aircraft[]>("/api/public/aircraft", { searchParams: params }),
  getAircraftDetail: (id: string) =>
    apiRequest<AircraftDetail>(`/api/public/aircraft/${encodeURIComponent(id)}`),
  compareAircraft: (ids: string[]) =>
    apiRequest<Aircraft[]>("/api/public/aircraft/compare", {
      method: "POST",
      body: { ids },
    }),
  listEvents: () => apiRequest<EventItem[]>("/api/public/events"),
  listPersons: () => apiRequest<PersonItem[]>("/api/public/persons"),
  search: (params: { q?: string; type?: string }) =>
    apiRequest<SearchItem[]>("/api/public/search", { searchParams: params }),
  getRecommendations: (entityType: string, entityId: string) =>
    apiRequest<Aircraft[]>("/api/public/recommendations", {
      searchParams: { entityType, entityId },
    }),
  register: (payload: LoginPayload) =>
    apiRequest<{ id: string; username: string }>("/api/user/auth/register", {
      method: "POST",
      body: payload,
    }),
  login: (payload: LoginPayload) =>
    apiRequest<SessionPayload>("/api/user/auth/login", {
      method: "POST",
      body: payload,
    }),
  refresh: (refreshToken: string) =>
    apiRequest<{ accessToken: string }>("/api/user/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    }),
  logout: (token: string) =>
    apiRequest<{ success: boolean }>("/api/user/auth/logout", {
      method: "POST",
      token,
    }),
  profile: (token: string) => apiRequest<SessionPayload["user"]>("/api/user/profile", { token }),
  favorites: (token: string) => apiRequest<FavoriteItem[]>("/api/user/favorites", { token }),
  addFavorite: (token: string, entityType: string, entityId: string) =>
    apiRequest<FavoriteItem>("/api/user/favorites", {
      method: "POST",
      token,
      body: { entityType, entityId },
    }),
  removeFavorite: (token: string, favoriteId: string) =>
    apiRequest<{ success: boolean }>(`/api/user/favorites/${encodeURIComponent(favoriteId)}`, {
      method: "DELETE",
      token,
    }),
  history: (token: string) => apiRequest<HistoryItem[]>("/api/user/history", { token }),
  recordHistory: (token: string, entityType: string, entityId: string) =>
    apiRequest<HistoryItem>("/api/user/history", {
      method: "POST",
      token,
      body: { entityType, entityId },
    }),
  adminLogin: (payload: LoginPayload) =>
    apiRequest<SessionPayload>("/api/admin/auth/login", {
      method: "POST",
      body: payload,
    }),
  adminSummary: (token: string) =>
    apiRequest<DashboardSummary>("/api/admin/dashboard/summary", { token }),
  adminAircraft: (token: string) =>
    apiRequest<AdminAircraftItem[]>("/api/admin/aircraft", { token }),
  reviewQueue: (token: string) =>
    apiRequest<ReviewQueueItem[]>("/api/admin/review-queue", { token }),
  validateAircraft: (
    token: string,
    payload: Record<string, unknown> & { requirePublishReady?: boolean },
  ) =>
    apiRequest<ValidationResult>("/api/admin/content/validate", {
      method: "POST",
      token,
      body: payload,
    }),
  createAircraft: (token: string, payload: Record<string, unknown>) =>
    apiRequest<Aircraft>("/api/admin/aircraft", {
      method: "POST",
      token,
      body: payload,
    }),
  updateAircraft: (token: string, id: string, payload: Record<string, unknown>) =>
    apiRequest<Aircraft>(`/api/admin/aircraft/${encodeURIComponent(id)}`, {
      method: "PUT",
      token,
      body: payload,
    }),
  submitReview: (token: string, entityType: string, entityId: string) =>
    apiRequest<Record<string, unknown>>("/api/admin/content/submit-review", {
      method: "POST",
      token,
      body: { entityType, entityId },
    }),
  approveReview: (token: string, workflowId: string, comment: string) =>
    apiRequest<ReviewResult>("/api/admin/content/approve", {
      method: "POST",
      token,
      body: { workflowId, comment },
    }),
  rejectReview: (token: string, workflowId: string, comment: string) =>
    apiRequest<ReviewResult>("/api/admin/content/reject", {
      method: "POST",
      token,
      body: { workflowId, comment },
    }),
  auditLogs: (token: string) => apiRequest<AuditLog[]>("/api/admin/audit-logs", { token }),
  uploadMedia: (token: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return apiRequest<UploadMediaResult>("/api/admin/media/upload", {
      method: "POST",
      token,
      body,
      isFormData: true,
    });
  },
};

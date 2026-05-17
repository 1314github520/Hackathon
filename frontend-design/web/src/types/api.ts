export type ApiError = {
  message: string;
  details: unknown;
};

export type ApiResponse<T> = {
  data: T;
  meta: Record<string, unknown> | null;
  error: ApiError | null;
};

export type AircraftSpecs = {
  lengthM: number | null;
  wingspanM: number | null;
  heightM?: number | null;
  maxSpeedKmh: number | null;
  cruiseSpeedKmh?: number | null;
  rangeKm: number | null;
  engineType: string;
  engineCount?: number | null;
  powerplantModel?: string;
  passengerCapacity?: number | null;
};

export type Aircraft = {
  id: string;
  slug: string;
  nameZh: string;
  nameEn?: string;
  aircraftType: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  eraLabel?: string;
  firstFlightYear: number | null;
  summary: string;
  description?: string;
  source?: string;
  sourceUrl?: string;
  coverImage?: string;
  specs: AircraftSpecs;
  status: string;
  specSourceConfidence?: string;
};

export type AircraftDetail = Aircraft & {
  relatedEvents: Array<{
    id: string;
    slug: string;
    title: string;
    summary: string;
    coverImage?: string;
  }>;
  relatedPersons: Array<{
    id: string;
    slug: string;
    nameZh: string;
    summary: string;
    coverImage?: string;
  }>;
};

export type EventItem = {
  id: string;
  slug: string;
  title: string;
  eventType: string;
  eventDate: string;
  locationName: string;
  summary: string;
  description: string;
  impact: string;
  coverImage?: string;
  relatedAircraftCount?: number;
  relatedPersonCount?: number;
  relatedAircraftIds?: string[];
  relatedPersonIds?: string[];
  status: string;
};

export type PersonItem = {
  id: string;
  slug: string;
  nameZh: string;
  nameEn?: string;
  personType: string;
  nationality: string;
  summary: string;
  biography: string;
  coverImage?: string;
  relatedAircraftCount?: number;
  relatedEventCount?: number;
  relatedAircraftIds?: string[];
  relatedEventIds?: string[];
  status: string;
};

export type SearchItem = {
  id: string;
  slug: string;
  entityType: "aircraft" | "event" | "person";
  title: string;
  summary: string;
  coverImage?: string;
  meta: Record<string, string | number | null>;
};

export type AuthUser = {
  id: string;
  username: string;
  nickname: string;
  userType: "frontend_user" | "admin_user";
};

export type LoginPayload = {
  username: string;
  password: string;
};

export type SessionPayload = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type FavoriteItem = {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  entityName: string;
  entitySlug?: string;
  entityCoverImage?: string;
  createdAt: string;
};

export type HistoryItem = {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  entityName: string;
  entitySlug?: string;
  entityCoverImage?: string;
  viewCount: number;
  lastViewedAt: string;
};

export type DashboardSummary = {
  publishedCount: number;
  missingFieldCount: number;
  reviewPendingCount: number;
  weeklyFixRate: string;
};

export type AdminAircraftItem = Aircraft & {
  missingFieldCount: number;
  blockingIssueCount: number;
  warningIssueCount: number;
};

export type ReviewQueueItem = {
  workflowId: string;
  entityId: string;
  entityName: string;
  entityStatus: string;
  entityCoverImage?: string;
  submittedAt: string;
  reviewerId: string;
  taskId: string | null;
  taskStatus: string | null;
};

export type UploadMediaResult = {
  filename: string;
  originalName: string;
  path: string;
  url: string;
};

export type ValidationResult = {
  passed: boolean;
  blockingIssues: string[];
  warningIssues: string[];
  missingFields: string[];
};

export type AuditLog = {
  id: string;
  createdAt: string;
  operatorId: string;
  operatorName: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
};

export type ReviewResult = {
  workflow: {
    id: string;
    workflowStatus: string;
    entityId: string;
  };
  task: {
    id: string;
    taskStatus: string;
    decision: string;
  };
};

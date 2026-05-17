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
  }>;
  relatedPersons: Array<{
    id: string;
    slug: string;
    nameZh: string;
    summary: string;
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
  createdAt: string;
};

export type HistoryItem = {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  entityName: string;
  viewCount: number;
  lastViewedAt: string;
};

export type DashboardSummary = {
  publishedCount: number;
  missingFieldCount: number;
  reviewPendingCount: number;
  weeklyFixRate: string;
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

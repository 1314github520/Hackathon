import { joinApiPath } from "@/lib/env";
import type { ApiResponse, SessionPayload } from "@/types/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: BodyInit | Record<string, unknown> | null;
  token?: string | null;
  isFormData?: boolean;
  searchParams?: Record<string, string | number | undefined | null>;
};

export class ApiClientError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

function buildUrl(path: string, searchParams?: RequestOptions["searchParams"]) {
  const url = new URL(joinApiPath(path), "http://localhost");

  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return `${url.pathname}${url.search}`;
}

export async function apiRequest<T>(
  path: string,
  { method = "GET", body = null, token, isFormData = false, searchParams }: RequestOptions = {},
): Promise<T> {
  const headers: HeadersInit = {
    Accept: "application/json",
  };

  let payload: BodyInit | undefined;
  if (body && isFormData) {
    payload = body as FormData;
  } else if (body && method !== "GET") {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, searchParams), {
    method,
    headers,
    body: payload,
    cache: "no-store",
  });

  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || result.error) {
    throw new ApiClientError(
      result.error?.message || "请求失败",
      response.status,
      result.error?.details || null,
    );
  }

  return result.data;
}

export function pickAccessToken(session: SessionPayload | null) {
  return session?.accessToken || null;
}

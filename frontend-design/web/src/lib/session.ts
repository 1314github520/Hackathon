"use client";

import { ApiClientError } from "@/lib/api/client";
import { api } from "@/lib/api/service";
import type { SessionPayload } from "@/types/api";

const FRONTEND_SESSION_KEY = "flyer-guide.frontend-session";
const ADMIN_SESSION_KEY = "flyer-guide.admin-session";

export type SessionKind = "frontend" | "admin";

function getStorageKey(kind: SessionKind) {
  return kind === "frontend" ? FRONTEND_SESSION_KEY : ADMIN_SESSION_KEY;
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiClientError && error.status === 401;
}

export function readStoredSession(kind: SessionKind) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(getStorageKey(kind));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionPayload;
  } catch {
    window.localStorage.removeItem(getStorageKey(kind));
    return null;
  }
}

export function writeStoredSession(kind: SessionKind, session: SessionPayload | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(getStorageKey(kind));
    return;
  }

  window.localStorage.setItem(getStorageKey(kind), JSON.stringify(session));
}

async function syncSession(
  kind: SessionKind,
  session: SessionPayload | null,
): Promise<SessionPayload | null> {
  if (!session) {
    return null;
  }

  try {
    if (kind === "frontend") {
      const user = await api.profile(session.accessToken);
      return {
        ...session,
        user,
      };
    }

    await api.adminSummary(session.accessToken);
    return session;
  } catch (error) {
    if (!isUnauthorizedError(error) || !session.refreshToken) {
      throw error;
    }
  }

  try {
    const refreshed = await api.refresh(session.refreshToken);
    const nextSession = {
      ...session,
      accessToken: refreshed.accessToken,
    };
    if (kind === "frontend") {
      const user = await api.profile(nextSession.accessToken);
      return {
        ...nextSession,
        user,
      };
    }

    await api.adminSummary(nextSession.accessToken);
    return nextSession;
  } catch {
    writeStoredSession(kind, null);
    return null;
  }
}

export async function syncFrontendSession(session: SessionPayload | null) {
  return syncSession("frontend", session);
}

export async function syncAdminSession(session: SessionPayload | null) {
  return syncSession("admin", session);
}

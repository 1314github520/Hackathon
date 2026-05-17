import type { SessionPayload } from "@/types/api";

const FRONTEND_KEY = "flyer-guide-frontend-session";
const ADMIN_KEY = "flyer-guide-admin-session";

function readSession(key: string): SessionPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionPayload;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function writeSession(key: string, value: SessionPayload | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!value) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getFrontendSession() {
  return readSession(FRONTEND_KEY);
}

export function setFrontendSession(value: SessionPayload | null) {
  writeSession(FRONTEND_KEY, value);
}

export function getAdminSession() {
  return readSession(ADMIN_KEY);
}

export function setAdminSession(value: SessionPayload | null) {
  writeSession(ADMIN_KEY, value);
}
